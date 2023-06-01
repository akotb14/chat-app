import express from "express";
import { getMessages, postMessage } from "../controller/chat.controller.js";
const router = express.Router();
router.post('/postMessage', postMessage);
router.get('/getMessages/:sender/:recieve', getMessages);
export default router 