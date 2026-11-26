export type SessionMethod = "github" | "password";

export type AdminIdentity = {
  sub: number;
  login: string;
  method: SessionMethod;
  ver: string;
};

export type AdminSession = AdminIdentity & {
  exp: number;
};
