import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e: unknown) {
    console.error("Webhook signature error:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const slotId = parseInt(session.metadata?.slotId ?? "");
    const email = session.metadata?.email ?? session.customer_email ?? "";

    if (!isNaN(slotId)) {
      await db.slot.update({
        where: { id: slotId },
        data: {
          status: "sold",
          ownerEmail: email,
          purchasedAt: new Date(),
          stripeSession: session.id,
        },
      });
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    const slotId = parseInt(session.metadata?.slotId ?? "");
    if (!isNaN(slotId)) {
      await db.slot.updateMany({
        where: { id: slotId, status: "reserved", stripeSession: session.id },
        data: { status: "available", ownerEmail: null, stripeSession: null },
      });
    }
  }

  return NextResponse.json({ received: true });
}
