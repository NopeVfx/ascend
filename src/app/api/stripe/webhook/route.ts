import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function customerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe || !env.stripeWebhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook not configured." },
      { status: 503 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.stripeWebhookSecret,
    );
  } catch (err) {
    console.error("Stripe signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Service role key not configured." },
      { status: 500 },
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.user_id ?? session.client_reference_id;
      if (userId) {
        await admin
          .from("profiles")
          .update({
            is_premium: true,
            stripe_customer_id: customerId(session.customer),
          })
          .eq("id", userId);
      }
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object;
      const active = sub.status === "active" || sub.status === "trialing";
      const userId = sub.metadata?.user_id;
      const query = admin.from("profiles").update({ is_premium: active });
      if (userId) {
        await query.eq("id", userId);
      } else {
        const cid = customerId(sub.customer);
        if (cid) await query.eq("stripe_customer_id", cid);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const userId = sub.metadata?.user_id;
      const query = admin.from("profiles").update({ is_premium: false });
      if (userId) {
        await query.eq("id", userId);
      } else {
        const cid = customerId(sub.customer);
        if (cid) await query.eq("stripe_customer_id", cid);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
