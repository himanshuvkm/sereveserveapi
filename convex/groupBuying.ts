import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createGroupBuy = mutation({
  args: {
    productId: v.id("products"),
    title: v.string(),
    description: v.string(),
    targetQuantity: v.number(),
    discountPercentage: v.number(),
    minParticipants: v.number(),
    maxParticipants: v.number(),
    deadline: v.number(),
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
      throw new Error("Only vendors can create group buys");
    }

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const discountedPrice = product.price * (1 - args.discountPercentage / 100);

    const groupBuyId = await ctx.db.insert("groupBuying", {
      productId: args.productId,
      supplierId: product.supplierId,
      createdBy: userId,
      title: args.title,
      description: args.description,
      targetQuantity: args.targetQuantity,
      currentQuantity: 0,
      discountPercentage: args.discountPercentage,
      originalPrice: product.price,
      discountedPrice,
      minParticipants: args.minParticipants,
      maxParticipants: args.maxParticipants,
      currentParticipants: 0,
      deadline: args.deadline,
      status: "active",
      createdAt: Date.now(),
    });

    return groupBuyId;
  },
});

export const joinGroupBuy = mutation({
  args: {
    groupBuyingId: v.id("groupBuying"),
    quantity: v.number(),
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
      throw new Error("Only vendors can join group buys");
    }

    const groupBuy = await ctx.db.get(args.groupBuyingId);
    if (!groupBuy || groupBuy.status !== "active") {
      throw new Error("Group buy not available");
    }

    // Check if already participating
    const existingParticipation = await ctx.db
      .query("groupParticipants")
      .withIndex("by_group", (q) => q.eq("groupBuyingId", args.groupBuyingId))
      .filter((q) => q.eq(q.field("vendorId"), userId))
      .unique();

    if (existingParticipation) {
      throw new Error("Already participating in this group buy");
    }

    // Check capacity
    if (groupBuy.currentParticipants >= groupBuy.maxParticipants) {
      throw new Error("Group buy is full");
    }

    // Add participant
    await ctx.db.insert("groupParticipants", {
      groupBuyingId: args.groupBuyingId,
      vendorId: userId,
      quantity: args.quantity,
      joinedAt: Date.now(),
    });

    // Update group buy stats
    await ctx.db.patch(args.groupBuyingId, {
      currentQuantity: groupBuy.currentQuantity + args.quantity,
      currentParticipants: groupBuy.currentParticipants + 1,
    });

    return args.groupBuyingId;
  },
});

export const getActiveGroupBuys = query({
  args: {},
  handler: async (ctx) => {
    const groupBuys = await ctx.db
      .query("groupBuying")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.gt(q.field("deadline"), Date.now()))
      .collect();

    // Get product and supplier info for each group buy
    const groupBuysWithDetails = await Promise.all(
      groupBuys.map(async (groupBuy) => {
        const product = await ctx.db.get(groupBuy.productId);
        const supplier = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", groupBuy.supplierId))
          .unique();
        
        return {
          ...groupBuy,
          productName: product?.name || "Unknown Product",
          productUnit: product?.unit || "",
          supplierName: supplier?.businessName || "Unknown Supplier",
        };
      })
    );

    return groupBuysWithDetails;
  },
});

export const getMyGroupBuys = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get group buys created by user
    const createdGroupBuys = await ctx.db
      .query("groupBuying")
      .withIndex("by_creator", (q) => q.eq("createdBy", userId))
      .collect();

    // Get group buys user is participating in
    const participations = await ctx.db
      .query("groupParticipants")
      .withIndex("by_vendor", (q) => q.eq("vendorId", userId))
      .collect();

    const participatingGroupBuys = await Promise.all(
      participations.map(async (participation) => {
        const groupBuy = await ctx.db.get(participation.groupBuyingId);
        return { ...groupBuy, userQuantity: participation.quantity };
      })
    );

    return {
      created: createdGroupBuys,
      participating: participatingGroupBuys.filter(Boolean),
    };
  },
});
