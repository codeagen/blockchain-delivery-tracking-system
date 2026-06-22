/**
 * Application user roles. These drive role-based access control (RBAC) across
 * the REST API and mirror the on-chain access rules of the DeliveryManagement
 * contract (seller creates, admin assigns, agent updates, customer confirms).
 */
export enum Role {
  SELLER = 'SELLER',
  AGENT = 'AGENT',
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}
