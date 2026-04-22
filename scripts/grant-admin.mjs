// Run once: node scripts/grant-admin.mjs
// Requires CLERK_SECRET_KEY in your environment
// e.g. CLERK_SECRET_KEY=sk_live_xxx node scripts/grant-admin.mjs

const SECRET_KEY = process.env.CLERK_SECRET_KEY;
const EMAIL = "dariusvlok10@gmail.com";

if (!SECRET_KEY) {
  console.error("Set CLERK_SECRET_KEY first");
  process.exit(1);
}

// Look up user by email
const listRes = await fetch(
  `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(EMAIL)}`,
  { headers: { Authorization: `Bearer ${SECRET_KEY}` } }
);
const users = await listRes.json();

if (!users.length) {
  console.error("No user found for", EMAIL, "— they need to sign in first");
  process.exit(1);
}

const user = users[0];
console.log("Found:", user.first_name, user.last_name, `(${user.id})`);
console.log("Current metadata:", JSON.stringify(user.public_metadata));

// Grant admin
const patchRes = await fetch(`https://api.clerk.com/v1/users/${user.id}`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${SECRET_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    public_metadata: { ...user.public_metadata, role: "admin" },
  }),
});

const updated = await patchRes.json();
console.log("Done. New metadata:", JSON.stringify(updated.public_metadata));
