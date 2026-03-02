export function can(permission) {
  const raw = localStorage.getItem("user");
  if (!raw) return false;

  const user = JSON.parse(raw);
  if (!permission) return true;

  return user.permissions?.includes(permission);
}
