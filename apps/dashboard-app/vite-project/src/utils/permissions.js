export const ROLE_PERMISSIONS = {
  user: [
    "map:view",
    "device:view",
  ],

  admin: [
    "map:view",
    "device:view",
    "device:create",
    "device:update",
    "device:delete",
  ],

  super_admin: [
    "map:view",
    "device:view",
    "device:create",
    "device:update",
    "device:delete",
    "user:manage",
  ],
};
