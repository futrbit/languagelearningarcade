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

  // Speaking modules configuration
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

  // Auth state listener
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

  // Load course and lessons
  useEffect(() => {
    if (!currentUser) return;

    const loadProgress = async (retries = 3) => {
      setLoading(true);
      try {
        // Load from localStorage
        const storedCourse = JSON.parse(localStorage.getItem(`course_${currentUser}`) || "{}");
        const storedLessons = JSON.parse(localStorage.getItem(`lessons_${currentUser}`) || "[]");
        setCourse(storedCourse);
        setLessons(storedLessons);
        console.log("Loaded course from localStorage:", storedCourse);
        console.log("Loaded lessons from localStorage:", storedLessons);

        // Sync with Firestore
        if (auth.currentUser) {
          let attempt = 0;
          while (attempt < retries) {
            try {
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
                console.log("Loaded Firestore data:", data);
                break;
              } else {
                console.warn("No user document found in Firestore");
                setError("No progress data found in server. Using local data.");
                break;
              }
            } catch (error) {
              attempt++;
              console.warn(`Firestore read attempt ${attempt} failed:`, error);
              if (attempt === retries) {
                setError("Failed to load progress from server. Using local data. Try disabling ad blockers for firestore.googleapis.com.");
                break;
              }
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
            }
          }
        }
      } catch (err) {
        console.error("Error loading progress:", err);
        setError("Failed to load progress. Try disabling ad blockers for firestore.googleapis.com.");
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [currentUser]);

  // Initialize course if not present
  const initializeCourse = () => {
    let courseData = course || JSON.parse(localStorage.getItem(`course_${currentUser}`) || "{}");
    if (!courseData.skills || !Array.isArray(courseData.skills)) {
      courseData = {
        level: lessons[0]?.studentLevel || "A1",
        reason: lessons[0]?.reason || "personal growth",
        age: parseInt(JSON.parse(localStorage.getItem("users") || "{}")[currentUser]?.age, 10) || 18,
        skills: validSkills.map((skill) => ({
          skill,
          completed: 0,
          required: 10,
          lessons: [],
        })),
      };
      localStorage.setItem(`course_${currentUser}`, JSON.stringify(courseData));
      setCourse(courseData);
      console.log("Initialized course for", currentUser, ":", courseData);
    }
    return courseData;
  };

  // Get module reason
  const getModuleReason = () => {
    const reason = course?.reason || lessons[0]?.reason || "personal growth";
    if (reason.toLowerCase().includes("business")) return "business";
    if (reason.toLowerCase().includes("travel")) return "travel";
    return "personal";
  };

  // Get completed speaking modules
  const getSpeakingModules = () => {
    const speakingSkill = course?.skills?.find((s) => s.skill === "Speaking");
    return speakingSkill?.lessons
      ?.filter((l) => l.module_lesson && l.completed)
      .map((l) => l.module_lesson)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => a - b) || [];
  };

  // Progress calculations
  const courseData = course || initializeCourse();
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
  const speakingReason = getModuleReason();
  const completedSpeakingModules = getSpeakingModules();

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
              Welcome, {userData.displayName || "User"}! Total lessons completed: {completedLessons}
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
                {skillProgress.map(({ skill, percentage, completed, required }) => (
                  <div key={skill} className="skill-progress">
                    <h4>{skill}: {completed}/{required}</h4>
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
              <p>No skill data found yet. Complete a lesson to track progress!</p>
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
