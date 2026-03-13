import {
  Home,
  Cpu,
  Users,
  Settings,
  Shield,
  Map,
  MonitorCog
} from "lucide-react";

export const MENU = [
  {
    label: "Dashboard",
    path: "/",
    icon: Home
  },
  {
    label: "Network Map",
    path: "/network-map",
    icon: Map
  },
  
  {
    label: "Devices",
    path: "/devices",
    icon: Cpu,
    permission: "view_device"
  },
  {
    label: "Users",
    path: "/users",
    icon: Users,
    permission: "view_user"
  },
  {
    label: "Settings",
    icon: Settings,
    children: [
      {
        label: "Roles",
        path: "/settings/roles",
        icon: Shield,
        permission: "manage_roles"
      },
      {
        label: "Regions",
        path: "/settings/regions",
        icon: Map,
        permission: "manage_user"
      },
      {
        label: "Device Types",
        path: "/settings/devicetype",
        icon: MonitorCog,
        permission: "manage_device_type"
      }   
    ]
  }
];