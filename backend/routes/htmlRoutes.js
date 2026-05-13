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

export default router;