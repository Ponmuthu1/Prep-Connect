import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../NavBar/NavBar";
import "./Home.css";

const Home = () => {
  const [hoveredCircle, setHoveredCircle] = useState(null);
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
        if (data.status !== "ok") {
          localStorage.removeItem("token");
          navigate("/login");
        }
      });
  }, [navigate]);

  const handleMouseEnter = (circleId) => {
    setHoveredCircle(circleId);
  };

  const handleMouseLeave = () => {
    setHoveredCircle(null);
  };

  return (
    <>
      <NavBar />
      <div className="app">
        <section className="hero-section">
          <div className="hero-content">
            <h1>Welcome to Prepconnect</h1>
            <p>
              Social Network & Community{" "}
              <span className="highlight">Connect, Share, and Discover</span>{" "}
              for Anonymously or Not!
            </p>

            <div className="additional-content">
              <h2>Why Choose PrepConnect?</h2>
              <p>
                PrepConnect offers a unique platform for meaningful chats, both
                open and anonymous, prioritizing community, privacy, and
                knowledge exchange. It's perfect for users seeking deep and
                quality conversations.
              </p>
              <ul className="features-list">
                <li>Encrypted connections and privacy protections.</li>
                <li>
                  Secret conversations on any topic without revealing identity.
                </li>
                <li>Active knowledge exchange with community insights.</li>
              </ul>
              <a href="/chat" className="cta-btn">
                Explore Features
              </a>
            </div>
          </div>

          <div className="hero-graphics">
            <div className="quote-box-wrapper">
              {[
                {
                  id: 1,
                  src: "m4.png",
                  alt: "Avatar 1",
                  className: "circle-1",
                },
                {
                  id: 2,
                  src: "m1.png",
                  alt: "Avatar 2",
                  className: "circle-2",
                },
                {
                  id: 3,
                  src: "m2.png",
                  alt: "Avatar 3",
                  className: "circle-3",
                },
                {
                  id: 4,
                  src: "m3.png",
                  alt: "Avatar 4",
                  className: "circle-4",
                },
                {
                  id: 5,
                  src: "m5.png",
                  alt: "Avatar 5",
                  className: "circle-5",
                },
                {
                  id: 6,
                  src: "m6.png",
                  alt: "Avatar 6",
                  className: "circle-6",
                },
              ].map(({ id, src, alt, className }) => (
                <div
                  key={id}
                  className={`positioned-circle ${className} ${
                    hoveredCircle === id ? "hovered" : ""
                  }`}
                  onMouseEnter={() => handleMouseEnter(id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <img src={src} alt={alt} />
                </div>
              ))}

              <div className="quote-box">
                <p>
                  Fresh look at familiar elements is sure to create a great
                  experience that members of your community will love.
                </p>
                <div className="quote-icons">
                  <span>❤️</span>
                  <span>💬</span>
                  <span>👍</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;
