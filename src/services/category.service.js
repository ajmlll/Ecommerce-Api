const mongoose = require('mongoose');
const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');

/**
 * Build ancestors array for a category based on its parentId.
 * @param {string|null} parentId 
 * @returns {Promise<Array<mongoose.Types.ObjectId>>}
 */
const buildAncestors = async (parentId) => {
  if (!parentId) {
    return [];
  }

  const parent = await Category.findById(parentId);
  if (!parent) {
    throw new ApiError(404, 'Parent category not found');
  }

  return [...parent.ancestors, parent._id];
};

/**
 * Assert that setting newParentId as parent of categoryId will not create a cycle.
 * @param {string} categoryId 
 * @param {string} newParentId 
 */
const assertNoCycle = async (categoryId, newParentId) => {
  if (!newParentId) return;

  const categoryIdStr = categoryId.toString();
  const newParentIdStr = newParentId.toString();

  // 1. Direct self-reference check
  if (categoryIdStr === newParentIdStr) {
    throw new ApiError(400, 'Invalid parent: would create a circular reference');
  }

  // 2. Ancestor chain check
  const targetParent = await Category.findById(newParentId);
  if (!targetParent) {
    throw new ApiError(404, 'Parent category not found');
  }

  const isDescendant = targetParent.ancestors.some(
    (ancestorId) => ancestorId.toString() === categoryIdStr
  );

  if (isDescendant) {
    throw new ApiError(400, 'Invalid parent: would create a circular reference');
  }
};

/**
 * Create a new category
 */
const createCategory = async (data) => {
  const { name, parent, isActive } = data;

  const ancestors = await buildAncestors(parent);

  const category = await Category.create({
    name,
    parent: parent || null,
    ancestors,
    isActive: isActive !== undefined ? isActive : true,
  });

  return category;
};

/**
 * Update an existing category and propagate path changes to descendants
 */
const updateCategory = async (id, data) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  const parentChanged =
    data.parent !== undefined &&
    String(data.parent || null) !== String(category.parent || null);

  if (parentChanged) {
    const newParentId = data.parent || null;
    if (newParentId) {
      await assertNoCycle(id, newParentId);
    }
  }

  // Handle multi-document update logic safely
  const updateOperation = async (session = null) => {
    if (data.name !== undefined) category.name = data.name;
    if (data.isActive !== undefined) category.isActive = data.isActive;

    if (parentChanged) {
      const newParentId = data.parent || null;
      const newAncestors = await buildAncestors(newParentId);

      const oldPrefix = [...category.ancestors, category._id];
      const newPrefix = [...newAncestors, category._id];

      category.parent = newParentId;
      category.ancestors = newAncestors;

      // Find all descendant categories containing this categoryId in their ancestors
      const descendants = await Category.find({ ancestors: id }).session(session);

      for (const descendant of descendants) {
        const catIndex = descendant.ancestors.findIndex(
          (aId) => aId.toString() === id.toString()
        );
        if (catIndex !== -1) {
          const remainingTail = descendant.ancestors.slice(catIndex + 1);
          descendant.ancestors = [...newPrefix, ...remainingTail];
          await descendant.save({ session });
        }
      }
    }

    await category.save({ session });
    return category;
  };

  // Attempt transaction if connected to live MongoDB replica set, fallback cleanly if standalone/mock
  let session = null;
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      session = await mongoose.startSession();
      let result;
      await session.withTransaction(async () => {
        result = await updateOperation(session);
      });
      return result;
    } else {
      return await updateOperation(null);
    }
  } catch (error) {
    // Fallback without transaction if replica set is not initialized
    if (
      error.message &&
      (error.message.includes('Transaction numbers are only allowed') ||
        error.message.includes('standalone'))
    ) {
      return await updateOperation(null);
    }
    throw error;
  } finally {
    if (session) session.endSession();
  }
};

/**
 * Delete category safely (reject if child categories exist)
 */
const deleteCategory = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  // Check for child categories
  const hasChildren = await Category.findOne({ parent: id });
  if (hasChildren) {
    throw new ApiError(
      400,
      'Cannot delete category: it has child categories assigned to it'
    );
  }

  // Check for associated products (if Product model exists in future)
  if (mongoose.models.Product) {
    const hasProducts = await mongoose.models.Product.findOne({ category: id });
    if (hasProducts) {
      throw new ApiError(
        400,
        'Cannot delete category: it has products assigned to it'
      );
    }
  }

  await Category.findByIdAndDelete(id);
  return { message: 'Category deleted successfully' };
};

/**
 * Fetch nested full hierarchy tree in memory
 */
const getTree = async () => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });

  const categoryMap = {};
  const roots = [];

  categories.forEach((cat) => {
    categoryMap[cat._id.toString()] = {
      ...cat.toJSON(),
      children: [],
    };
  });

  categories.forEach((cat) => {
    const catIdStr = cat._id.toString();
    const parentIdStr = cat.parent ? cat.parent.toString() : null;

    if (parentIdStr && categoryMap[parentIdStr]) {
      categoryMap[parentIdStr].children.push(categoryMap[catIdStr]);
    } else {
      roots.push(categoryMap[catIdStr]);
    }
  });

  // Recursive sort function for children arrays at all levels
  const sortChildren = (nodeList) => {
    nodeList.sort((a, b) => a.name.localeCompare(b.name));
    nodeList.forEach((node) => {
      if (node.children.length > 0) {
        sortChildren(node.children);
      }
    });
  };

  sortChildren(roots);
  return roots;
};

/**
 * Get category ID and all descendant IDs (useful for product filtering)
 */
const getDescendantIds = async (categoryId) => {
  const descendants = await Category.find({ ancestors: categoryId }).select('_id');
  return [categoryId.toString(), ...descendants.map((d) => d._id.toString())];
};

/**
 * Get flat paginated category list
 */
const getAllCategories = async (query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const [categories, total] = await Promise.all([
    Category.find().populate('parent', 'name slug').skip(skip).limit(limit).sort({ name: 1 }),
    Category.countDocuments(),
  ]);

  return {
    categories,
    pagination: {
      totalCategories: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      limit,
    },
  };
};

module.exports = {
  buildAncestors,
  assertNoCycle,
  createCategory,
  updateCategory,
  deleteCategory,
  getTree,
  getDescendantIds,
  getAllCategories,
};
