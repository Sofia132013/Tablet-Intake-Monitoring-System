import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get("/login", (req, res) => {
    console.log("Login HTML sending...")
    res.sendFile(path.join(__dirname, "../../front/login.html"))
})

router.get("/index", (req, res) => {
    console.log("Index HTML sending...")
    res.sendFile(path.join(__dirname, "../../front/index.html"))
})

router.get("/index.css", (req, res) => {
    res.sendFile(path.join(__dirname, "../../front/index.css"))
})

router.get("/login.css", (req, res) => {
    res.sendFile(path.join(__dirname, "../../front/login.css"))
})

router.get("/script.js", (req, res) => {
    res.sendFile(path.join(__dirname, "../../front/script.js"))
})

router.get("/login.js", (req, res) => {
    res.sendFile(path.join(__dirname, "../../front/login.js"))
})

router.get("/env.js", (req, res) => {
    res.sendFile(path.join(__dirname, "../../front/env.js"))
})

export default router;