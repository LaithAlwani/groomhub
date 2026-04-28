import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  shops: defineTable({
    clerkOrgId:    v.string(),
    name:          v.string(),
    slug:          v.string(),
    plan:          v.union(v.literal("trial"), v.literal("active"), v.literal("suspended")),
    logoStorageId: v.optional(v.id("_storage")),
    createdAt:     v.number(),
  }).index("by_clerkOrgId", ["clerkOrgId"]),

  clients: defineTable({
    shopId:          v.id("shops"),
    first_name:      v.string(),
    last_name:       v.optional(v.string()),
    client_name:     v.string(),
    phones:          v.array(v.object({ number: v.string(), type: v.optional(v.string()) })),
    email:           v.optional(v.string()),
    phone_search:    v.optional(v.string()),
    pet_count:       v.optional(v.number()),
    last_visit_date: v.optional(v.string()),
    last_visit_text: v.optional(v.string()),
    address:         v.optional(v.string()),
    city:            v.optional(v.string()),
    province:        v.optional(v.string()),
    postal_code:     v.optional(v.string()),
    is_blacklisted:  v.optional(v.boolean()),
    createdBy:       v.optional(v.string()),
    updatedBy:       v.optional(v.string()),
    created_at:      v.optional(v.number()),
    updated_at:      v.optional(v.number()),
  })
    .index("by_shop_and_name", ["shopId", "client_name"])
    .searchIndex("search_by_name",      { searchField: "client_name",  filterFields: ["shopId"] })
    .searchIndex("search_by_last_name", { searchField: "last_name",    filterFields: ["shopId"] })
    .searchIndex("search_by_phone",     { searchField: "phone_search", filterFields: ["shopId"] }),

  pets: defineTable({
    shopId:         v.id("shops"),
    contact_id:     v.id("clients"),
    name:           v.string(),
    species:        v.optional(v.string()),
    breed:          v.string(),
    gender:         v.optional(v.string()),
    birthdate:      v.optional(v.string()),
    weight:         v.optional(v.number()),
    temperament:          v.optional(v.string()),
    status:               v.optional(v.string()),
    medical_conditions:   v.optional(v.array(v.string())),
    allergies:            v.optional(v.array(v.string())),
    imageId:        v.optional(v.id("_storage")),
    notes:          v.optional(v.string()),
    is_active:      v.optional(v.boolean()),
    is_blacklisted: v.optional(v.boolean()),
    created_at:     v.optional(v.number()),
    updated_at:     v.optional(v.number()),
  }).index("by_contact", ["contact_id"]),

  appointments: defineTable({
    shopId:      v.id("shops"),
    contact_id:  v.id("clients"),
    pet_id:      v.optional(v.id("pets")),
    date:        v.optional(v.string()),
    price:       v.optional(v.number()),
    groomer:     v.optional(v.string()),
    note_text:   v.string(),
    is_legacy:   v.optional(v.boolean()),
    createdBy:   v.optional(v.string()),
    createdById: v.optional(v.string()),
    created_at:  v.optional(v.number()),
    editedBy:    v.optional(v.string()),
    editedById:  v.optional(v.string()),
    edited_at:   v.optional(v.number()),
  })
    .index("by_contact_and_date", ["contact_id", "date"])
    .index("by_shop_and_date",    ["shopId", "date"])
    .index("by_pet",              ["pet_id"]),

  vaccinations: defineTable({
    shopId:            v.id("shops"),
    pet_id:            v.id("pets"),
    contact_id:        v.id("clients"),
    vaccine_name:      v.string(),
    administered_date: v.string(),
    due_date:          v.optional(v.string()),
    vet_clinic:        v.optional(v.string()),
    vet_phone:         v.optional(v.string()),
    notes:             v.optional(v.string()),
    createdBy:         v.optional(v.string()),
    created_at:        v.optional(v.number()),
    updated_at:        v.optional(v.number()),
  })
    .index("by_pet",     ["pet_id"])
    .index("by_contact", ["contact_id"]),

  users: defineTable({
    shopId:          v.id("shops"),
    tokenIdentifier: v.string(),
    displayName:     v.string(),
  })
    .index("by_shop",           ["shopId"])
    .index("by_shop_and_token", ["shopId", "tokenIdentifier"]),
});
