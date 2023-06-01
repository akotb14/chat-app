import express from "express";
import {
  addUser,
  login,
  getUser,
  getUsers,
  logOut,
} from "../controller/user.controller.js";
const router = express.Router();
import multer from "multer";
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./images/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().getTime() + "_" + file.originalname.replace(/\s+/g, "-")
    );
  },
});
const upload = multer({ storage: storage });
router.post("/register", upload.single("image"), addUser);
router.post("/login", login);
router.get("/getUser/:id", getUser);
router.get("/getUsers/:id", getUsers);
router.get("/logout/:id", logOut);
export default router;
