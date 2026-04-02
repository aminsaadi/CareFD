// This file intentionally left minimal.
// The landing page is served from (site)/page.tsx via the route group.
// If Next.js detects a conflict, the (site) route group takes priority for /.
// To avoid issues, this re-exports the site landing page.
"use client";
export { default } from "./(site)/page";
