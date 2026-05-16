import type { NextAuthConfig } from "next-auth";
import type { Role, UserStatus } from "@prisma/client";
// Import (type-only) so the module is loaded and can be augmented below.
import type {} from "next-auth/jwt";

// Type augmentation for the session/user/JWT lives here so both the slim
// (middleware) and full (route handler) configs share the same types.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      status: UserStatus;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
  interface User {
    role: Role;
    status: UserStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    status: UserStatus;
  }
}

/**
 * Edge-safe NextAuth config:
 *  - No Prisma adapter (Prisma can't run on the Edge runtime)
 *  - No bcrypt or other Node-only modules
 *  - JWT-only callbacks that read/write existing token claims
 *
 * Used by middleware for route protection. The full auth.ts extends this and
 * adds the adapter + Credentials.authorize() for the route handler.
 */
export const authConfig = {
  // Required on non-Vercel hosts (Netlify): trust the deployment host header.
  trustHost: true,
  pages: { signIn: "/auth/signin" },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: Role }).role;
        token.status = (user as { status: UserStatus }).status;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.status = token.status as UserStatus;
      }
      return session;
    },
  },
  providers: [], // populated in full auth.ts; not needed for token validation
} satisfies NextAuthConfig;
