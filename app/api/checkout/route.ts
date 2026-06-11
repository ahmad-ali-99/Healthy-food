import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe, SLOT_PRICE_CENTS } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { slotId, email } = await req.json();

    if (typeof slotId !== "number" || !email?.includes("@")) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Verify slot is available
    const slot = await db.slot.findUnique({ where: { id: slotId } });
    if (!slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }
    if (slot.status !== "available") {
      return NextResponse.json({ error: "Slot already taken" }, { status: 409 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Image Slot #${slotId}`,
              description: `Row ${slot.row}, Column ${slot.col} — 1 of 1,000,000 slots`,
            },
            unit_amount: SLOT_PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/upload/${slotId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/gallery`,
      metadata: { slotId: String(slotId), email },
    });

    // Reserve slot
    await db.slot.update({
      where: { id: slotId },
      data: { status: "reserved", ownerEmail: email, stripeSession: session.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: unknown) {
    console.error("Checkout error:", e);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
