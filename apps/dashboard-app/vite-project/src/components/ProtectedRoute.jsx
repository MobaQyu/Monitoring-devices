import { Navigate, Outlet } from "react-router-dom";
import { isLoggedIn, getUser } from "../services/authService";

export default function ProtectedRoute({ requiredPermission, children }) {
  const loggedIn = isLoggedIn();
  const user = getUser();

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (
    requiredPermission &&
    !user?.permissions?.includes(requiredPermission)
  ) {
    return <Navigate to="/" replace />;
  }

  if (children) return children;

  return <Outlet />;
}
