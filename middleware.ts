import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  publicRoutes: [
    // "/",
    // "/profile",
    "/api/assistant/create",
    "/api/thread",
    "/api/message/create",
    "/api/message/list",
    "/api/run/create",
    "/api/run/retrieve",
    "/api/challenge-users",
    "/api/openai",
  ],
});

export const config = {
  matcher: ["/((?!.+.[w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
