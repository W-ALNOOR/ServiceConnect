const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const healthRouter = require("./routes/health.routes");
const authRouter = require("./routes/auth.routes");
const usersRouter = require("./routes/users.routes");

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// routes
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

module.exports = app;
