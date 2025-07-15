// src/components/LandingPage.js
import React from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  const handleStartLearning = () => {
    const user = localStorage.getItem("user"); // Or replace with auth context
    if (user) {
      navigate("/school");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="section-border" style={{ padding: "40px", marginTop: "30px" }}>
      <h1>🎮 Language Learning Arcade</h1>
      <p style={{ fontSize: "1.2rem", color: "white", marginBottom: "30px" }}>
        Play games. Earn points. Master English!
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
        <button onClick={handleStartLearning}>Start Learning</button>
        <button onClick={() => navigate("/signup")}>Sign Up</button>
        <button onClick={() => navigate("/about")}>About</button>
      </div>
    </div>
  );
}
