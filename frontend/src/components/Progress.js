import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import "../styles.css";

export default function Progress() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(localStorage.getItem("currentUser") || null);
  const [userData, setUserData] = useState({ displayName: "User" });
  const [lessons, setLessons] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user.uid);
        localStorage.setItem("currentUser", user.uid);
        setUserData({ displayName: user.displayName || "User" });
      } else {
        setCurrentUser(null);
        localStorage.removeItem("currentUser");
        setError("Please log in to view your progress.");
        setLoading(false);
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!currentUser) return;

    try {
      const storedLessons = JSON.parse(localStorage.getItem("lessons") || "[]");
      setLessons(storedLessons);
      setLoading(false);
    } catch (err) {
      console.error("Error loading lessons:", err);
      setError("Failed to load lesson history.");
      setLoading(false);
    }
  }, [currentUser]);

  const speakingModules = {
    business: [
      { lesson: 1, topic: "Storytelling in Business" },
      { lesson: 2, topic: "Quick Thinking in Meetings" },
      { lesson: 3, topic: "Professional Networking" },
      { lesson: 4, topic: "Negotiations" },
      { lesson: 5, topic: "Presentation Delivery" },
    ],
    travel: [
      { lesson: 1, topic: "Asking for Directions" },
      { lesson: 2, topic: "Ordering Food" },
      { lesson: 3, topic: "Booking Accommodations" },
      { lesson: 4, topic: "Making Small Talk" },
      { lesson: 5, topic: "Handling Emergencies" },
    ],
    personal: [
      { lesson: 1, topic: "Casual Conversation" },
      { lesson: 2, topic: "Building Rapport in Conversations" },
      { lesson: 3, topic: "Debating" },
      { lesson: 4, topic: "Describing Experiences" },
      { lesson: 5, topic: "Expressing Opinions" },
    ],
  };

  const getModuleReason = () => {
    const reason = lessons[0]?.reason || "personal growth";
    if (reason.toLowerCase().includes("business")) return "business";
    if (reason.toLowerCase().includes("travel")) return "travel";
    return "personal";
  };

  const getSkillProgress = () => {
    const skillCounts = {};
    lessons.forEach((lesson) => {
      if (!lesson.completed) return;
      const skill = lesson.skillFocus || "Unknown";
      if (!skillCounts[skill]) skillCounts[skill] = 1;
      else skillCounts[skill]++;
    });
    return skillCounts;
  };

  const getSpeakingModules = () => {
    return lessons
      .filter((l) => l.skillFocus === "Speaking" && l.module_lesson && l.completed)
      .map((l) => l.module_lesson)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => a - b);
  };

  // Progress bar logic
  const totalLessons = 10; // Adjust based on your app's total lessons
  const completedLessons = lessons.filter((l) => l.completed).length;
  const progressPercentage = Math.min((completedLessons / totalLessons) * 100, 100);
  const level = Math.floor(completedLessons / 2) + 1;
  const badges = lessons.map((l) => l.badge).filter(Boolean);
  const skillSummary = getSkillProgress();
  const speakingReason = getModuleReason();
  const completedSpeakingModules = getSpeakingModules();

  // Skill-specific progress
  const maxLessonsPerSkill = 5; // Adjust based on max lessons per skill (e.g., Writing, Speaking)
  const skillProgress = Object.entries(skillSummary).map(([skill, count]) => ({
    skill,
    percentage: Math.min((count / maxLessonsPerSkill) * 100, 100),
  }));

  return (
    <div>
      <header className="header">
        <img src="/logo.png" alt="Language Learning Arcade Logo" className="header-logo" />
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/progress">Progress</a>
          <a href="/homework">Homework</a>
          <a href="/lessons">Lessons</a>
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

      <div className="app-container section-border">
        <h2>🎮 Your Language Adventure Progress 🚀</h2>
        {loading ? (
          <p>Loading progress...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : (
          <>
            <p>
              Welcome, {userData.displayName || "User"}! Lessons completed: {completedLessons}
            </p>

            {/* Main Progress Bar */}
            <div className="progress-bar-container">
              <h3>Overall Progress: Level {level}</h3>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressPercentage}%` }}>
                  <span className="progress-text">{`${Math.round(progressPercentage)}%`}</span>
                </div>
              </div>
              <p>Keep going to reach Level {level + 1}! 🏅</p>
            </div>

            {/* Skill-Specific Progress Bars */}
            <h3>Skill Progress</h3>
            {skillProgress.length > 0 ? (
              <div className="skill-progress-container">
                {skillProgress.map(({ skill, percentage }) => (
                  <div key={skill} className="skill-progress">
                    <h4>{skill}</h4>
                    <div className="skill-progress-bar">
                      <div
                        className="skill-progress-fill"
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="skill-progress-text">{`${Math.round(percentage)}%`}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No skill data found yet.</p>
            )}

            {/* Badges */}
            {badges.length > 0 && (
              <div className="badges">
                <h3>Your Badges</h3>
                <ul className="markdown-list">
                  {badges.map((badge, index) => (
                    <li key={index}>🏆 {badge}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Speaking Modules */}
            {completedSpeakingModules.length > 0 && (
              <>
                <h3>Speaking Modules Completed ({speakingReason})</h3>
                <ul className="markdown-list">
                  {completedSpeakingModules.map((moduleNumber) => (
                    <li key={moduleNumber}>
                      Module {moduleNumber}: {speakingModules[speakingReason][moduleNumber - 1]?.topic || "Unknown Topic"}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>

      <footer className="footer">
        <p>© 2025 Language Learning Arcade. All rights reserved.</p>
      </footer>
    </div>
  );
}