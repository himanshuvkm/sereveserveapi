import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createOrder = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    groupBuyingId: v.optional(v.id("groupBuying")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify user is a vendor
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || profile.role !== "vendor") {
      throw new Error("Only vendors can create orders");
    }

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    let unitPrice = product.price;
    
    // If this is part of a group buy, use discounted price
    if (args.groupBuyingId) {
      const groupBuy = await ctx.db.get(args.groupBuyingId);
      if (groupBuy) {
        unitPrice = groupBuy.discountedPrice;
      }
    }

    const totalAmount = unitPrice * args.quantity;

    const orderId = await ctx.db.insert("orders", {
      vendorId: userId,
      supplierId: product.supplierId,
      productId: args.productId,
      quantity: args.quantity,
      unitPrice,
      totalAmount,
      status: "pending",
      orderDate: Date.now(),
      groupBuyingId: args.groupBuyingId,
    });

    return orderId;
  },
});

export const getVendorOrders = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_vendor", (q) => q.eq("vendorId", userId))
      .order("desc")
      .collect();

    // Get product and supplier details
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const product = await ctx.db.get(order.productId);
        const supplier = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", order.supplierId))
          .unique();
        
        return {
          ...order,
          productName: product?.name || "Unknown Product",
          productUnit: product?.unit || "",
          supplierName: supplier?.businessName || "Unknown Supplier",
        };
      })
    );

    return ordersWithDetails;
  },
});

export const getSupplierOrders = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_supplier", (q) => q.eq("supplierId", userId))
      .order("desc")
      .collect();

    // Get product and vendor details
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const product = await ctx.db.get(order.productId);
        const vendor = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", order.vendorId))
          .unique();
        
        return {
          ...order,
          productName: product?.name || "Unknown Product",
          productUnit: product?.unit || "",
          vendorName: vendor?.businessName || "Unknown Vendor",
        };
      })
    );

    return ordersWithDetails;
  },
});

export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Only supplier can update order status
    if (order.supplierId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.orderId, {
      status: args.status,
      deliveryDate: args.status === "delivered" ? Date.now() : undefined,
    });

    return args.orderId;
  },
});
