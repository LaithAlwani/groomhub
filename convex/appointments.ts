import { query, mutation } from "./_generated/server";
import { MutationCtx, QueryCtx } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import {
  requireShopAccess,
  requireAdmin,
  requireApptAccess,
  isAdminRole,
  canSeeAppt,
} from "./sessions";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

function timeToMinutes(t: string | undefined | null): number | null {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

// Throws a ConvexError("groomer_conflict") if the (groomerId, date, time, duration)
// tuple overlaps any other active appointment for the same groomer on the same day.
// excludeId skips the appointment being edited/moved itself.
async function assertNoGroomerConflict(
  ctx: QueryCtx | MutationCtx,
  args: {
    shopId: Id<"shops">;
    groomerId: string | undefined;
    date: string | undefined;
    time: string | undefined;
    duration: number | undefined;
    excludeId?: Id<"appointments">;
  },
) {
  if (!args.groomerId || !args.date || !args.time) return;
  const newStart = timeToMinutes(args.time);
  if (newStart === null) return;
  const newEnd = newStart + (args.duration ?? 60);

  const candidates = await ctx.db
    .query("appointments")
    .withIndex("by_shop_and_groomer", (q) =>
      q.eq("shopId", args.shopId).eq("groomerId", args.groomerId),
    )
    .take(500);

  for (const a of candidates) {
    if (args.excludeId && a._id === args.excludeId) continue;
    if (a.date !== args.date) continue;
    if (a.status === "cancelled" || a.status === "completed") continue;
    const existingStart = timeToMinutes(a.time);
    if (existingStart === null) continue;
    const existingEnd = existingStart + (a.duration ?? 60);
    if (newStart < existingEnd && existingStart < newEnd) {
      const client = a.contact_id ? await ctx.db.get(a.contact_id) : null;
      const clientName = client
        ? `${client.first_name}${client.last_name ? " " + client.last_name : ""}`
        : null;
      throw new ConvexError({
        kind:        "groomer_conflict",
        time:        a.time ?? null,
        duration:    a.duration ?? 60,
        clientName,
        groomerName: a.groomer ?? null,
        date:        a.date ?? null,
      });
    }
  }
}

async function refreshLastVisit(ctx: MutationCtx, contactId: Id<"clients">) {
  const all = await ctx.db
    .query("appointments")
    .withIndex("by_contact_and_date", (q) => q.eq("contact_id", contactId))
    .take(1000);

  const withDate = all.filter((a) => !!a.date);
  withDate.sort((a, b) => (b.date! > a.date! ? 1 : -1));

  const latest =
    withDate[0] ?? all.sort((a, b) => b._creationTime - a._creationTime)[0];

  await ctx.db.patch(contactId, {
    last_visit_date: latest?.date,
    last_visit_text: latest?.note_text,
  });
}

export const getScheduleAppointments = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const { identity, shopId } = await requireShopAccess(ctx);
    const admin = isAdminRole(identity["org_role"] as string | undefined);

    const appts = await ctx.db
      .query("appointments")
      .withIndex("by_shop_and_date", (q) =>
        q.eq("shopId", shopId).eq("date", args.date)
      )
      .take(200);

    const filtered = admin ? appts : appts.filter((a) => canSeeAppt(a, identity.tokenIdentifier));

    const enriched = await Promise.all(
      filtered.map(async (a) => {
        const client = a.contact_id ? await ctx.db.get(a.contact_id) : null;
        const pet    = a.pet_id     ? await ctx.db.get(a.pet_id)     : null;
        return {
          ...a,
          clientName: client ? `${client.first_name}${client.last_name ? " " + client.last_name : ""}` : "Unknown",
          petName:    pet?.name ?? null,
        };
      })
    );

    enriched.sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time < b.time ? -1 : 1;
    });

    return enriched;
  },
});

export const getPendingApprovals = query({
  args: {},
  handler: async (ctx) => {
    const { identity, shopId } = await requireShopAccess(ctx);
    const admin = isAdminRole(identity["org_role"] as string | undefined);

    const pending = await ctx.db
      .query("appointments")
      .withIndex("by_shop_and_status", (q) =>
        q.eq("shopId", shopId).eq("status", "pending")
      )
      .take(200);

    const filtered = admin ? pending : pending.filter((a) => canSeeAppt(a, identity.tokenIdentifier));

    return await Promise.all(
      filtered.map(async (a) => {
        const client = a.contact_id ? await ctx.db.get(a.contact_id) : null;
        const pet    = a.pet_id     ? await ctx.db.get(a.pet_id)     : null;
        return {
          ...a,
          clientName:  client ? `${client.first_name}${client.last_name ? " " + client.last_name : ""}` : "Unknown",
          clientEmail: client?.email ?? null,
          petName:     pet?.name ?? null,
        };
      })
    );
  },
});

