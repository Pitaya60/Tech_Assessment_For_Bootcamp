require("dotenv").config();
const express = require("express");
const cors = require("cors");

const weatherRoutes = require("./routes/weather");
const recordsRoutes = require("./routes/records");
const exportRoutes = require("./routes/exportData");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api", weatherRoutes);
app.use("/api", recordsRoutes);
app.use("/api", exportRoutes);

// Fallback 404 for unknown API routes
app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => {
  console.log(`Weather app backend listening on http://localhost:${PORT}`);
});
