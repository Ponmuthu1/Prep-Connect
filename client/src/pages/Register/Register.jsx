import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../NavBar/NavBar";
import "./Register.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const usernameRegex = /^[a-zA-Z0-9]{3,}$/;

  async function registerUser(event) {
    event.preventDefault();
    if (!usernameRegex.test(name)) {
      alert("Username must be alphanumeric and at least 3 characters long.");
      return;
    }
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword, otp }),
      }
    );

    const data = await response.json();
    if (data.status === "ok") {
      alert("Registration successful");
      navigate("/login");
    } else {
      alert(data.error || "Registration failed");
    }
  }

  async function generateOtp() {
    if (!usernameRegex.test(name)) {
      alert("Username must be alphanumeric and at least 3 characters long.");
      return;
    }
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/generate-otp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      }
    );

    const data = await response.json();
    if (data.status === "ok") {
      setOtpSent(true);
      alert("OTP sent to your email");
    } else if (response.status === 429) {
      alert(
        data.error ||
          "Too many OTP requests from this IP, please try again after 15 minutes"
      );
    } else {
      alert(data.error || "Failed to send OTP");
    }
  }

  return (
    <>
      <NavBar />
      <div className="register-container">
        <h2>Register</h2>
        <form onSubmit={registerUser}>
          <div className="register-form-group">
            <input
              placeholder="Name"
              type="text"
              onChange={(e) => setName(e.target.value)}
              className="register-input"
            />
          </div>
          <div className="register-form-group">
            <input
              placeholder="Email"
              type="email"
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              className="register-input"
            />
            <button type="button" onClick={generateOtp} disabled={otpSent}>
              {otpSent ? "OTP Sent" : "Generate OTP"}
            </button>
          </div>
          <div className="register-form-group">
            <input
              placeholder="OTP"
              type="text"
              onChange={(e) => setOtp(e.target.value)}
              className="register-input"
            />
          </div>
          <div className="register-form-group">
            <input
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              onChange={(e) => setPassword(e.target.value)}
              className="register-input"
            />
            <span onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "🛡️" : "👁️‍🗨️"}
            </span>
          </div>
          <div className="register-form-group">
            <input
              placeholder="Confirm Password"
              type={showPassword ? "text" : "password"}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="register-input"
            />
          </div>

          <input
            type="submit"
            value="Register"
            className="register-submit-btn"
          />
        </form>
        <div className="register-switch">
          <p>
            Already have an account? <a href="/login">Login</a>
          </p>
        </div>
      </div>
    </>
  );
}

export default Register;
