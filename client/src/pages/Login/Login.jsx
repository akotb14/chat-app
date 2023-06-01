import React, { useEffect, useState } from "react";
import axios from "axios";
import style from "../Register/register.module.css";
import { Link, useNavigate } from "react-router-dom";

import { login } from "../../utils/APIRoutes";
const Login = () => {
  const navigate = useNavigate();
  const [value, setvalue] = useState({
    username: "",
    password: "",
  });
  useEffect(() => {
    if (localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
      navigate("/");
    }
  });
  const handleChange = (e) => {
    setvalue((prevDate) => {
      return {
        ...prevDate,
        [e.target.name]: e.target.value,
      };
    });
  };

  const handleSumbit = async (e) => {
    e.preventDefault();
    const { data } = await axios.post(login, {
      username: value.username,
      password: value.password,
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
        password: "",
      });
      alert(data.message);
      navigate("/");
    }
  };
  return (
    <div className={`${style.formContainer} ${style.loginForm}`}>
      <form onSubmit={handleSumbit}>
        <div>LOGIN</div>
        <input
          type="text"
          placeholder="UserName"
          name="username"
          onChange={(e) => handleChange(e)}
          value={value.username}
        />

        <input
          type="password"
          placeholder="password"
          name="password"
          onChange={(e) => handleChange(e)}
          value={value.password}
        />

        <div className={style.divBtn}>
          <button type="sumbit">sumbit</button>
          <div className={style.txtLogin}>
            I don't have already account <Link to="/register">sign up</Link>
          </div>
        </div>
      </form>
      <div className={style.text}>CHAT APP</div>
    </div>
  );
};

export default Login;
