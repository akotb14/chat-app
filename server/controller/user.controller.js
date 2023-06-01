import Users from "../models/user.model.js";
import validator from "validator";
import bcrypt from "bcrypt";
import { onlineU } from "../index.js";
export const addUser = async (req, res, nxt) => {
  try {
    let { email, password, username, confirmPassword } = req.body;
    let filename = req.file
      ? req.file.filename
      : "1677169550414_f10ff70a7155e5ab666bcdd1b45b726d.jpg";
    const check = await Users.findOne({
      $or: [{ username: username }, { email: email }],
    });
    const validEmail = validator.isEmail(email);
    if (!email || !password || !username) {
      return res.json({
        status: false,
        message: "some parameters are required",
      });
    }
    if (username.length < 3 || username.length >= 20) {
      return res.json({
        status: false,
        message: "username must be between 3 and 20 characters",
      });
    }
    if (!validEmail || email.length >= 50) {
      return res.json({
        status: false,
        message: "email is not valid and maximum is 50 characters",
      });
    }
    if (password != confirmPassword || password.length < 6) {
      return res.json({
        status: false,
        message:
          "confirm password and password must be at least 6 characters and same",
      });
    }
    if (check) {
      return res.json({
        status: false,
        message: "Username or Email already used",
      });
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const user = new Users({
      email: email,
      username: username,
      password: hashPassword,
      profileImage: filename,
    });
    user.save();
    return res.json({ status: true, user });
  } catch (ex) {
    return res
      .status(500)
      .json({ status: false, message: "Users validation failed" });
  }
};
export const login = async (req, res) => {
  try {
    let { password, username } = req.body;

    const check = await Users.findOne({
      $or: [{ username: username }, { email: username }],
    });
    if (!password || !username) {
      return res.json({
        status: false,
        message: "some parameters are required",
      });
    }
    if (!check) {
      return res.json({
        status: false,
        message: "username or email or password is not correct",
      });
    }
    const user = {
      _id: check._id,
      username: check.username,
      email: check.email,
      profileImage: check.profileImage,
    };
    const checkPassword = bcrypt.compareSync(password, check.password);
    if (!checkPassword) {
      return res.json({
        status: false,
        message: "username or email or password is not correct",
      });
    }
    if (check && checkPassword) {
      return res.json({
        status: true,
        message: "successfull login",
        user,
      });
    }
  } catch (e) {
    return res
      .status(500)
      .json({ status: false, message: "Users validation failed" });
  }
};

export const getUser = async (req, res, nxt) => {
  try {
    let id = req.params.id;
    const user = await Users.findOne({ _id: id }, { password: 0 });
    res.status(200).json({ status: true, user });
  } catch (e) {
    return res.status(500).json({ status: false, message: "cant fetch data" });
  }
};
export const getUsers = async (req, res, nxt) => {
  try {
    let id = req.params.id;
    const user = await Users.find({ _id: { $ne: id } }, { password: 0 });
    const newOnlineUser = user.filter((element, ) => {
      if (onlineU.has(element._id.toString())) {
        return element;
      }
    });

    console.log(newOnlineUser.length);
    res.status(200).json({ status: true, user, newOnlineUser });
  } catch (e) {
    return res.status(500).json({ status: false, message: "cant fetch data" });
  }
};
export const logOut = (req, res, next) => {
  try {
    if (!req.params.id) return res.json({ msg: "User id is required " });
    onlineUsers.delete(req.params.id);
    return res.status(200).send();
  } catch (ex) {
    next(ex);
  }
};
