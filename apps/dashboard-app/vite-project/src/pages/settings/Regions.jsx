import { useEffect, useState } from "react";
import { authApi } from "../../services/apiService";
import RegionModal from "../../components/users/RegionModal";
import "../../styles/setting.css";

export default function Regions() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedRegion, setSelectedRegion] = useState(null);

  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchRegions();
  }, []);

  async function fetchRegions() {
    try {
      const data = await authApi.get("/regions");
      setRegions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed fetch regions", err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setModalMode("create");
    setSelectedRegion(null);
    setShowModal(true);
  }

  function openEditModal(region) {
    setModalMode("edit");
    setSelectedRegion(region);
    setShowModal(true);
  }

  async function handleDelete(region) {
    const confirmDelete = window.confirm(
      `Yakin ingin menghapus region "${region.name}"?`
    );

    if (!confirmDelete) return;

    try {
      await authApi.delete(`/regions/${region.id}`);
      fetchRegions();
    } catch (err) {
      alert(err.message || "Gagal menghapus region");
    }
  }

  const filteredRegions = regions.filter((region) =>
    (region.name || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div className="content">
      <div className="page-header">
        <div className="page-title">Regions Management</div>
        <button onClick={openCreateModal}>
          + Create Region
        </button>
      </div>

      <div className="table-toolbar">
        <input
          placeholder="Search region..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Description</th>
              <th style={{ width: "140px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRegions.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: 20 }}>
                  No regions found
                </td>
              </tr>
            ) : (
              filteredRegions.map((region) => (
                <tr key={region.id}>
                  <td>{region.code}</td>
                  <td>{region.name}</td>
                  <td>{region.description}</td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => openEditModal(region)}>
                        Edit
                      </button>
                      <button
                        className="delete"
                        onClick={() => handleDelete(region)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <RegionModal
        open={showModal}
        mode={modalMode}
        region={selectedRegion}
        onClose={() => setShowModal(false)}
        onSaved={() => {
          setShowModal(false);
          fetchRegions();
        }}
      />
    </div>
  );
}