import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  clients: defineTable({
    first_name: v.string(),
    last_name: v.optional(v.string()),
    client_name: v.string(), // combined "first_name last_name" — used for search index + sorting
    phones: v.array(
      v.object({
        number: v.string(),
        type: v.optional(v.string()),
      }),
    ),
    email: v.optional(v.string()),
    phone_search: v.optional(v.string()),
    // Denormalized for list-view performance (no N+1 queries)
    pet_count: v.optional(v.number()),
    last_visit_date: v.optional(v.string()),
    last_visit_text: v.optional(v.string()),
    // Audit
    createdBy: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
    created_at: v.optional(v.number()),
    updated_at: v.optional(v.number()),
  })
    .index("by_phone",       ["phones"])
    .index("by_client_name", ["client_name"])
    .searchIndex("search_by_name",      { searchField: "client_name" })
    .searchIndex("search_by_last_name", { searchField: "last_name" })
    .searchIndex("search_by_phone",     { searchField: "phone_search" }),

  pets: defineTable({
    contact_id: v.id("clients"),
    name: v.string(),
    species: v.optional(v.string()),
    breed: v.string(),
    gender: v.optional(v.string()),
    birthdate: v.optional(v.string()),
    weight: v.optional(v.number()),
    temperament: v.optional(v.string()),
    allergies: v.optional(v.array(v.string())),
    imageId: v.optional(v.id("_storage")),
    notes: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
    created_at: v.optional(v.number()),
    updated_at: v.optional(v.number()),
  })
    .index("by_contact", ["contact_id"]),

  appointments: defineTable({
    contact_id: v.id("clients"),
    pet_id: v.optional(v.id("pets")),
    date: v.optional(v.string()),
    price: v.optional(v.number()),
    groomer: v.optional(v.string()),
    note_text: v.string(),
    is_legacy: v.optional(v.boolean()),
    createdBy:   v.optional(v.string()),
    createdById: v.optional(v.id("users")),
    created_at:  v.optional(v.number()),
    editedBy:    v.optional(v.string()),
    editedById:  v.optional(v.id("users")),
    edited_at:   v.optional(v.number()),
  })
    .index("by_contact_and_date", ["contact_id", "date"])
    .index("by_pet", ["pet_id"])
    .index("by_date", ["date"]),

  sessions: defineTable({
    userId:    v.id("users"),
    token:     v.string(),   // crypto-random hex token
    expiresAt: v.number(),   // Unix ms timestamp
  })
    .index("by_token", ["token"])
    .index("by_user",  ["userId"]),

  users: defineTable({
    displayName:     v.string(),
    username:        v.string(),
    passcode:        v.string(),
    isAdmin:         v.boolean(),
    failed_attempts: v.optional(v.number()),
  })
    .index("by_username", ["username"])
    .index("by_passcode", ["passcode"]),
});
