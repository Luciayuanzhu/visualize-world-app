export interface AuthUser {
  uid: string;
  source: "mock";
}

export async function requireUser(): Promise<AuthUser> {
  return {
    uid: process.env.DEV_USER_ID || "dev-user",
    source: "mock",
  };
}
