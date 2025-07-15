import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles.css";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-content">
        <h1>About the Language Learning Arcade</h1>
        <p style={{ fontSize: "1.2rem", maxWidth: "700px", margin: "0 auto" }}>
          🚀 This app turns language learning into an interactive arcade adventure. 
          Earn points, play games, and build real skills while having fun. Whether you're 
          learning for travel, work, or just for fun, we’ve got you covered.
        </p>

        <button
          className="button-fancy"
          style={{ marginTop: "30px" }}
          onClick={() => navigate("/app")}
        >
          🎮 Back to Arcade
        </button>
      </div>

      <footer className="footer">
        <p>© 2025 Language Learning Arcade. All rights reserved.</p>
      </footer>
    </div>
  );
}
