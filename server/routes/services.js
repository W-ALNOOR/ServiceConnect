const express = require("express");
const Service = require("../models/Service");
const auth = require("../middleware/auth");

const router = express.Router();

// GET all services with optional search
router.get("/", async (req, res) => {
  try {
    const q = req.query.q || "";
    const filter = q
      ? {
          $or: [
            { title: { $regex: q, $options: "i" } },
            { category: { $regex: q, $options: "i" } },
            { location: { $regex: q, $options: "i" } },
          ],
        }
      : {};

    const services = await Service.find(filter).sort({ createdAt: -1 });
    return res.json(services);
  } catch (err) {
    console.error("GET /api/services ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET single service by id
router.get("/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });
    return res.json(service);
  } catch (err) {
    console.error("GET /api/services/:id ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST create service (provider/admin only)
router.post("/", auth, async (req, res) => {
  try {
    if (!["provider", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only providers can create services" });
    }

    const { title, description, category, price, location } = req.body;

    if (!title || !description || !category || !price || !location) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const service = await Service.create({
      title,
      description,
      category,
      price,
      location,
      provider: req.user._id
    });

    return res.status(201).json(service);
  } catch (err) {
    console.error("POST /api/services ERROR:", err);
    return res.status(500).json({ message: "Failed to create service" });
  }
});

// PUT update service (provider owner or admin)
router.put("/:id", auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const isOwner = service.provider.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not allowed to update this service" });
    }

    const updatable = ["title", "description", "category", "price", "location"];
    updatable.forEach((field) => {
      if (req.body[field] !== undefined) service[field] = req.body[field];
    });

    await service.save();
    return res.json(service);
  } catch (err) {
    console.error("PUT /api/services/:id ERROR:", err);
    return res.status(500).json({ message: "Failed to update service" });
  }
});

// DELETE service (provider owner or admin)
router.delete("/:id", auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const isOwner = service.provider.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not allowed to delete this service" });
    }

    await service.deleteOne();
    return res.json({ message: "Service deleted" });
  } catch (err) {
    console.error("DELETE /api/services/:id ERROR:", err);
    return res.status(500).json({ message: "Failed to delete service" });
  }
});

module.exports = router;
