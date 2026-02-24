import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";

const db = new Database("medical_records.db");

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    sex TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    test_type TEXT NOT NULL,
    result_data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients (id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Patient API
  app.get("/api/patients", (req, res) => {
    const patients = db.prepare("SELECT * FROM patients ORDER BY created_at DESC").all();
    res.json(patients);
  });

  app.post("/api/patients", (req, res) => {
    const { name, age, sex } = req.body;
    if (!name || !age || !sex) {
      return res.status(400).json({ error: "Faltan datos del paciente" });
    }
    const info = db.prepare("INSERT INTO patients (name, age, sex) VALUES (?, ?, ?)").run(name, age, sex);
    const patient = db.prepare("SELECT * FROM patients WHERE id = ?").get(info.lastInsertRowid);
    res.json(patient);
  });

  app.get("/api/patients/:id", (req, res) => {
    const patient = db.prepare("SELECT * FROM patients WHERE id = ?").get(req.params.id);
    if (!patient) return res.status(404).json({ error: "Paciente no encontrado" });
    
    const results = db.prepare("SELECT * FROM results WHERE patient_id = ? ORDER BY created_at DESC").all(req.params.id);
    res.json({ ...patient, results });
  });

  app.post("/api/patients/:id/results", (req, res) => {
    const { test_type, result_data } = req.body;
    if (!test_type || !result_data) {
      return res.status(400).json({ error: "Faltan datos del resultado" });
    }
    db.prepare("INSERT INTO results (patient_id, test_type, result_data) VALUES (?, ?, ?)").run(req.params.id, test_type, JSON.stringify(result_data));
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
