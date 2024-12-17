import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../NavBar/NavBar";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  async function generateOtp(event) {
    event.preventDefault();
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/forgot-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      }
    );

    const data = await response.json();
    if (data.status === "ok") {
      setOtpSent(true);
      alert("OTP sent to your email");
    } else {
      alert(data.error || "Failed to send OTP");
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/reset-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword, otp }),
      }
    );

    const data = await response.json();
    if (data.status === "ok") {
      alert("Password reset successful");
      navigate("/login");
    } else {
      alert(data.error || "Failed to reset password");
    }
  }

  return (
    <>
      <NavBar />
      <div className="container">
        <h2>Forgot Password</h2>
        <form onSubmit={otpSent ? handleResetPassword : generateOtp}>
          <div className="form-group">
            <input
              placeholder="Email"
              type="email"
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              className="input"
            />
          </div>
          <div className="form-group">
            <input
              placeholder="New Password"
              type={showPassword ? "text" : "password"}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
            />
            <span onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "🛡️" : "👁️‍🗨️"}
            </span>
          </div>
          {otpSent && (
            <div className="form-group">
              <input
                placeholder="OTP"
                type="text"
                onChange={(e) => setOtp(e.target.value)}
                className="input"
              />
            </div>
          )}
          <input
            type="submit"
            value={otpSent ? "Reset Password" : "Send OTP"}
            className="submit-btn"
          />
        </form>
      </div>
    </>
  );
}

export default ForgotPassword;
