import React, { useEffect, useState } from "react";
// import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { getUsers, logout } from "../../utils/APIRoutes";
import axios from "axios";
function Navbar({ items, chathand }) {
  const navigator = useNavigate();
  const [user, setUser] = useState([]);

  // const [onlineUser, setOnlineUser] = useState([]);

  useEffect(() => {
    const response = async () => {
      const users = await axios.get(`${getUsers}/${items._id}`);
      const data = users.data.user;
      setUser(data);
      // setOnlineUser(users.data.newOnlineUser);
    };
    response();
  }, [items]);

  const chatHandler = (da) => {
    chathand(da);
  };
  const handerLogOut = async () => {
    await axios.get(`${logout}/${items._id}`);
    localStorage.clear();
    navigator("/");
  };

  // const onlineUserMap = onlineUser.map((el) => {
  //   if (el.username) {
  //     return (
  //       <SwiperSlide key={el._id}>
  //         <div className="f">
  //           <div className="f">
  //             <img
  //               className="profile-people"
  //               src={`http://localhost:5000/image/${el.profileImage}`}
  //               alt=""
  //             />
  //             <div className="dot"></div>
  //           </div>
  //         </div>
  //       </SwiperSlide>
  //     );
  //   } else {
  //     return <div style={{ paddingBottom: "5px" }}></div>;
  //   }
  // });
  return (
    <>
      <div className="navbar-silder">
        <span className="material-symbols-rounded">cyclone</span>
        <span className="material-symbols-rounded" onClick={handerLogOut}>
          logout
        </span>
      </div>
      <div className="navbar-list">
        <div className="account">
          <img
            className="profile-img"
            src={`http://localhost:5000/image/${items.profileImage}`}
            alt=""
          />
          <span className="name-account">{items.username}</span>
          <span>My Account</span>
        </div>
        <div className="online-people">
        </div>
        <div className="list-people">
          <span className="text-chat">Users</span>
          <div className="container-people">
            {user.map((ele) => (
              <div
                className="field"
                key={ele._id}
                onClick={() => chatHandler(ele)}
              >
                <img
                  className="profile-people"
                  src={`http://localhost:5000/image/${ele.profileImage}`}
                  alt=""
                />
                <div>
                  <span>{ele.username}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;
