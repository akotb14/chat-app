import React, { useEffect, useRef, useState } from "react";
import "./style.css";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { getMessages, postMessage } from "../../utils/APIRoutes";
function Main({ user, socket }) {
  const [message, setMessage] = useState("");
  const [sendMessage, setSendMessage] = useState([]);
  const [, setChats] = useState([{}]);
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const [items] = useState(
    JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY))
  );
  const scrollRef = useRef();
  useEffect(() => {
    const getData = async () => {
      const data = await axios.get(`${getMessages}/${items._id}/${user._id}`);
      setChats(data.data.getMessage);
      setSendMessage(data.data.messageSender);
    };
    getData();
  }, [user._id, items._id]);
  const postMessageHandler = async (e) => {
    e.preventDefault();
    socket.current.emit("send-msg", {
      sender: items._id,
      recieve: user._id,
      message: message,
    });
    await axios.post(postMessage, {
      message: message,
      sender: items._id,
      recieve: user._id,
    });
    const msgs = [...sendMessage];
    msgs.push({ message: message, sender: items._id });
    setSendMessage(msgs);
    setMessage("");
  };
  useEffect(() => {
    console.log("socket1")

    if (socket.current) {
      console.log("socket")
      socket.current.on("msg-recieve", (mge) => {
        setArrivalMessage({ sender: user._id, message: mge });
      });
    }
  }, [socket, user._id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({});
  }, [sendMessage]);

  const handlerChange = (e) => {
    setMessage(e.target.value);
  };
  useEffect(() => {
    arrivalMessage && setSendMessage((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage]);

  const chatMessage = sendMessage.map((chatt) => {
    if (chatt.message) {
      if (items._id === chatt.sender) {
        return (
          <div className="send-message" ref={scrollRef} key={uuidv4()}>
            {chatt.message}
          </div>
        );
      } else {
        return (
          <div className="recieve-message" ref={scrollRef} key={uuidv4()}>
            {chatt.message}
          </div>
        );
      }
    } else {
      return <></>;
    }
  });

  return (
    <div className="main-container">
      <div className="nav-chat-app">
        <img
          className="profile-people"
          src={`http://localhost:5000/image/${user.profileImage}`}
          alt=""
        />
        <header>
          <span>Chat with</span>
          <span>{user.username}</span>
        </header>
      </div>

      <div className="chat-messages">{chatMessage}</div>
      <form onSubmit={postMessageHandler} className="input-message">
        <img
          className="profile-people"
          src={`http://localhost:5000/image/${items.profileImage}`}
          alt=""
        />
        <input
          type="text"
          placeholder="enter the text"
          value={message}
          name="message"
          onChange={handlerChange}
        />
        <button type="sumbit">
          <span className="material-symbols-rounded">send</span>
        </button>
      </form>
    </div>
  );
}

export default Main;
