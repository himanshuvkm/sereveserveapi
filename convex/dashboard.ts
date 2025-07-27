import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getVendorStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || profile.role !== "vendor") {
      return null;
    }

    // Get orders
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_vendor", (q) => q.eq("vendorId", userId))
      .collect();

    // Calculate stats
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyOrders = orders.filter(order => order.orderDate >= startOfMonth.getTime());
    const monthlySpent = monthlyOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Get inventory alerts
    const inventory = await ctx.db
      .query("vendorInventory")
      .withIndex("by_vendor", (q) => q.eq("vendorId", userId))
      .collect();

    const lowStockItems = inventory.filter(item => item.currentStock <= item.minStockLevel);

    // Get active group buys
    const myGroupBuys = await ctx.db
      .query("groupBuying")
      .withIndex("by_creator", (q) => q.eq("createdBy", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return {
      totalOrders,
      totalSpent,
      monthlyOrders: monthlyOrders.length,
      monthlySpent,
      trustScore: profile.trustScore || 5.0,
      lowStockItems: lowStockItems.length,
      activeGroupBuys: myGroupBuys.length,
      recentOrders: orders.slice(0, 5),
    };
  },
});

export const getSupplierStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || profile.role !== "supplier") {
      return null;
    }

    // Get orders
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_supplier", (q) => q.eq("supplierId", userId))
      .collect();

    // Get products
    const products = await ctx.db
      .query("products")
      .withIndex("by_supplier", (q) => q.eq("supplierId", userId))
      .collect();

    // Calculate stats
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter(order => order.status === "delivered")
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyOrders = orders.filter(order => order.orderDate >= startOfMonth.getTime());
    const monthlyRevenue = monthlyOrders
      .filter(order => order.status === "delivered")
      .reduce((sum, order) => sum + order.totalAmount, 0);

    // Get unique vendors
    const uniqueVendors = new Set(orders.map(order => order.vendorId));

    // Get pending orders
    const pendingOrders = orders.filter(order => order.status === "pending");

    return {
      totalOrders,
      totalRevenue,
      monthlyOrders: monthlyOrders.length,
      monthlyRevenue,
      activeVendors: uniqueVendors.size,
      totalProducts: products.length,
      activeProducts: products.filter(p => p.isActive).length,
      pendingOrders: pendingOrders.length,
      recentOrders: orders.slice(0, 5),
    };
  },
});
