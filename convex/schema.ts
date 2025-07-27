import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // User profiles extending auth
  profiles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("vendor"), v.literal("supplier")),
    businessName: v.string(),
    contactPhone: v.string(),
    address: v.string(),
    city: v.string(),
    trustScore: v.optional(v.number()),
    isVerified: v.optional(v.boolean()),
  }).index("by_user", ["userId"]).index("by_role", ["role"]),

  // Products/Inventory for suppliers
  products: defineTable({
    supplierId: v.id("users"),
    name: v.string(),
    category: v.string(),
    description: v.string(),
    price: v.number(),
    unit: v.string(), // kg, pieces, liters, etc.
    quantity: v.number(),
    minOrderQuantity: v.number(),
    maxOrderQuantity: v.optional(v.number()),
    isActive: v.boolean(),
  }).index("by_supplier", ["supplierId"])
    .index("by_category", ["category"])
    .index("by_active", ["isActive"]),

  // Individual orders
  orders: defineTable({
    vendorId: v.id("users"),
    supplierId: v.id("users"),
    productId: v.id("products"),
    quantity: v.number(),
    unitPrice: v.number(),
    totalAmount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    orderDate: v.number(),
    deliveryDate: v.optional(v.number()),
    groupBuyingId: v.optional(v.id("groupBuying")),
  }).index("by_vendor", ["vendorId"])
    .index("by_supplier", ["supplierId"])
    .index("by_status", ["status"])
    .index("by_group", ["groupBuyingId"]),

  // Group buying feature
  groupBuying: defineTable({
    productId: v.id("products"),
    supplierId: v.id("users"),
    createdBy: v.id("users"), // vendor who initiated
    title: v.string(),
    description: v.string(),
    targetQuantity: v.number(),
    currentQuantity: v.number(),
    discountPercentage: v.number(),
    originalPrice: v.number(),
    discountedPrice: v.number(),
    minParticipants: v.number(),
    maxParticipants: v.number(),
    currentParticipants: v.number(),
    deadline: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
    createdAt: v.number(),
  }).index("by_product", ["productId"])
    .index("by_supplier", ["supplierId"])
    .index("by_status", ["status"])
    .index("by_creator", ["createdBy"]),

  // Group buying participants
  groupParticipants: defineTable({
    groupBuyingId: v.id("groupBuying"),
    vendorId: v.id("users"),
    quantity: v.number(),
    joinedAt: v.number(),
  }).index("by_group", ["groupBuyingId"])
    .index("by_vendor", ["vendorId"]),

  // Vendor inventory tracking
  vendorInventory: defineTable({
    vendorId: v.id("users"),
    productName: v.string(),
    category: v.string(),
    currentStock: v.number(),
    minStockLevel: v.number(),
    unit: v.string(),
    lastRestocked: v.number(),
    supplierId: v.optional(v.id("users")),
  }).index("by_vendor", ["vendorId"])
    .index("by_category", ["category"]),

  // Revenue tracking
  revenue: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    amount: v.number(),
    type: v.union(v.literal("daily"), v.literal("order")),
    orderId: v.optional(v.id("orders")),
  }).index("by_user_date", ["userId", "date"])
    .index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
