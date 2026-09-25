const express = require("express");
const router = express.Router();
const { Parser: CsvParser } = require("json2csv");
const { create: createXml } = require("xmlbuilder2");
const PDFDocument = require("pdfkit");
const db = require("../db/database");

function loadRecords() {
  return db.prepare("SELECT * FROM weather_records ORDER BY created_at DESC").all().map((row) => ({
    id: row.id,
    location_query: row.location_query,
    resolved_name: row.resolved_name,
    latitude: row.latitude,
    longitude: row.longitude,
    start_date: row.start_date,
    end_date: row.end_date,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    daily_data: JSON.parse(row.forecast_json),
  }));
}

// GET /api/export?format=json|csv|xml|pdf|markdown
router.get("/export", (req, res) => {
  const format = (req.query.format || "json").toLowerCase();
  const records = loadRecords();

  try {
    switch (format) {
      case "json":
        return sendFile(res, "application/json", "weather_records.json", JSON.stringify(records, null, 2));

      case "csv": {
        if (records.length === 0) {
          return sendFile(res, "text/csv", "weather_records.csv", "");
        }
        const flat = records.map(({ daily_data, ...rest }) => ({
          ...rest,
          daily_data: JSON.stringify(daily_data),
        }));
        const parser = new CsvParser();
        const csv = parser.parse(flat);
        return sendFile(res, "text/csv", "weather_records.csv", csv);
      }

      case "xml": {
        const root = createXml({ version: "1.0" }).ele("weather_records");
        records.forEach((r) => {
          const recEl = root.ele("record", { id: r.id });
          Object.entries(r).forEach(([key, value]) => {
            if (key === "id") return;
            if (key === "daily_data") {
              const dailyEl = recEl.ele("daily_data");
              value.forEach((d) => dailyEl.ele("day", d).up());
              dailyEl.up();
            } else {
              recEl.ele(key).txt(value == null ? "" : String(value)).up();
            }
          });
          recEl.up();
        });
        const xml = root.end({ prettyPrint: true });
        return sendFile(res, "application/xml", "weather_records.xml", xml);
      }

      case "markdown": {
        let md = `# Weather Records Export\n\nExported ${new Date().toISOString()}\n\n`;
        md += `| ID | Location | Resolved Name | Start | End | Notes |\n`;
        md += `|---|---|---|---|---|---|\n`;
        records.forEach((r) => {
          md += `| ${r.id} | ${r.location_query} | ${r.resolved_name} | ${r.start_date} | ${r.end_date} | ${(r.notes || "").replace(/\|/g, "/")} |\n`;
        });
        records.forEach((r) => {
          md += `\n## Record #${r.id} — ${r.resolved_name}\n\n`;
          md += `| Date | High (°F) | Low (°F) |\n|---|---|---|\n`;
          r.daily_data.forEach((d) => {
            md += `| ${d.date} | ${d.temp_max ?? "-"} | ${d.temp_min ?? "-"} |\n`;
          });
        });
        return sendFile(res, "text/markdown", "weather_records.md", md);
      }

      case "pdf": {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'attachment; filename="weather_records.pdf"');
        const doc = new PDFDocument({ margin: 40 });
        doc.pipe(res);
        doc.fontSize(18).text("Weather Records Export", { underline: true });
        doc.moveDown();
        doc.fontSize(9).fillColor("gray").text(`Exported ${new Date().toISOString()}`);
        doc.moveDown();
        doc.fillColor("black");
        records.forEach((r) => {
          doc.fontSize(13).text(`#${r.id} — ${r.resolved_name}`, { continued: false });
          doc.fontSize(10).text(`Query: ${r.location_query}   |   Range: ${r.start_date} to ${r.end_date}`);
          if (r.notes) doc.fontSize(10).fillColor("gray").text(`Notes: ${r.notes}`).fillColor("black");
          r.daily_data.forEach((d) => {
            doc.fontSize(9).text(`  ${d.date}:  High ${d.temp_max ?? "-"}°F  /  Low ${d.temp_min ?? "-"}°F`);
          });
          doc.moveDown();
        });
        doc.end();
        return;
      }

      default:
        return res.status(400).json({ error: `Unsupported format "${format}". Use json, csv, xml, pdf, or markdown.` });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate export." });
  }
});

function sendFile(res, contentType, filename, body) {
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(body);
}

module.exports = router;
