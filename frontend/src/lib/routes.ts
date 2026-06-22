import { Role } from "./types";

/**
 * The landing route for each role after login. Each role only has access to its
 * own screen (enforced by the backend RBAC and by the client-side AuthGuard).
 */
export function dashboardPathForRole(role: Role): string {
  switch (role) {
    case Role.SELLER:
      return "/seller/dashboard";
    case Role.AGENT:
      return "/agent/dashboard";
    case Role.CUSTOMER:
      return "/customer/tracking";
    case Role.ADMIN:
    default:
      // Admin has no dedicated screen in scope; send to the seller view.
      return "/seller/dashboard";
  }
}
