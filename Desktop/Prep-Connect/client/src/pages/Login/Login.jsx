import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../NavBar/NavBar";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function loginUser(event) {
    event.preventDefault();
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );

    const data = await response.json();
    if (data.user) {
      localStorage.setItem("token", data.user);
      alert("Login successful");
      navigate("/dashboard");
    } else {
      alert("Login failed");
    }
  }

  return (
    <>
      <NavBar />
      <div className="container">
        <h2>Login</h2>
        <form onSubmit={loginUser}>
          <div className="form-group">
            <input
              placeholder="Email"
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>
          <div className="form-group">
            <input
              placeholder="Password"
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </div>
          <input type="submit" value="Login" className="submit-btn" />
        </form>
        <div className="switch">
          <p>
            Don't have an account? <a href="/register">Register</a>
          </p>
        </div>
      </div>
    </>
  );
}

export default Login;
