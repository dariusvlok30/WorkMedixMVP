import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isAdminRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/bookings(.*)",
  "/search(.*)",
  "/workers(.*)",
  "/companies(.*)",
  "/sessions(.*)",
  "/certificates(.*)",
  "/packages(.*)",
]);

const isUserRoute = createRouteMatcher(["/my-bookings(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req) || isUserRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
