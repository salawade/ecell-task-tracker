const express = require("express");
const mysql = require("mysql2");
const multer = require("multer");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
require("dotenv").config(); // 🔥 For environment variables

const app = express();

// 🔷 Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 🔥 FIXED STATIC PATH
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// 🔷 Simple session (for admin)
let isAdminLoggedIn = false;

// 🔷 Database (CLOUD READY)
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
// Connect DB
db.connect((err) => {
    if (err) {
        console.log("Database connection failed:", err);
    } else {
        console.log("Connected to database");
    }
});

// 🔷 File Upload Setup
const storage = multer.diskStorage({
    destination: "./uploads",
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

// 🔷 Admin Login
const ADMIN = {
    username: process.env.ADMIN_USER || "admin",
    password: process.env.ADMIN_PASS || "1234"
};

// 🔷 ROUTES

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN.username && password === ADMIN.password) {
        isAdminLoggedIn = true;
        res.redirect("/dashboard");
    } else {
        res.send("Invalid Login");
    }
});

// 🔷 Logout
app.get("/logout", (req, res) => {
    isAdminLoggedIn = false;
    res.redirect("/");
});

// 🔷 Dashboard
app.get("/dashboard", (req, res) => {
    if (!isAdminLoggedIn) return res.redirect("/login");
    res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});

// 🔷 Upload Task
app.post("/upload", upload.single("file"), (req, res) => {
    if (!isAdminLoggedIn) return res.send("Unauthorized");

    const { title, description, date } = req.body;
    const file = req.file ? req.file.filename : "";

    db.query(
        "INSERT INTO tasks (title, description, date, file_path) VALUES (?,?,?,?)",
        [title, description, date, file],
        (err) => {
            if (err) {
                console.log(err);
                return res.send("Database Error");
            }
            res.redirect("/dashboard");
        }
    );
});

// 🔷 Get Tasks
app.get("/tasks", (req, res) => {
    db.query("SELECT * FROM tasks ORDER BY id DESC", (err, result) => {
        if (err) return res.send("Database Error");
        res.json(result);
    });
});

// 🔷 View Page
app.get("/view", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "view.html"));
});

// 🔷 Delete Task
app.get("/delete/:id", (req, res) => {
    if (!isAdminLoggedIn) return res.send("Unauthorized");

    const id = parseInt(req.params.id);

    db.query("DELETE FROM tasks WHERE id = ?", [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.send("Database Error");
        }

        if (result.affectedRows === 0) {
            return res.send("No record found");
        }

        res.redirect("/view");
    });
});

// 🔷 START SERVER (🔥 IMPORTANT FIX)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});