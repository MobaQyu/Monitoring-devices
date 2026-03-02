import { Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import Users from "./pages/Users";
import Login from "./pages/Login";
import Roles from "./pages/settings/Roles";
import Regions from "./pages/settings/Regions";
import DeviceTypes from "./pages/settings/DeviceTypes";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>

          <Route index element={<Dashboard />} />
          <Route path="devices" element={<Devices />} />

          <Route
            path="users"
            element={
              <ProtectedRoute requiredPermission="view_user">
                <Users />
              </ProtectedRoute>
            }
          />

          <Route
            path="settings/roles"
            element={
              <ProtectedRoute requiredPermission="manage_roles">
                <Roles />
              </ProtectedRoute>
            }
          />

           <Route
            path="settings/regions"
            element={
              <ProtectedRoute requiredPermission="manage_user">
                <Regions />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings/devicetype"
            element={
              <ProtectedRoute requiredPermission="manage_device_type">
                <DeviceTypes />
              </ProtectedRoute>
            }
          />

        </Route>
      </Route>
    </Routes>
  );
}
