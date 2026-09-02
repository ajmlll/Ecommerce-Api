const Product = require('../models/Product');
const Category = require('../models/Category');
const categoryService = require('./category.service');
const ApiError = require('../utils/ApiError');

/**
 * Create a new product (Admin)
 */
const createProduct = async (data) => {
  // Validate category existence
  const categoryExists = await Category.findById(data.category);
  if (!categoryExists) {
    throw new ApiError(404, 'Category not found');
  }

  // Validate SKU uniqueness
  const skuUpper = data.sku.toUpperCase();
  const existingSku = await Product.findOne({ sku: skuUpper });
  if (existingSku) {
    throw new ApiError(400, 'Product with this SKU already exists');
  }

  // Validate salePrice <= price
  if (data.salePrice !== undefined && data.salePrice !== null) {
    if (data.salePrice > data.price) {
      throw new ApiError(400, 'Sale price must be less than or equal to regular price');
    }
  }

  const product = await Product.create({
    ...data,
    sku: skuUpper,
  });

  return product;
};

/**
 * Update an existing product (Admin)
 */
const updateProduct = async (id, data) => {
  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (data.category) {
    const categoryExists = await Category.findById(data.category);
    if (!categoryExists) {
      throw new ApiError(404, 'Category not found');
    }
  }

  if (data.sku) {
    const skuUpper = data.sku.toUpperCase();
    if (skuUpper !== product.sku) {
      const existingSku = await Product.findOne({ sku: skuUpper });
      if (existingSku) {
        throw new ApiError(400, 'Product with this SKU already exists');
      }
      data.sku = skuUpper;
    }
  }

  // Validate sale price vs price
  const effectivePrice = data.price !== undefined ? data.price : product.price;
  const effectiveSalePrice = data.salePrice !== undefined ? data.salePrice : product.salePrice;
  if (effectiveSalePrice !== null && effectiveSalePrice !== undefined) {
    if (effectiveSalePrice > effectivePrice) {
      throw new ApiError(400, 'Sale price must be less than or equal to regular price');
    }
  }

  Object.assign(product, data);
  await product.save();
  return product;
};

/**
 * Delete a product (Admin)
 */
const deleteProduct = async (id) => {
  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  return { message: 'Product deleted successfully' };
};

/**
 * Get product by ID (Public / Admin)
 */
const getProductById = async (id, isAdmin = false) => {
  const product = await Product.findById(id).populate('category', 'name slug');

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (!isAdmin && product.status !== 'active') {
    throw new ApiError(404, 'Product not found');
  }

  return product;
};

/**
 * Get products listing with text search, subtree category filtering, effective price filter, sorting, and pagination
 */
const getProducts = async (query, isAdmin = false) => {
  const filter = {};

  // Public listing only returns active products; admins can filter by status if supplied
  if (!isAdmin) {
    filter.status = 'active';
  } else if (query.status) {
    filter.status = query.status;
  }

  // Text search on name and description
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
    ];
  }

  // Parent-category filter includes all nested children, per the requirement.
  // We use categoryService.getDescendantIds(categoryId) to fetch the target category ID and all its descendant category IDs in the subtree,
  // then match products belonging to any category in the subtree ({ category: { $in: descendantIds } }).
  if (query.category) {
    const descendantCategoryIds = await categoryService.getDescendantIds(query.category);
    filter.category = { $in: descendantCategoryIds };
  }

  // Effective price filtering (salePrice if set & > 0, otherwise price)
  const minPrice = query.minPrice !== undefined ? Number(query.minPrice) : null;
  const maxPrice = query.maxPrice !== undefined ? Number(query.maxPrice) : null;

  if (minPrice !== null || maxPrice !== null) {
    const priceExpr = {
      $cond: [
        { $and: [{ $ne: ['$salePrice', null] }, { $gt: ['$salePrice', 0] }] },
        '$salePrice',
        '$price',
      ],
    };

    const exprConditions = [];
    if (minPrice !== null && !isNaN(minPrice)) {
      exprConditions.push({ $gte: [priceExpr, minPrice] });
    }
    if (maxPrice !== null && !isNaN(maxPrice)) {
      exprConditions.push({ $lte: [priceExpr, maxPrice] });
    }

    if (exprConditions.length === 1) {
      filter.$expr = exprConditions[0];
    } else if (exprConditions.length > 1) {
      filter.$expr = { $and: exprConditions };
    }
  }

  // Sorting
  let sortOption = { createdAt: -1 };
  if (query.sort === 'price_asc') {
    sortOption = { price: 1 };
  } else if (query.sort === 'price_desc') {
    sortOption = { price: -1 };
  } else if (query.sort === 'newest') {
    sortOption = { createdAt: -1 };
  }

  // Pagination
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: products,
    page,
    limit,
    total,
    totalPages,
  };
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getProducts,
};
