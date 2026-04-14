import nodemailer from "nodemailer";
import type { Booking } from "@/types";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `WorkMedix <${process.env.SMTP_FROM}>`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "dariusvlok345@gmail.com";

export async function sendNewBookingAlert(booking: Booking): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New Booking — ${booking.company_name}`,
    html: buildAdminAlertHtml(booking),
  });
}

export async function sendBookingConfirmation(booking: Booking): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to: booking.email,
    subject: "Booking Request Received — WorkMedix",
    html: buildClientConfirmationHtml(booking),
  });
}

export async function sendManualEmail(
  to: string,
  subject: string,
  body: string
): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to,
    subject,
    html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#111;">${body.replace(/\n/g, "<br/>")}</div>`,
  });
}

function buildAdminAlertHtml(b: Booking): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://workmedix.vercel.app";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>body{font-family:Inter,Arial,sans-serif;background:#f9fafb;margin:0;padding:32px}
.card{max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb}
.header{background:#18181b;padding:24px 32px}.header h1{color:#fff;margin:0;font-size:18px;font-weight:600}
.header p{color:#a1a1aa;margin:4px 0 0;font-size:13px}
.body{padding:32px}.row{display:flex;padding:10px 0;border-bottom:1px solid #f3f4f6}
.label{width:160px;font-size:13px;color:#6b7280;flex-shrink:0}
.value{font-size:13px;color:#111827;font-weight:500}
.btn{display:inline-block;background:#18181b;color:#fff;padding:10px 20px;border-radius:7px;text-decoration:none;font-size:13px;font-weight:500;margin-top:24px}
</style></head>
<body><div class="card">
<div class="header"><h1>New Booking Request</h1><p>WorkMedix Admin Notification</p></div>
<div class="body">
<div class="row"><span class="label">Company</span><span class="value">${b.company_name}</span></div>
<div class="row"><span class="label">Contact</span><span class="value">${b.contact_person}</span></div>
<div class="row"><span class="label">Email</span><span class="value">${b.email}</span></div>
<div class="row"><span class="label">Phone</span><span class="value">${b.phone}</span></div>
<div class="row"><span class="label">Address</span><span class="value">${b.address}</span></div>
<div class="row"><span class="label">Employees</span><span class="value">${b.employee_count}</span></div>
<div class="row"><span class="label">Screening</span><span class="value">${b.screening_type}</span></div>
<div class="row"><span class="label">Preferred Dates</span><span class="value">${b.preferred_dates.join(", ")}</span></div>
${b.notes ? `<div class="row"><span class="label">Notes</span><span class="value">${b.notes}</span></div>` : ""}
<a href="${appUrl}/bookings/${b.id}" class="btn">View Booking →</a>
</div></div></body></html>`;
}

function buildClientConfirmationHtml(b: Booking): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>body{font-family:Inter,Arial,sans-serif;background:#f9fafb;margin:0;padding:32px}
.card{max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb}
.header{background:#18181b;padding:24px 32px}.header h1{color:#fff;margin:0;font-size:18px;font-weight:600}
.header p{color:#a1a1aa;margin:4px 0 0;font-size:13px}
.body{padding:32px;font-size:14px;color:#374151;line-height:1.6}
.summary{background:#f9fafb;border-radius:8px;padding:16px;margin:20px 0;border:1px solid #e5e7eb}
.summary p{margin:4px 0;font-size:13px;color:#6b7280}
.summary strong{color:#111827}
</style></head>
<body><div class="card">
<div class="header"><h1>Booking Request Received</h1><p>WorkMedix Medical Screening</p></div>
<div class="body">
<p>Dear <strong>${b.contact_person}</strong>,</p>
<p>Thank you for your booking request. Our team will review your details and contact you within <strong>1–2 business days</strong> to confirm your appointment.</p>
<div class="summary">
<p><strong>Booking Summary</strong></p>
<p>Screening: <strong>${b.screening_type}</strong></p>
<p>Employees: <strong>${b.employee_count}</strong></p>
<p>Preferred Dates: <strong>${b.preferred_dates.join(", ")}</strong></p>
</div>
<p style="color:#6b7280;font-size:13px;">Questions? Reply to this email or contact us at ${ADMIN_EMAIL}</p>
<p style="color:#6b7280;font-size:13px;margin-top:24px;">— WorkMedix Team</p>
</div></div></body></html>`;
}
