import { useEffect, useState } from "react";
import DeviceDetail from "../components/DeviceDetail";
import DevicePanel from "../components/DevicePanel";
import DeviceCard from "../components/DeviceCard";
import { can } from "../utils/can";
import { socket, connectSocket } from "../services/socket";
import { monApi, authApi } from "../services/apiService";
import { monitorSocket } from "../services/monitorSocket";
import {
  Grid3X3,
  Grid2X2,
  LayoutGrid,
  Search,
  SlidersHorizontal,
  Plus,
} from "lucide-react";

export default function Devices() {
  const PAGE_SIZE = 20;

  /* ================= USER ================= */

  const user = JSON.parse(localStorage.getItem("user"));
  const userRegions = user?.regions || [];
  const canViewAllRegion = can("view_all_region");

  /* ================= STATE ================= */

  const [devicesRaw, setDevicesRaw] = useState([]);
  const [regions, setRegions] = useState([]);

  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterRegion, setFilterRegion] = useState(
    canViewAllRegion ? "" : String(userRegions[0] || "")
  );

  const [gridSize, setGridSize] = useState("medium");
  const [filterOpen, setFilterOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedDevice, setSelectedDevice] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deviceTypes, setDeviceTypes] = useState([]);



  /* ================= SEARCH DEBOUNCE ================= */

  useEffect(() => {
    const delay = setTimeout(() => {
      setSearchText(searchInput);
    }, 400);

    return () => clearTimeout(delay);
  }, [searchInput]);

  /* ================= FETCH DEVICES ================= */

  const fetchDevices = async () => {
    try {
      const query = new URLSearchParams({
        page: currentPage,
        limit: PAGE_SIZE,
        search: searchText || "",
        status: filterStatus !== "all" ? filterStatus : "",
        type: filterType !== "all" ? filterType : "",
        region: filterRegion || "",
      });

      const result = await monApi.get(`/devices?${query}`);

      setDevicesRaw(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (err) {
      console.error(err);
      setDevicesRaw([]);
      setTotalPages(1);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [currentPage, searchText, filterStatus, filterType, filterRegion]);

  /* ================= RESET PAGE ================= */

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, filterStatus, filterType, filterRegion]);

  /* ================= LOAD REGIONS ================= */

  useEffect(() => {
    async function loadRegions() {
      try {
        const data = await authApi.get("/regions");
        setRegions(Array.isArray(data) ? data : []);
      } catch (err) {
        setRegions([]);
      }
    }

    loadRegions();
  }, []);

  /* ================= SOCKET ================= */
 useEffect(() => {
  connectSocket();

  console.log("SOCKET URI:", socket.io.uri);

  socket.on("connect", () => {
    console.log("CONNECTED TO:", socket.io.uri);
  });
}, []);

  useEffect(() => {
  const createdHandler = (device) => {
    setDevicesRaw((prev) => [device, ...prev]);
  };
   
  const updatedHandler = (device) => {
    setDevicesRaw((prev) =>
      prev.map((d) => (d.id === device.id ? device : d))
    );
  };

  const deletedHandler = (id) => {
    setDevicesRaw((prev) =>
      prev.filter((d) => d.id !== id)
    );
  };

  const runtimeUpdateHandler = (data) => {
    console.log("RUNTIME UPDATE RECEIVED:", data);

    setDevicesRaw((prev) =>
      prev.map((d) =>
        d.id === data.deviceId
          ? {
              ...d,
              status: data.status,
              latency: data.latency,
            }
          : d
      )
    );
  };

  monitorSocket.on("device:created", createdHandler);
  monitorSocket.on("device:updated", updatedHandler);
  monitorSocket.on("device:deleted", deletedHandler);
  monitorSocket.on("device:update", runtimeUpdateHandler);

  return () => {
  monitorSocket.off("device:created", createdHandler);
  monitorSocket.off("device:updated", updatedHandler);
  monitorSocket.off("device:deleted", deletedHandler);
  monitorSocket.off("device:update", runtimeUpdateHandler);
};
}, []);
  /* ================= DELETE ================= */

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus device ini?")) return;
    await monApi.delete(`/devices/${id}`);
    fetchDevices();
  };

  /* ================= AVAILABLE REGIONS ================= */

  const availableRegions = canViewAllRegion
    ? regions
    : regions.filter((r) => userRegions.includes(r.id));

  /* ================= AVAILABLE LOADTYPES ================= */
  useEffect(() => {
  async function loadTypes() {
    try {
      const data = await monApi.get("/device-types");
      setDeviceTypes(Array.isArray(data) ? data : []);
    } catch {
      setDeviceTypes([]);
    }
  }

  loadTypes();
}, []);
  /* ================= UI ================= */

  return (
    <div className="content">

      {/* ================= TOPBAR ================= */}
      <div className="devices-topbar">

        {/* GRID MODE */}
        <div className="view-toggle">
          <button
            className={gridSize === "small" ? "active" : ""}
            onClick={() => setGridSize("small")}
          >
            <Grid3X3 size={18} />
          </button>

          <button
            className={gridSize === "medium" ? "active" : ""}
            onClick={() => setGridSize("medium")}
          >
            <Grid2X2 size={18} />
          </button>

          <button
            className={gridSize === "large" ? "active" : ""}
            onClick={() => setGridSize("large")}
          >
            <LayoutGrid size={18} />
          </button>
        </div>

        {/* SEARCH */}
        <div className="search-wrapper">
          <Search size={18} />
          <input
            placeholder="Search devices..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {/* FILTER BUTTON */}
       <button
          className="filter-btn"
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <SlidersHorizontal size={18} />
        </button>

        {/* ADD DEVICE BUTTON */}
        {can("create_device") && (
          <button
            className="add-device-btn"
            onClick={() => {
              setEditData(null);
              setPanelOpen(true);
            }}
          >
            <Plus size={18} />
            <span>Add Device</span>
          </button>)}
      </div>

      {/* ================= FILTER PANEL ================= */}
      {filterOpen && (
  <div className="devices-filter-bar">

    <div className="filter-group">
      <label>Status</label>
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="filter-select"
      >
        <option value="all">All</option>
        <option value="online">Online</option>
        <option value="offline">Offline</option>
      </select>
    </div>

    <div className="filter-group">
      <label>Device Type</label>
      <select
        value={filterType}
        onChange={(e) => setFilterType(e.target.value)}
        className="filter-select"
      >
        <option value="all">All</option>
        {deviceTypes.map((type) => (
          <option key={type.id} value={type.id}>
            {type.name}
          </option>
        ))}
      </select>
    </div>

    {canViewAllRegion && (
      <div className="filter-group">
        <label>Region</label>
        <select
          value={filterRegion}
          onChange={(e) => setFilterRegion(e.target.value)}
          className="filter-select"
        >
          <option value="">All</option>
          {availableRegions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
      </div>
    )}
  </div>
)}

      {/* ================= GRID ================= */}
      <div className={`devices-grid ${gridSize}`}>
        {devicesRaw.map((d) => (
          <DeviceCard
            key={d.id}
            device={d}
            trafficData={d.trafficHistory || []}
            onClick={() => setSelectedDevice(d)}
            onEdit={() => {
              setEditData(d);
              setPanelOpen(true);
            }}
            onDelete={() => handleDelete(d.id)}
          />
        ))}
      </div>

      {/* ================= PAGINATION ================= */}
      {totalPages > 1 && (
        <div className="devices-pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Prev
          </button>

          <span>
            {currentPage} / {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* ================= DETAIL ================= */}
      {selectedDevice && (
        <DeviceDetail
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
        />
      )}

      {/* ================= PANEL ================= */}
      {panelOpen && (
        <DevicePanel
          mode={editData ? "edit" : "add"}
          data={editData}
          onClose={() => setPanelOpen(false)}
          onSaved={fetchDevices}
        />
      )}

    </div>
  );
}