import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles.css";

export default function Landing() {
  const navigate = useNavigate();

  // Teacher avatars (5, small, horizontal)
  const teachers = [
    { name: "Emma", avatar: "/emma.png" },
    { name: "Liam", avatar: "/liam.png" },
    { name: "Olivia", avatar: "/olivia.png" },
    { name: "Noah", avatar: "/noah.png" },
    { name: "Sophia", avatar: "/sophia.png" },
  ];

  return (
    <div>
      <header className="header">
        <img
          src="/logo.png"
          alt="Language Learning Arcade Logo"
          className="header-logo"
          onError={(e) => (e.target.src = "https://via.placeholder.com/200x60?text=Logo")}
        />
        <nav>
          <a href="/about" aria-label="Go to about page">About</a>
          <a href="/login" aria-label="Sign up for Language Learning Arcade">Sign Up</a>
          <a href="/app" aria-label="Start learning English">Start Learning</a>
        </nav>
      </header>
      <div className="landing-container">
        <h1 className="landing-title">Welcome to the Language Learning Arcade</h1>
        <p className="landing-subtitle">Master English through interactive games, personalized lessons, and AI-driven feedback.</p>
        <div className="hero-section">
          <img
            src="/hero.png" // Updated to hero.png
            alt="Language Learning Hero"
            className="hero-image"
            onError={(e) => (e.target.src = "https://via.placeholder.com/800x400?text=Hero+Image")}
          />
        </div>
        <div className="features">
          <h3>Why Learn with Us?</h3>
          <ul>
            <li><strong>Personalized Lessons</strong>: Tailored to your level and goals.</li>
            <li><strong>AI-Powered Learning</strong>: Real-time feedback to boost progress.</li>
            <li><strong>Gamified Experience</strong>: Earn badges and unlock achievements.</li>
            <li><strong>Expert Teachers</strong>: Learn from Emma, Liam, Olivia, Noah, or Sophia.</li>
          </ul>
        </div>
        <div className="avatar-container">
          <h3>Meet Our Teachers</h3>
          <div className="teacher-row">
            {teachers.map((teacher) => (
              <div key={teacher.name} className="teacher-item">
                <img
                  src={teacher.avatar}
                  alt={`Teacher ${teacher.name}`}
                  className="teacher-avatar"
                  onError={(e) => (e.target.src = "/avatars/default.png")}
                />
                <p>{teacher.name}</p>
              </div>
            ))}
          </div>
        </div>
        <button
          className="button-primary"
          onClick={() => navigate("/login")}
          aria-label="Get started with Language Learning Arcade"
        >
          Start Your Journey
        </button>
      </div>
      <footer className="footer">
        <p>© 2025 Language Learning Arcade. Built with Passion & Innovation.</p>
      </footer>
    </div>
  );
}
