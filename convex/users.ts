import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createProfile = mutation({
  args: {
    role: v.union(v.literal("vendor"), v.literal("supplier")),
    businessName: v.string(),
    contactPhone: v.string(),
    address: v.string(),
    city: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) {
      throw new Error("Profile already exists");
    }

    const profileId = await ctx.db.insert("profiles", {
      userId,
      role: args.role,
      businessName: args.businessName,
      contactPhone: args.contactPhone,
      address: args.address,
      city: args.city,
      trustScore: args.role === "vendor" ? 5.0 : undefined,
      isVerified: false,
    });

    return profileId;
  },
});

export const getCurrentProfile = query({
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

    if (!profile) {
      return null;
    }

    const user = await ctx.db.get(userId);
    return {
      ...profile,
      email: user?.email,
    };
  },
});

export const updateProfile = mutation({
  args: {
    businessName: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found");
    }

    const updates: any = {};
    if (args.businessName !== undefined) updates.businessName = args.businessName;
    if (args.contactPhone !== undefined) updates.contactPhone = args.contactPhone;
    if (args.address !== undefined) updates.address = args.address;
    if (args.city !== undefined) updates.city = args.city;

    await ctx.db.patch(profile._id, updates);
    return profile._id;
  },
});
