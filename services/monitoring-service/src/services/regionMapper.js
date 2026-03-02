const REGION_MAP = {
  "Pelindo I": 1,
  "Pelindo II": 2,
  "Pelindo III": 3,
  "Pelindo IV": 4,
};

function mapRegionalToRegionId(regional) {
  return REGION_MAP[regional] ?? null;
}

module.exports = { mapRegionalToRegionId };
