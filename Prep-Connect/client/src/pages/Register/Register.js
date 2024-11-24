import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../NavBar/NavBar";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function registerUser(event) {
    event.preventDefault();
    const response = await fetch("http://localhost:5000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();
    if (data.status === "ok") {
      alert("Registration successful");
      navigate("/login");
    } else {
      alert("Registration failed");
    }
  }

  return (
    <><NavBar />
    <div className="container">
      <h2>Register</h2>
      <form onSubmit={registerUser}>
        <div className="form-group">
          <input
            placeholder="Name"
            type="text"
            onChange={(e) => setName(e.target.value)}
            className="input"
          />
        </div>
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
        <input type="submit" value="Register" className="submit-btn" />
      </form>
      <div className="switch">
        <p>Already have an account? <a href="/login">Login</a></p>
      </div>
    </div>
    </>
  );
}

export default Register;
