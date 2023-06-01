import React, { useEffect, useState } from "react";
import axios from "axios";
import style from "./register.module.css";
import { useNavigate } from "react-router-dom";

import { register } from "../../utils/APIRoutes";
const Register = () => {
  const navigate = useNavigate();
  const [value, setvalue] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    image: "",
  });
  useEffect(() => {
    if (localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
      navigate("/");
    }
  });
  const handleChange = (e) => {
    const fun = () => {
      if (e.target.name === "image") {
        return e.target.files[0];
      } else {
        return e.target.value;
      }
    };
    setvalue((prevDate) => {
      return {
        ...prevDate,
        [e.target.name]: fun(),
      };
    });
  };
  
  const handleSumbit = async (e) => {
    e.preventDefault();
    console.log(value.image);
    let formData = new FormData();
    formData.append("username", value.username);
    formData.append("email", value.email);
    formData.append("password", value.password);
    formData.append("confirmPassword", value.confirmPassword);

    formData.append("image", value.image);
    console.log(formData);

    const { data } = await axios.post(register, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    console.log(data);
    if (data.status === false) {
      alert(data.message);
    } else {
      localStorage.setItem(
        process.env.REACT_APP_LOCALHOST_KEY,
        JSON.stringify(data.user)
      );
      setvalue({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        image: "",
      });
      alert("sign up is successful");
      navigate("/");
    }
  };
  return (
    <div className={style.formContainer}>
      <form onSubmit={handleSumbit}>
        <div>SIGN UP</div>
        <input
          type="text"
          placeholder="UserName"
          name="username"
          onChange={(e) => handleChange(e)}
          value={value.username}
        />
        <input
          type="email"
          placeholder="email"
          name="email"
          onChange={(e) => handleChange(e)}
          value={value.email}
        />
        <input
          type="password"
          placeholder="password"
          name="password"
          onChange={(e) => handleChange(e)}
          value={value.password}
        />
        <input
          type="password"
          placeholder="confirm password"
          name="confirmPassword"
          onChange={(e) => handleChange(e)}
          value={value.confirmPassword}
        />
        <input
          type="file"
          filename={value.image}
          onChange={(e) => handleChange(e)}
          name="image"
        />
        <div className={style.divBtn}>
          <button type="sumbit">sumbit</button>
          <div className={style.txtLogin}>
            I have already account <a href="/login">Login</a>
          </div>
        </div>
      </form>
      <div className={style.text}>CHAT APP</div>
    </div>
  );
};

export default Register;