export const getTodayAppointments = query({
  args: { today: v.string() },
  handler: async (ctx, args) => {
    const { identity, shopId } = await requireShopAccess(ctx);
    const admin = isAdminRole(identity["org_role"] as string | undefined);

    const appts = await ctx.db
      .query("appointments")
      .withIndex("by_shop_and_date", (q) =>
        q.eq("shopId", shopId).eq("date", args.today)
      )
      .take(200);

    const filtered = (admin ? appts : appts.filter((a) => canSeeAppt(a, identity.tokenIdentifier)))
      .filter((a) => a.status !== "cancelled");

    return await Promise.all(
      filtered.map(async (a) => {
        const client = a.contact_id ? await ctx.db.get(a.contact_id) : null;
        const pet    = a.pet_id     ? await ctx.db.get(a.pet_id)     : null;
        return {
          ...a,
          clientName: client ? `${client.first_name}${client.last_name ? " " + client.last_name : ""}` : "Unknown",
          petName:    pet?.name ?? null,
        };
      })
    );
  },
});

export const addAppointment = mutation({
  args: {
    contactId:    v.id("clients"),
    petId:        v.optional(v.id("pets")),
    date:         v.optional(v.string()),
    time:         v.optional(v.string()),
    duration:     v.optional(v.number()),
    service_type: v.optional(v.string()),
    note_text:    v.optional(v.string()),
    groomer:      v.optional(v.string()),
    groomerId:    v.optional(v.string()),
    price:        v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { identity, shop, shopId } = await requireShopAccess(ctx);

    const client = await ctx.db.get(args.contactId);
    if (!client || client.shopId !== shopId) throw new Error("Client not found");

    const isAdmin = isAdminRole(identity["org_role"] as string | undefined);
    const requestedGroomerId = args.groomerId?.trim() || undefined;
    if (!isAdmin && requestedGroomerId && requestedGroomerId !== identity.tokenIdentifier) {
      throw new Error("Forbidden: staff can only book appointments for themselves");
    }

    await assertNoGroomerConflict(ctx, {
      shopId,
      groomerId: requestedGroomerId,
      date:      args.date?.trim() || undefined,
      time:      args.time?.trim() || undefined,
      duration:  args.duration,
    });

    const apptId = await ctx.db.insert("appointments", {
      shopId,
      contact_id:   args.contactId,
      pet_id:       args.petId,
      date:         args.date?.trim()         || undefined,
      time:         args.time?.trim()         || undefined,
      duration:     args.duration,
      service_type: args.service_type?.trim() || undefined,
      status:       "pending",
      note_text:    args.note_text?.trim()    || undefined,
      groomer:      args.groomer?.trim()      || undefined,
      groomerId:    requestedGroomerId,
      price:        args.price,
      createdBy:    identity.name ?? identity.email ?? "Unknown",
      createdById:  identity.tokenIdentifier,
      created_at:   Date.now(),
    });

    await refreshLastVisit(ctx, args.contactId);

    if (client.email) {
      const pet = args.petId ? await ctx.db.get(args.petId) : null;
      await ctx.scheduler.runAfter(0, internal.email.sendBookingEmail, {
        clientEmail: client.email,
        clientName:  `${client.first_name}${client.last_name ? " " + client.last_name : ""}`,
        petName:     pet?.name ?? null,
        shopName:    shop.name,
        date:        args.date ?? null,
        time:        args.time ?? null,
        serviceType: args.service_type ?? null,
      });
    }

    return apptId;
  },
});

export const updateAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    petId:         v.optional(v.id("pets")),
    date:          v.optional(v.string()),
    time:          v.optional(v.string()),
    duration:      v.optional(v.number()),
    service_type:  v.optional(v.string()),
    note_text:     v.optional(v.string()),
    groomer:       v.optional(v.string()),
    groomerId:     v.optional(v.string()),
    price:         v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { identity, isAdmin, shopId, appt } = await requireApptAccess(ctx, args.appointmentId);

    const requestedGroomerId = args.groomerId?.trim() || undefined;
    if (!isAdmin && requestedGroomerId && requestedGroomerId !== identity.tokenIdentifier) {
      throw new Error("Forbidden: staff cannot reassign appointments to other groomers");
    }

    await assertNoGroomerConflict(ctx, {
      shopId,
      groomerId: requestedGroomerId,
      date:      args.date?.trim() || undefined,
      time:      args.time?.trim() || undefined,
      duration:  args.duration,
      excludeId: args.appointmentId,
    });

    await ctx.db.patch(args.appointmentId, {
      pet_id:       args.petId,
      date:         args.date?.trim()         || undefined,
      time:         args.time?.trim()         || undefined,
      duration:     args.duration,
      service_type: args.service_type?.trim() || undefined,
      note_text:    args.note_text?.trim()    || undefined,
      groomer:      args.groomer?.trim()      || undefined,
      groomerId:    requestedGroomerId,
      price:        args.price,
      editedBy:     identity.name ?? identity.email ?? "Unknown",
      editedById:   identity.tokenIdentifier,
      edited_at:    Date.now(),
    });

    await refreshLastVisit(ctx, appt.contact_id);
  },
});

