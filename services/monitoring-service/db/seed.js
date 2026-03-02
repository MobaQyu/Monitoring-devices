const { db } = require("./index");

const now = Date.now();

const generateDevices = () => {
  const result = [];

  const regionNames = {
    1: "Pelindo I",
    2: "Pelindo II",
    3: "Pelindo III",
    4: "Pelindo IV"
  };

  const baseLatLng = {
    1: { lat: 3.59, lng: 98.67 },
    2: { lat: -6.20, lng: 106.85 },
    3: { lat: -7.25, lng: 112.75 },
    4: { lat: -5.14, lng: 119.41 }
  };

  const deviceTypes = [
    "Router",
    "Server",
    "Switch",
    "CCTV",
    "PC"
  ];

  let ipCounter = 1;

  for (let region = 1; region <= 4; region++) {
    for (let i = 0; i < 15; i++) {
      result.push({
        name: `${deviceTypes[i]} ${regionNames[region]}`,
        ip: `10.${region}.${Math.floor(ipCounter / 255)}.${ipCounter % 255}`,
        lat: baseLatLng[region].lat + (Math.random() - 0.5) * 0.5,
        lng: baseLatLng[region].lng + (Math.random() - 0.5) * 0.5,
        region_id: region
      });

      ipCounter++;
    }
  }

  return result;
};

const devices = generateDevices();

const stmt = db.prepare(`
  INSERT INTO devices (
    name, ip, type, lat, lng,
    status, latency, region_id, created_at
  ) VALUES (
    @name, @ip, 'network',
    @lat, @lng,
    'OFFLINE', NULL, @region_id, @created_at
  )
`);

const insertMany = db.transaction((rows) => {
  for (const row of rows) {
    stmt.run({ ...row, created_at: now });
  }
});

insertMany(devices);

console.log("✅ 60 devices berhasil dibuat (15 per region)");
