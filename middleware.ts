import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isAdminRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/bookings(.*)",
  "/search(.*)",
]);

const isUserRoute = createRouteMatcher(["/my-bookings(.*)"]);


export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req) || isUserRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
