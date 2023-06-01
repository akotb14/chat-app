import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";
import { io } from "socket.io-client";

import Navbar from "../../components/Navbar/Navbar";
import Main from "../../components/Main/Main";

import { host } from "../../utils/APIRoutes";

const Chat = () => {
  const socket = useRef();
  const [items] = useState(
    JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY))
  );
  useEffect(() => {
    if (items) {
      socket.current = io(host);
      socket.current.emit("add-user", items._id);
    }
  }, [items]);
  const [userState, setUser] = useState({});
  const navigator = useNavigate();
  useEffect(() => {
    if (!localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
      navigator("/register");
    }
  });
  
  const chatHandler = (e) => {
    setUser(e);
  };
  return (
    <>
      {items ? (
        <div className="home">
          <div className="navbar">
            <Navbar items={items} chathand={chatHandler} socket={socket.current} />
          </div>
          {userState.username ? (
            <div className="main">
              <Main user={userState} socket={socket}/>
            </div>
          ) : (
            <div className="wContainer">
              <div className="welcome">Welcome to ChatApp</div>
            </div>
          )}
        </div>
      ) : (
        <div></div>
      )}
    </>
  );
};

export default Chat;
