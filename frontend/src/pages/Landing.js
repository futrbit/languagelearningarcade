import React from "react";
import { useNavigate } from "react-router-dom"; // Replaced Link with useNavigate for consistency
import "../styles.css";

export default function Landing() {
  const navigate = useNavigate();

  // Teacher avatars representing the "school"
  const teachers = [
    { name: "Emma", avatar: "/avatars/emma.png" },
    { name: "Liam", avatar: "/avatars/liam.png" },
    { name: "Olivia", avatar: "/avatars/olivia.png" },
    { name: "Noah", avatar: "/avatars/noah.png" },
    { name: "Sophia", avatar: "/avatars/sophia.png" },
  ];

  return (
    <div>
      <header className="header">
        <img
          src="/logo.png"
          alt="Language Learning Arcade Logo"
          onError={(e) => (e.target.src = "https://via.placeholder.com/150x50?text=Logo")}
        />
        <nav>
          <a href="/about" aria-label="Go to about page">About</a>
          <a href="/login" aria-label="Sign up for Language Learning Arcade">Sign Up</a>
          <a href="/app" aria-label="Start learning English">Start Learning</a>
        </nav>
      </header>
      <div className="landing-container">
        <h1>🎓 The Language Learning Arcade</h1>
        <p>Learn English through games, quests, and AI magic.</p>
        <img
          src="/hero-img.png"
          alt="Learning hero"
          style={{ maxWidth: "100%", borderRadius: "10px", marginTop: "20px" }}
          onError={(e) => (e.target.src = "https://via.placeholder.com/600x300?text=Hero+Image")}
        />
        <div style={{ marginTop: "20px" }}>
          <p>Personalized Learning, Your Way: Tailored English lessons crafted for your level, goals, and interests.</p>
          <p>AI-Enhanced Mastery: Powered by cutting-edge AI, every lesson adapts to your progress in real time.</p>
          <p>Speak with Confidence: Master real-world conversations with our focused Speaking modules.</p>
          <p>Gamified Fun: Earn badges, unlock ranks like Language Hero, and enjoy learning!</p>
          <p>Learn from Star Teachers: Choose Emma, Liam, Olivia, Noah, or Sophia.</p>
          <p>Instant Feedback, Real Progress: Get AI-driven feedback to sharpen your skills.</p>
          <p>Engaging for All Ages: Lessons for kids, teens, and adults.</p>
          <p>Ready for the World: Build fluency for global adventures or career boosts.</p>
        </div>
        <div className="avatar-container" style={{ marginTop: "20px" }}>
          <h3>Meet Our Teachers</h3>
          {teachers.map((teacher) => (
            <div key={teacher.name} style={{ textAlign: "center", margin: "10px" }}>
              <img
                src={teacher.avatar}
                alt={`Teacher ${teacher.name}`}
                style={{ width: "50px", height: "50px", borderRadius: "50%" }}
                onError={(e) => (e.target.src = "/avatars/default.png")}
              />
              <p>{teacher.name}</p>
            </div>
          ))}
        </div>
        <button
          className="button-primary"
          onClick={() => navigate("/login")}
          aria-label="Get started with Language Learning Arcade"
        >
          Get Started
        </button>
      </div>
      <footer className="footer">
        <p>© 2025 Language Learning Arcade. Built with 🎮 and ❤️</p>
      </footer>
    </div>
  );
}