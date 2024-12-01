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
    } else {
      setUsername("Guest");
    }
  }, [token]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    setUsername("Guest");
    setDropdownOpen(false);
    navigate("/login");
  };

  const handleLogin = () => {
    setDropdownOpen(false);
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
      <img src="logo1.png" alt="Logo" className="navbar-logo" />
      <button className="navbar-toggle" onClick={toggleMenu}>
        ☰
      </button>
      <ul className={menuOpen ? "show" : ""}>
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
          <Link to="/chatroom">Anonymous Chat</Link>
          <span className="username-section">
            <span 
              className="username-display"
              onClick={toggleDropdown}
            >
              {username}
            </span>
            {dropdownOpen && (
              <div className="username-dropdown">
                {token ? (
                  <button
                    onClick={handleSignOut}
                    className="dropdown-item signout-button"
                  >
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="dropdown-item login-button"
                  >
                    Login
                  </button>
                )}
              </div>
            )}
          </span>
        </li>
      </ul>
    </nav>
  );
}

export default NavBar;
