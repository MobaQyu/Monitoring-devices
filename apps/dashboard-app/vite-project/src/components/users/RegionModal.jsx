import { useEffect, useState } from "react";
import { authApi } from "../../services/apiService";

export default function RegionModal({
  open,
  mode = "create",
  region = null,
  onClose,
  onSaved
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");


  useEffect(() => {
    if (!open) return;

   if (mode === "edit" && region) {
      setCode(region.code || "");
      setName(region.name || "");
      setDescription(region.description || "");
    }

     else {
      setName("");
    }
  }, [open, mode, region]);

  if (!open) return null;

  const handleSave = async () => {
  if (!code.trim() || !name.trim()) {
    alert("Code dan Name wajib diisi");
    return;
  }

  try {
    setSaving(true);

    if (mode === "create") {
      await authApi.post("/regions", {
        code,
        name,
        description
      });
      alert("Region berhasil dibuat");
    } else {
      await authApi.put(`/regions/${region.id}`, {
        code,
        name,
        description
      });
      alert("Region berhasil diupdate");
    }

    onSaved();   // refresh list
    onClose();   // tutup modal
  } catch (err) {
    alert(err.message || "Gagal menyimpan region");
  } finally {
    setSaving(false);
  }
};

  return (
    <div style={overlay}>
      <div style={modal}>
        <h2>{mode === "create" ? "Add Region" : "Edit Region"}</h2>

       <input
  placeholder="Region Code"
  value={code}
  onChange={(e) => setCode(e.target.value)}
/>

<input
  placeholder="Region Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

<input
  placeholder="Description (optional)"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>


        <div style={{ marginTop: 20, textAlign: "right" }}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const modal = {
  background: "white",
  padding: 30,
  borderRadius: 16,
  width: 400
};
