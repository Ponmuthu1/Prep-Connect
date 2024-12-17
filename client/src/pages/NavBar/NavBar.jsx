import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./NavBar.css";

function NavBar() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("Guest");
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      setUsername(decoded.name);
    }
  }, [token]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    setUsername("Guest");
    navigate("/login");
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <nav className="navbar">
      {/* Left Section: Logo */}
      <div className="navbar-left">
        <img src="/logo1.png" alt="Logo" className="navbar-logo" />
      </div>

      {/* Right Section: Links + Username */}
      <div className="navbar-right">
        <ul className={`navbar-links ${menuOpen ? "show" : ""}`}>
          <li>
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link to="/home">Home</Link>
          </li>
          <li>
            <Link to="/questions">Questions</Link>
          </li>
          <li>
            <Link to="/quiz">Quiz</Link>
          </li>
          <li>
            <Link to="/chat">Personal Chat</Link>
          </li>
          <li>
            <Link to="/chatroom">Academic Chat</Link>
          </li>
        </ul>

        {/* Username Dropdown */}
        <div className="username-dropdown">
          <span onClick={toggleDropdown} className="username">
            {username} ▼
          </span>
          {dropdownOpen && (
            <div className="dropdown-menu">
              <button onClick={handleSignOut} className="signout-button">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Toggle */}
      <button className="navbar-toggle" onClick={toggleMenu}>
        ☰
      </button>
    </nav>
  );
}

export default NavBar;
