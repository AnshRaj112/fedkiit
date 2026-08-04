import "server-only";

import type { SafeUser } from "@/lib/auth/access";

/**
 * Who may do what, declared once.
 *
 * Role lists used to be written out inside the route that needed them, so
 * adding a role meant hunting down every endpoint that mentioned it. A
 * permission is named for the capability, not the screen, so the same set can
 * back several routes.
 *
 * ADMIN is not listed in each set — `can()` grants it everything, matching the
 * Express `checkAccess`, where ADMIN always passed.
 */
export const PERMISSIONS = {
  /** Read a form's registration analytics (EventStats). */
  FORM_ANALYTICS_VIEW: new Set<string>([
    "PRESIDENT",
    "VICEPRESIDENT",
    "DIRECTOR_CREATIVE",
    "DIRECTOR_TECHNICAL",
    "DIRECTOR_MARKETING",
    "DIRECTOR_OPERATIONS",
    // Not a member of the AccessTypes enum, so it can never match. Carried over
    // from the Express controller, where it was equally dead; kept so the list
    // stays a faithful copy rather than a silent narrowing.
    "DIRECTOR_SPONSORSHIP",
  ]),
} satisfies Record<string, ReadonlySet<string>>;

export type Permission = keyof typeof PERMISSIONS;

/**
 * `user.access` is this project's role field — the Express `user.role` in the
 * review comment does not exist on this schema.
 */
export function can(
  user: Pick<SafeUser, "access"> | null | undefined,
  permission: Permission,
): boolean {
  if (!user) return false;
  if (user.access === "ADMIN") return true;
  return PERMISSIONS[permission].has(user.access);
}