export const approveAppointment = mutation({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    const { identity, shop, appt } = await requireApptAccess(ctx, args.appointmentId);

    await ctx.db.patch(args.appointmentId, {
      status:     "confirmed",
      editedBy:   identity.name ?? identity.email ?? "Unknown",
      editedById: identity.tokenIdentifier,
      edited_at:  Date.now(),
    });

    const client = await ctx.db.get(appt.contact_id);
    if (client?.email) {
      const pet = appt.pet_id ? await ctx.db.get(appt.pet_id) : null;
      await ctx.scheduler.runAfter(0, internal.email.sendApprovalEmail, {
        clientEmail: client.email,
        clientName:  `${client.first_name}${client.last_name ? " " + client.last_name : ""}`,
        petName:     pet?.name ?? null,
        shopName:    shop.name,
        date:        appt.date ?? null,
        time:        appt.time ?? null,
        serviceType: appt.service_type ?? null,
      });
    }
  },
});

export const rejectAppointment = mutation({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    const { identity, shop, appt } = await requireApptAccess(ctx, args.appointmentId);
    if (appt.status !== "pending") throw new Error("Can only reject pending appointments");

    await ctx.db.patch(args.appointmentId, {
      status:     "cancelled",
      editedBy:   identity.name ?? identity.email ?? "Unknown",
      editedById: identity.tokenIdentifier,
      edited_at:  Date.now(),
    });

    const client = await ctx.db.get(appt.contact_id);
    if (client?.email) {
      const pet = appt.pet_id ? await ctx.db.get(appt.pet_id) : null;
      await ctx.scheduler.runAfter(0, internal.email.sendRejectionEmail, {
        clientEmail: client.email,
        clientName:  `${client.first_name}${client.last_name ? " " + client.last_name : ""}`,
        petName:     pet?.name ?? null,
        shopName:    shop.name,
        date:        appt.date ?? null,
        time:        appt.time ?? null,
        serviceType: appt.service_type ?? null,
      });
    }
  },
});

export const completeAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    note_text:     v.optional(v.string()),
    price:         v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { identity, shopId } = await requireAdmin(ctx);

    const appt = await ctx.db.get(args.appointmentId);
    if (!appt || appt.shopId !== shopId) throw new Error("Appointment not found");

    const patch: Record<string, unknown> = {
      status:     "completed",
      editedBy:   identity.name ?? identity.email ?? "Unknown",
      editedById: identity.tokenIdentifier,
      edited_at:  Date.now(),
    };
    if (args.note_text?.trim()) patch.note_text = args.note_text.trim();
    if (args.price != null)     patch.price     = args.price;

    await ctx.db.patch(args.appointmentId, patch);

    if (args.note_text?.trim()) {
      await refreshLastVisit(ctx, appt.contact_id);
    }
  },
});

export const moveAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    date:          v.string(),
    time:          v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity, shopId, appt } = await requireApptAccess(ctx, args.appointmentId);

    await assertNoGroomerConflict(ctx, {
      shopId,
      groomerId: appt.groomerId,
      date:      args.date,
      time:      args.time,
      duration:  appt.duration,
      excludeId: args.appointmentId,
    });

    await ctx.db.patch(args.appointmentId, {
      date:       args.date,
      time:       args.time,
      editedBy:   identity.name ?? identity.email ?? "Unknown",
      editedById: identity.tokenIdentifier,
      edited_at:  Date.now(),
    });
  },
});

export const cancelAppointment = mutation({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    const { identity } = await requireApptAccess(ctx, args.appointmentId);

    await ctx.db.patch(args.appointmentId, {
      status:     "cancelled",
      editedBy:   identity.name ?? identity.email ?? "Unknown",
      editedById: identity.tokenIdentifier,
      edited_at:  Date.now(),
    });
  },
});
