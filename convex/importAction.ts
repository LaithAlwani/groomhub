"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const contactSchema = v.object({
  client_name: v.string(),
  phones: v.array(
    v.object({ number: v.string(), type: v.optional(v.string()) }),
  ),
  email: v.optional(v.string()),
  notes: v.optional(v.string()),
  pets: v.array(v.object({ name: v.string(), breed: v.string() })),
});

export const importContacts = internalAction({
  args: {
    contacts: v.array(contactSchema),
  },
  handler: async (ctx, args) => {
    const BATCH_SIZE = 20;
    let totalInserted = 0;

    for (let i = 0; i < args.contacts.length; i += BATCH_SIZE) {
      const batch = args.contacts.slice(i, i + BATCH_SIZE);
      const result = (await ctx.runMutation(internal.contacts.importBatch, {
        contacts: batch,
      })) as { inserted: number };
      totalInserted += result.inserted;
    }

    return { totalInserted };
  },
});
