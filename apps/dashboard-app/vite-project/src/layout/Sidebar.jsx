import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { TvMinimalPlay } from "lucide-react";
import "./layout.css";
import { MENU } from "./menuConfig";
import { can } from "../utils/can";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  return (
    <div
      className={`sidebar ${open ? "open" : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="logo">
        <div className="logo-icon">
          <TvMinimalPlay size={18} />
        </div>
        {open && <span className="logo-text">MONITORING</span>}
      </div>

      {MENU.map((menu) => {
        // ===== NORMAL MENU =====
        if (!menu.children) {
          if (menu.permission && !can(menu.permission)) return null;

          const Icon = menu.icon;
          return (
            <NavItem
              key={menu.path}
              icon={<Icon size={20} />}
              label={menu.label}
              open={open}
              to={menu.path}
            />
          );
        }

        // ===== SETTINGS PARENT =====
        const visibleChildren = menu.children.filter(
          (child) => !child.permission || can(child.permission)
        );

        if (visibleChildren.length === 0) return null;

        const ParentIcon = menu.icon;

        return (
          <div key={menu.label}>
            <div
              className="nav-item"
              onClick={() =>
                setOpenDropdown(
                  openDropdown === menu.label ? null : menu.label
                )
              }
            >
              <ParentIcon size={20} />
              {open && <span>{menu.label}</span>}
            </div>

            {/* CHILDREN SIMPLE TANPA ANIMASI */}
            {openDropdown === menu.label &&
              visibleChildren.map((child) => {
                const ChildIcon = child.icon;
                return (
                  <NavItem
                    key={child.path}
                    icon={<ChildIcon size={18} />}
                    label={child.label}
                    open={open}
                    to={child.path}
                    nested
                  />
                );
              })}
          </div>
        );
      })}
    </div>
  );
}

function NavItem({ icon, label, open, to, nested }) {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link
      to={to}
      className={`nav-item ${active ? "active" : ""} ${
        nested ? "nested" : ""
      }`}
    >
      {icon}
      {open && <span>{label}</span>}
    </Link>
  );
}