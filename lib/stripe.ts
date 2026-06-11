import Stripe from "stripe";

export const SLOT_PRICE_CENTS = 50;

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key === "sk_test_placeholder") {
      throw new Error("Stripe secret key not configured");
    }
    _stripe = new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
  }
  return _stripe;
}

export { _stripe as stripe };
