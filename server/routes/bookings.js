const express = require("express");
const Booking = require("../models/Booking");
const Service = require("../models/Service");
const auth = require("../middleware/auth");

const router = express.Router();

// helper to check if user can access a booking
function canAccess(booking, user) {
  const isCustomer = booking.customer.toString() === user._id.toString();
  const isProvider = booking.provider.toString() === user._id.toString();
  const isAdmin = user.role === "admin";
  return isCustomer || isProvider || isAdmin;
}

// GET bookings for current user (customer sees their bookings, provider sees bookings for their services)
router.get("/", auth, async (req, res) => {
  try {
    const filter =
      req.user.role === "provider"
        ? { provider: req.user._id }
        : { customer: req.user._id };

    const bookings = await Booking.find(filter)
      .populate("service")
      .populate("customer", "name email")
      .populate("provider", "name email");

    return res.json(bookings);
  } catch (err) {
    console.error("GET /api/bookings ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET single booking
router.get("/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("service")
      .populate("customer", "name email")
      .populate("provider", "name email");

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (!canAccess(booking, req.user)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json(booking);
  } catch (err) {
    console.error("GET /api/bookings/:id ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST create a booking (customer only)
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "customer" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only customers can create bookings" });
    }

    const { serviceId, date } = req.body;
    if (!serviceId || !date) {
      return res.status(400).json({ message: "Service and date are required" });
    }

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const booking = await Booking.create({
      service: service._id,
      customer: req.user._id,
      provider: service.provider,
      date,
      total: service.price || 0,
    });

    return res.status(201).json(booking);
  } catch (err) {
    console.error("POST /api/bookings ERROR:", err);
    return res.status(500).json({ message: "Failed to create booking" });
  }
});

// PUT update a booking (customer/provider/admin)
router.put("/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (!canAccess(booking, req.user)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const allowed = ["status", "date", "total"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) booking[field] = req.body[field];
    });

    await booking.save();
    return res.json(booking);
  } catch (err) {
    console.error("PUT /api/bookings/:id ERROR:", err);
    return res.status(500).json({ message: "Failed to update booking" });
  }
});

// DELETE booking (customer/provider/admin)
router.delete("/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (!canAccess(booking, req.user)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await booking.deleteOne();
    return res.json({ message: "Booking deleted" });
  } catch (err) {
    console.error("DELETE /api/bookings/:id ERROR:", err);
    return res.status(500).json({ message: "Failed to delete booking" });
  }
});

module.exports = router;
