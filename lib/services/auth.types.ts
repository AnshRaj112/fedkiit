import type { z } from "zod";

import type {
  changePasswordSchema,
  loginSchema,
  registerSchema,
} from "@/lib/validation/auth";

/**
 * Input types for the auth service.
 *
 * Split out from `auth.ts` so client components can import the types without
 * pulling in the `server-only` service module.
 */
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
