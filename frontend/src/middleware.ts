export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/library/:path*", "/books/search/:path*", "/reading-map/:path*"],
};
