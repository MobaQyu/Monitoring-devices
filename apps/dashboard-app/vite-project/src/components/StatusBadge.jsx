export default function StatusBadge({ status }) {
  const map = {
    online: "#22c55e",
    warning: "#eab308",
    critical: "#dc2626",
    offline: "#6b7280",
    unknown: "#6b7280",
  };

  return (
    <span
      style={{
        padding: "4px 8px",
        borderRadius: 6,
        background: map[status] || "#6b7280",
        color: "white",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {status?.toUpperCase()}
    </span>
  );
}