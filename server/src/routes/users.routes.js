const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");

const router = Router();

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.userDoc });
});

module.exports = router;
