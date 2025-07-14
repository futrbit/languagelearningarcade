import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles.css";

export default function About() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(localStorage.getItem("currentUser") || null);
  const [aboutContent, setAboutContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user.uid);
        localStorage.setItem("currentUser", user.uid);
      } else {
        setCurrentUser(null);
        localStorage.removeItem("currentUser");
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchAboutContent = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/about", {
          headers: {
            Authorization: `Bearer ${currentUser}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setAboutContent(data.content || "Welcome to the Language Learning Arcade! Learn languages with fun, gamified lessons and AI-powered feedback. 🚀");
          toast.success("Welcome to the Language Learning Arcade! 🚀", {
            position: "top-center",
            autoClose: 3000,
          });
        } else {
          throw new Error(data.detail || "Failed to load About content");
        }
      } catch (err) {
        console.error("Error fetching About content:", err);
        setError("Couldn’t load About page. Try again later!");
        setAboutContent("Welcome to the Language Learning Arcade! Learn languages with fun, gamified lessons and AI-powered feedback. 🚀");
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetchAboutContent();
  }, [currentUser]);

  return (
    <div>
      <ToastContainer />
      <header className="header">
        <img src="/logo.png" alt="Language Learning Arcade Logo" className="header-logo" />
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/progress">Progress</a>
          <a href="/homework">Homework</a>
          <a href="/lessons">Lessons</a>
          <a href="/app">Arcade</a>
          {currentUser ? (
            <button className="button-primary" onClick={() => auth.signOut().then(() => navigate("/login"))}>
              Logout
            </button>
          ) : (
            <button className="button-primary" onClick={() => navigate("/login")}>
              Login
            </button>
          )}
        </nav>
      </header>

      <div className="about-container section-border">
        <h2>🎮 About Language Learning Arcade</h2>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : (
          <div className="markdown-content">
            <p>{aboutContent}</p>
            <h3>Our Mission</h3>
            <p>
              We’re here to make language learning fun, engaging, and effective with gamified lessons, AI feedback, and personalized progress tracking. Whether you’re learning for travel, business, or personal growth, we’ve got your back! 😎
            </p>
            <h3>Features</h3>
            <ul className="markdown-list">
              <li>🎓 Interactive lessons tailored to your level and goals</li>
              <li>🏆 Badges and progress bars to keep you motivated</li>
              <li>📝 AI-graded homework with instant feedback</li>
              <li>🚀 Playful design with a vibrant, arcade-inspired look</li>
            </ul>
            <h3>Meet the Team</h3>
            <div className="team-avatars">
              <div className="team-avatar">
                <img src="/team-member1.png" alt="Sophia" className="avatar-image" />
                <p>Sophia</p>
              </div>
              <div className="team-avatar">
                <img src="/team-member2.png" alt="Alex" className="avatar-image" />
                <p>Alex</p>
              </div>
            </div>
            <h3>Try the Arcade!</h3>
            <div className="about-progress">
              <div className="about-progress-bar">
                <div className="about-progress-fill"></div>
              </div>
              <p>Track your progress like this!</p>
            </div>
            <button className="button-fancy" onClick={() => navigate("/app")}>
              Start Learning Now! 🚀
            </button>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>© 2025 Language Learning Arcade. All rights reserved.</p>
      </footer>
    </div>
  );
}