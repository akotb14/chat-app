import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import Chat from "./pages/Chat/Chat";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/" element={<Chat/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
