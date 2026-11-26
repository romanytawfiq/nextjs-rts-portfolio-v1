import type { SessionMethod } from "@/lib/server/auth-types";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      login: string;
      githubId: number;
      method: SessionMethod;
      ver: string;
    } & DefaultSession["user"];
  }

  interface User {
    login?: string;
    githubId?: number;
    method?: SessionMethod;
    ver?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    login?: string;
    githubId?: number;
    method?: SessionMethod;
    ver?: string;
  }
}
