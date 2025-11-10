import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json()); // untuk parsing JSON body

// setup folder public
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// koneksi database MySQL (XAMPP)
const db = await mysql.createPool({
    host: "localhost",
    user: "root",      // default XAMPP user
    password: "",      // default XAMPP password
    database: "praktikum5"
});

// generate API key
app.post("/generate-key", async (req, res) => {
    const newKey = uuidv4();
    try {
        await db.query("INSERT INTO api_keys(`key`) VALUES(?)", [newKey]);
        res.json({ apiKey: newKey });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gagal menyimpan API key" });
    }
});

// ambil data (API Key bisa dari header atau body)
app.get("/data", async (req, res) => {
    // Cek API Key dari header
    let key = req.headers["x-api-key"];

    // Jika header kosong, cek body JSON (jika body dikirim)
    if (!key && req.body?.Key) key = req.body.Key;

    if (!key) return res.status(401).json({ error: "API key dibutuhkan" });

    try {
        const [rows] = await db.query("SELECT * FROM api_keys WHERE `key` = ?", [key]);
        if (rows.length === 0) return res.status(401).json({ error: "API key invalid" });

        const [data] = await db.query("SELECT * FROM data_items");
        res.json({ message: "Berhasil mengambil data", data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Terjadi kesalahan server" });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
