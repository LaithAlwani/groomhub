import { internalAction } from "./_generated/server";
import { v } from "convex/values";

function formatDate(date: string | null): string {
  if (!date) return "a scheduled date";
  const [y, m, d] = date.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

function formatTime(time: string | null): string {
  if (!time) return "";
  const [h, min] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return ` at ${hour}:${String(min).padStart(2, "0")} ${period}`;
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping email to", to);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      from:    "GroomHub <onboarding@resend.dev>",
      to:      [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("Resend error:", res.status, body);
  }
}

export const sendBookingEmail = internalAction({
  args: {
    clientEmail: v.string(),
    clientName:  v.string(),
    petName:     v.union(v.string(), v.null()),
    shopName:    v.string(),
    date:        v.union(v.string(), v.null()),
    time:        v.union(v.string(), v.null()),
    serviceType: v.union(v.string(), v.null()),
  },
  handler: async (_ctx, args) => {
    const petPart     = args.petName     ? ` for <strong>${args.petName}</strong>` : "";
    const servicePart = args.serviceType ? ` (${args.serviceType})` : "";
    const datePart    = formatDate(args.date);
    const timePart    = formatTime(args.time);

    await sendEmail(
      args.clientEmail,
      `Appointment Booked — ${args.shopName}`,
      `
        <p>Hi ${args.clientName},</p>
        <p>Your appointment${petPart}${servicePart} has been requested for <strong>${datePart}${timePart}</strong>.</p>
        <p>We'll send you a confirmation once it's approved.</p>
        <p>— ${args.shopName}</p>
      `,
    );
  },
});

export const sendRejectionEmail = internalAction({
  args: {
    clientEmail: v.string(),
    clientName:  v.string(),
    petName:     v.union(v.string(), v.null()),
    shopName:    v.string(),
    date:        v.union(v.string(), v.null()),
    time:        v.union(v.string(), v.null()),
    serviceType: v.union(v.string(), v.null()),
  },
  handler: async (_ctx, args) => {
    const petPart     = args.petName     ? ` for <strong>${args.petName}</strong>` : "";
    const servicePart = args.serviceType ? ` (${args.serviceType})` : "";
    const datePart    = formatDate(args.date);
    const timePart    = formatTime(args.time);

    await sendEmail(
      args.clientEmail,
      `Appointment Declined — ${args.shopName}`,
      `
        <p>Hi ${args.clientName},</p>
        <p>Unfortunately, your appointment${petPart}${servicePart} scheduled for <strong>${datePart}${timePart}</strong> has been declined.</p>
        <p>Please contact us to reschedule with another groomer.</p>
        <p>— ${args.shopName}</p>
      `,
    );
  },
});

export const sendApprovalEmail = internalAction({
  args: {
    clientEmail: v.string(),
    clientName:  v.string(),
    petName:     v.union(v.string(), v.null()),
    shopName:    v.string(),
    date:        v.union(v.string(), v.null()),
    time:        v.union(v.string(), v.null()),
    serviceType: v.union(v.string(), v.null()),
  },
  handler: async (_ctx, args) => {
    const petPart     = args.petName     ? ` for <strong>${args.petName}</strong>` : "";
    const servicePart = args.serviceType ? ` (${args.serviceType})` : "";
    const datePart    = formatDate(args.date);
    const timePart    = formatTime(args.time);

    await sendEmail(
      args.clientEmail,
      `Appointment Confirmed — ${args.shopName}`,
      `
        <p>Hi ${args.clientName},</p>
        <p>Your appointment${petPart}${servicePart} on <strong>${datePart}${timePart}</strong> is confirmed!</p>
        <p>We look forward to seeing you.</p>
        <p>— ${args.shopName}</p>
      `,
    );
  },
});
