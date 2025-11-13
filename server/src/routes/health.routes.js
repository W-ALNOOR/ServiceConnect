const { Router } = require("express");
const os = require("os");

const router = Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "ServiceConnect API",
    time: new Date().toISOString(),
    host: os.hostname(),
  });
});

module.exports = router;
