const ping = require("ping");

const { getAllDevicesRaw, updateDeviceRuntime } =
  require("./deviceService");

const { saveMetric } = require("./metricService");
const { logStatus } = require("./activityService");

const { getUptime } = require("../snmp/snmpService");
const { getInterfaceSpeed } = require("../snmp/snmpInterfaceService");
const { getInterfaceOctets } = require("../snmp/snmpTrafficService");

async function checkDevices(io) {
  try {
    const devices = await getAllDevicesRaw();
    if (!Array.isArray(devices)) return;

    for (const d of devices) {
      try {
        const now = Date.now();

        /* ================= PING ================= */
        const res = await ping.promise.probe(d.ip, {
          timeout: 2,
          extra:
            process.platform === "win32"
              ? ["-n", "3"]
              : ["-c", "3"],
        });

        const packetLoss = Number(res.packetLoss);
        let latency = Number(res.time);
        let status = "online";

        // ===== OFFLINE RULE (STANDAR INDUSTRI) =====
        if (packetLoss === 100) {
          status = "offline";
        } else {
          // ===== PACKET LOSS PARTIAL =====
          if (packetLoss >= 50) {
            status = "critical";
          } else if (packetLoss >= 20) {
            status = "warning";
          }

          // ===== LATENCY =====
          if (!isNaN(latency)) {
            if (latency >= d.latency_critical_ms) {
              status = "critical";
            } else if (
              latency >= d.latency_warning_ms &&
              status === "online"
            ) {
              status = "warning";
            }
          }
        }

        /* ================= SNMP ================= */
        let inBps = 0;
        let outBps = 0;
        let uptime = null;
        let ifaceSpeed = null;

        if (status !== "offline" && d.snmp && d.iface_index) {
          uptime = await getUptime(d.ip);
          ifaceSpeed = await getInterfaceSpeed(
            d.ip,
            d.iface_index
          );
          const octets = await getInterfaceOctets(
            d.ip,
            d.iface_index
          );
          let diff = null;

          if (octets && d.last_in_octets && d.last_check_time) {
            diff = (now - d.last_check_time) / 1000;

            if (diff > 0) {
              const rawIn = octets.inOctets - d.last_in_octets;
              const rawOut = octets.outOctets - d.last_out_octets;

              if (rawIn >= 0) {
                inBps = (rawIn * 8) / diff;
              }

              if (rawOut >= 0) {
                outBps = (rawOut * 8) / diff;
              }
            }
          }


          if (ifaceSpeed && ifaceSpeed > 0) {
            const usagePercent =
              (Math.max(inBps, outBps) / ifaceSpeed) * 100;

            if (usagePercent >= d.traffic_critical_percent) {
              status = "critical";
            } else if (
              usagePercent >= d.traffic_warning_percent &&
              status === "online"
            ) {
              status = "warning";
            }
          }

          await updateDeviceRuntime(d.id, {
            last_in_octets: octets?.inOctets ?? null,
            last_out_octets: octets?.outOctets ?? null,
            last_check_time: now,
          });
        }

        /* ================= UPDATE DEVICE ================= */
        await updateDeviceRuntime(d.id, {
          status,
          last_status: status,
          latency: isNaN(latency) ? null : latency,
          uptime,
          iface_speed: ifaceSpeed,
        });

        /* ================= SAVE METRIC ================= */
        if (status !== "offline") {
          await saveMetric(d.id, latency, inBps, outBps);
        }

        /* ================= LOG IF CHANGED ================= */
        if (d.last_status !== status) {
          await logStatus(d.id, status);
        }

        /* ================= SOCKET EMIT ================= */
        if (io) {
        io.emit("device:update", {
          device: { id: d.id, name: d.name, region: d.regionName, ip: d.ip,},                  

          status,
          uptime,
          ifaceSpeed,

          metric: {
            time: Date.now(),
            latency: isNaN(latency) ? 0 : latency,
            in: inBps,
            out: outBps,
          },
        });
      }

      } catch (err) {
        console.error("MONITOR ERROR:", d.ip, err.message);
      }
    }
  } catch (err) {
    console.error("INIT MONITOR ERROR:", err.message);
  }
}

module.exports = { checkDevices };