import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { getDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles.css";

export default function Progress() {
  const [currentUser, setCurrentUser] = useState(localStorage.getItem("currentUser") || null);
  const [course, setCourse] = useState({});
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        setError("Please log in to view progress.");
        setLoading(false);
        navigate("/login");
        return;
      }

      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser));
        let courseData = JSON.parse(localStorage.getItem(`course_${currentUser}`) || "{}");
        const lessonData = JSON.parse(localStorage.getItem("lessons") || "[]");
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          courseData = {
            level: data.studentLevel || courseData.level || "A1",
            reason: data.why || courseData.reason || "personal growth",
            age: data.age || courseData.age || 18,
            skills: data.skills || courseData.skills || [
              { skill: "Speaking", completed: 0, required: 10, lessons: [] },
              { skill: "Grammar", completed: 0, required: 10, lessons: [] },
              { skill: "Vocabulary", completed: 0, required: 10, lessons: [] },
              { skill: "Writing", completed: 0, required: 10, lessons: [] },
              { skill: "Reading", completed: 0, required: 10, lessons: [] },
            ],
          };
          localStorage.setItem(`course_${currentUser}`, JSON.stringify(courseData));
          setCourse(courseData);
          setLessons(lessonData.filter((lesson) => lesson.studentLevel === courseData.level));
          console.log("Progress: Loaded course data:", courseData);
        } else {
          setError("User profile not found. Please complete setup.");
          navigate("/setup");
        }
      } catch (err) {
        console.error("Error fetching progress data:", err);
        setError("Failed to load progress data: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user.uid);
        localStorage.setItem("currentUser", user.uid);
      } else {
        setCurrentUser(null);
        localStorage.removeItem("currentUser");
        setError("Please log in to view progress.");
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  if (loading) return <p>Loading progress...</p>;
  if (error) return <p className="error-text">{error}</p>;

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
          {currentUser && (
            <button
              className="button-primary"
              onClick={() => {
                auth.signOut();
                localStorage.removeItem("currentUser");
                localStorage.removeItem(`course_${currentUser}`);
                localStorage.removeItem(`homework_${currentUser}`);
                localStorage.removeItem(`used_content_${currentUser}`);
                localStorage.removeItem(`badges_${currentUser}`);
                navigate("/login");
              }}
            >
              Logout
            </button>
          )}
        </nav>
      </header>
      <div className="app-container section-border">
        <h2>📊 Progress</h2>
        <p>Level: {course.level || "A1"}, Reason: {course.reason || "personal growth"}, Age: {course.age || 18}</p>
        <h3>Skills Progress</h3>
        {course.skills && course.skills.length > 0 ? (
          <ul className="markdown-list">
            {course.skills.map((skill, index) => (
              <li key={index}>
                {skill.skill}: {skill.completed || 0}/{skill.required || 10} lessons completed
                {skill.skill === "Speaking" && skill.lessons?.length > 0 && (
                  <p>Module Lessons: {skill.lessons.filter((l) => l.completed).length}/5 completed</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No skills data available.</p>
        )}
        <h3>Lesson History</h3>
        {lessons.length > 0 ? (
          <ul className="markdown-list">
            {lessons.map((lesson, index) => (
              <li key={index}>
                {lesson.timestamp}: {lesson.skillFocus} (Level: {lesson.studentLevel}, Reason: {lesson.reason})
                {lesson.completed ? " (Completed)" : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p>No lessons completed yet.</p>
        )}
      </div>
      <footer className="footer">
        <p>© 2025 Language Learning Arcade. All rights reserved.</p>
      </footer>
    </div>
  );
}