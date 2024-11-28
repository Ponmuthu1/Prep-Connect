import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./NavBar.css";

function NavBar() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("Guest");
  const [menuOpen, setMenuOpen] = useState(false);
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

  return (
    <nav className="navbar">
      <button className="navbar-toggle" onClick={toggleMenu}>
        ☰
      </button>
      <ul className={menuOpen ? "show" : ""}>
        <li>Hello, {username}</li>
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
        </li>
        {token ? (
          <li>
            <button onClick={handleSignOut} className="signout-button">
              Sign Out
            </button>
          </li>
        ) : (
          <li>
            <Link to="/login">Login</Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default NavBar;
