import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNewBookingAlert, sendBookingConfirmation } from "@/lib/resend";
import type { Booking } from "@/types";

// GET /api/bookings — admin only, list all bookings with optional filters
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const search = searchParams.get("search");

  const supabase = createAdminClient();
  let query = supabase
    .from("bookings")
    .select("*, documents(*)")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  if (from) {
    query = query.gte("created_at", from);
  }
  if (to) {
    query = query.lte("created_at", to);
  }
  if (search) {
    query = query.or(
      `company_name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/bookings — public, create new booking
export async function POST(req: NextRequest) {
  try {
    // Capture the authenticated user's ID if present (optional — allows anonymous too)
    const { userId } = await auth();

    const body = await req.json();

    const {
      company_name,
      contact_person,
      email,
      phone,
      address,
      employee_count,
      screening_type,
      preferred_dates,
      notes,
    } = body;

    if (
      !company_name ||
      !contact_person ||
      !email ||
      !phone ||
      !address ||
      !employee_count ||
      !screening_type ||
      !preferred_dates?.length
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        company_name,
        contact_person,
        email,
        phone,
        address,
        employee_count: Number(employee_count),
        screening_type,
        preferred_dates,
        notes: notes ?? null,
        status: "pending",
        clerk_user_id: userId ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const booking = data as Booking;

    // Fire-and-forget emails — don't block the response
    Promise.allSettled([
      sendNewBookingAlert(booking),
      sendBookingConfirmation(booking),
    ]).catch(console.error);

    return NextResponse.json(booking, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
