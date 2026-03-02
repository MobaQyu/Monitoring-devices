const regionService = require("./region.service");

async function getRegions(req, res) {
  try {
    const regions = await regionService.getRegions();
    res.json(regions);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
}
async function createRegion(req, res) {
  const { code, name, description } = req.body;

  if (!code || !name) {
    return res.status(400).json({ error: "code dan name wajib diisi" });
  }

  try {
    const result = await regionService.createRegion({ code, name, description });
    res.status(201).json(result);
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(400).json({ error: "Code region sudah digunakan" });
    }

    res.status(500).json({ error: err.message });
  }
}


async function updateRegion(req, res) {
  const { id } = req.params;
  const { code, name, description } = req.body;

  try {
    await regionService.updateRegion(id, { code, name, description });
    res.json({ message: "Region berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteRegion(req, res) {
  const { id } = req.params;

  try {
    await regionService.deleteRegion(id);
    res.json({ message: "Region berhasil dihapus" });
  } catch (err) {
    res.status(400).json({ error: err.toString() });
  }
}

module.exports = {
  getRegions,
  createRegion,
  updateRegion,
  deleteRegion
};
