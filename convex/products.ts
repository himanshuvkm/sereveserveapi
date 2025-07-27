import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createProduct = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    description: v.string(),
    price: v.number(),
    unit: v.string(),
    quantity: v.number(),
    minOrderQuantity: v.number(),
    maxOrderQuantity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify user is a supplier
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || profile.role !== "supplier") {
      throw new Error("Only suppliers can create products");
    }

    const productId = await ctx.db.insert("products", {
      supplierId: userId,
      name: args.name,
      category: args.category,
      description: args.description,
      price: args.price,
      unit: args.unit,
      quantity: args.quantity,
      minOrderQuantity: args.minOrderQuantity,
      maxOrderQuantity: args.maxOrderQuantity,
      isActive: true,
    });

    return productId;
  },
});

export const getSupplierProducts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("products")
      .withIndex("by_supplier", (q) => q.eq("supplierId", userId))
      .collect();
  },
});

export const getAllActiveProducts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Get supplier info for each product
    const productsWithSuppliers = await Promise.all(
      products.map(async (product) => {
        const supplier = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", product.supplierId))
          .unique();
        
        return {
          ...product,
          supplierName: supplier?.businessName || "Unknown Supplier",
          supplierCity: supplier?.city || "",
        };
      })
    );

    return productsWithSuppliers;
  },
});

export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    unit: v.optional(v.string()),
    quantity: v.optional(v.number()),
    minOrderQuantity: v.optional(v.number()),
    maxOrderQuantity: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const product = await ctx.db.get(args.productId);
    if (!product || product.supplierId !== userId) {
      throw new Error("Product not found or unauthorized");
    }

    const updates: any = {};
    Object.keys(args).forEach((key) => {
      if (key !== "productId" && args[key as keyof typeof args] !== undefined) {
        updates[key] = args[key as keyof typeof args];
      }
    });

    await ctx.db.patch(args.productId, updates);
    return args.productId;
  },
});

export const deleteProduct = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const product = await ctx.db.get(args.productId);
    if (!product || product.supplierId !== userId) {
      throw new Error("Product not found or unauthorized");
    }

    await ctx.db.delete(args.productId);
    return args.productId;
  },
});
