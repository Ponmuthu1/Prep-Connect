import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../NavBar/NavBar";
import "./Dashboard.css";

function Dashboard() {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dashboard`, {
      headers: { "x-access-token": token },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") {
          setMessage(data.message);
        } else {
          localStorage.removeItem("token");
          navigate("/login");
        }
      });
  }, [navigate]);

  const openChat = () => {
    navigate("/chat");
  };

  return (
    <div className="dashboard-container">
      <NavBar />
      <h1>{message}</h1>
      <button className="chat-button" onClick={openChat}>
        Open Chat
      </button>
    </div>
  );
}

export default Dashboard;
