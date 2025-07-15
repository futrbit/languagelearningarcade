import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import "../styles.css";

export default function Progress() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(localStorage.getItem("currentUser") || null);
  const [userData, setUserData] = useState({ displayName: "User" });
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const validSkills = ["Speaking", "Grammar", "Vocabulary", "Writing", "Reading"];

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

    const loadProgress = async () => {
      setLoading(true);
      try {
        const storedCourse = JSON.parse(localStorage.getItem(`course_${currentUser}`) || "{}");
        const storedLessons = JSON.parse(localStorage.getItem(`lessons_${currentUser}`) || "[]");
        setCourse(storedCourse);
        setLessons(storedLessons);

        const userDoc = await getDoc(doc(db, "users", currentUser));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.course) {
            localStorage.setItem(`course_${currentUser}`, JSON.stringify(data.course));
            setCourse(data.course);
          }
          if (data.lessons) {
            localStorage.setItem(`lessons_${currentUser}`, JSON.stringify(data.lessons));
            setLessons(data.lessons);
          }
        } else {
          setError("No progress data found.");
        }
      } catch (err) {
        console.error("Error loading progress:", err);
        setError("Failed to load progress. Try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [currentUser]);

  const courseData = course || {};
  const totalLessons = courseData.skills?.reduce((sum, skill) => sum + (skill.required || 10), 0) || 50;
  const completedLessons = courseData.skills?.reduce((sum, skill) => sum + (skill.completed || 0), 0) || 0;
  const progressPercentage = Math.min((completedLessons / totalLessons) * 100, 100);
  const level = Math.floor(completedLessons / 10) + 1;
  const badges = JSON.parse(localStorage.getItem(`badges_${currentUser}`) || "[]");

  const skillProgress = courseData.skills?.map((skill) => ({
    skill: skill.skill,
    percentage: Math.min(((skill.completed || 0) / (skill.required || 10)) * 100, 100),
    completed: skill.completed || 0,
    required: skill.required || 10,
  })) || [];

  const speakingReason = (() => {
    const reason = course?.reason || lessons[0]?.reason || "personal growth";
    if (reason.toLowerCase().includes("business")) return "business";
    if (reason.toLowerCase().includes("travel")) return "travel";
    return "personal";
  })();

  const completedSpeakingModules = (() => {
    const speakingSkill = course?.skills?.find((s) => s.skill === "Speaking");
    return speakingSkill?.lessons
      ?.filter((l) => l.module_lesson && l.completed)
      .map((l) => l.module_lesson)
      .filter((v, i, self) => self.indexOf(v) === i)
      .sort((a, b) => a - b) || [];
  })();

  return (
    <div className="landing-page">
      <div className="landing-content section-border" style={{ marginBottom: "100px" }}>
        <h1>📊 Your Progress</h1>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : (
          <>
            <p>
              Welcome, <strong>{userData.displayName}</strong>! Lessons completed: {completedLessons}/{totalLessons}
            </p>

            <div className="progress-bar-container">
              <h3>Level {level}</h3>
              <div className="progress-bar">
                <div className="progress-fill neon-glow" style={{ width: `${progressPercentage}%` }}>
                  <span className="progress-text">{Math.round(progressPercentage)}%</span>
                </div>
              </div>
              <p>Keep going to reach Level {level + 1} 🏆</p>
            </div>

            <h3 style={{ marginTop: "40px" }}>Skill Progress</h3>
            {skillProgress.length > 0 ? (
              <div className="skill-progress-container">
                {skillProgress.map(({ skill, percentage, completed, required }) => (
                  <div key={skill} className="skill-progress">
                    <h4>{skill}: {completed}/{required}</h4>
                    <div className="skill-progress-bar">
                      <div
                        className="skill-progress-fill"
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="skill-progress-text">{Math.round(percentage)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No skill data found yet.</p>
            )}

            {badges.length > 0 && (
              <div className="badges" style={{ marginTop: "40px" }}>
                <h3>Your Badges</h3>
                <ul className="markdown-list">
                  {badges.map((badge, index) => (
                    <li key={index}>🏅 {badge}</li>
                  ))}
                </ul>
              </div>
            )}

            {completedSpeakingModules.length > 0 && (
              <>
                <h3 style={{ marginTop: "40px" }}>Speaking Modules Completed ({speakingReason})</h3>
                <ul className="markdown-list">
                  {completedSpeakingModules.map((num) => (
                    <li key={num}>🎤 Module {num}: {speakingModules[speakingReason][num - 1]?.topic || "Topic Unknown"}</li>
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
