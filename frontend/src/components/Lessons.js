import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import "../styles.css";

export default function Lessons() {
  const navigate = useNavigate();
  const currentUser = localStorage.getItem("currentUser") || auth.currentUser?.uid || "test_user_123";
  const [searchLevel, setSearchLevel] = useState("");
  const [searchSkill, setSearchSkill] = useState("");
  const [lessons, setLessons] = useState([]);
  const [homework, setHomework] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const savedLessons = JSON.parse(localStorage.getItem(`lessons_${currentUser}`) || "[]");
      const savedHomework = JSON.parse(localStorage.getItem(`homework_${currentUser}`) || "[]");
      setLessons(savedLessons);
      setHomework(savedHomework);

      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.lessons) {
              localStorage.setItem(`lessons_${currentUser}`, JSON.stringify(data.lessons));
              setLessons(data.lessons);
            }
            if (data.homework) {
              localStorage.setItem(`homework_${currentUser}`, JSON.stringify(data.homework));
              setHomework(data.homework);
            }
          }
        } catch (error) {
          console.error("Error loading Firestore data:", error);
          alert("Failed to load lessons from server. Check ad blockers or network settings.");
        }
      }
    };
    loadData();
  }, [currentUser]);

  const filteredLessons = lessons
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .filter(
      (lesson) =>
        lesson.studentLevel.toLowerCase().includes(searchLevel.toLowerCase()) &&
        lesson.skillFocus.toLowerCase().includes(searchSkill.toLowerCase())
    );

  const filteredHomework = homework
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .filter(
      (item) =>
        item.studentLevel.toLowerCase().includes(searchLevel.toLowerCase()) &&
        item.skillFocus.toLowerCase().includes(searchSkill.toLowerCase())
    );

  return (
    <div className="landing-page">
      <div className="landing-content section-border">
        <div className="lesson-header">
          <button className="button-primary" onClick={() => navigate("/app")}>
            ⬅️ Back to Arcade
          </button>
          <input
            type="text"
            placeholder="🔍 Level (e.g. A2, B1)"
            value={searchLevel}
            onChange={(e) => setSearchLevel(e.target.value)}
            className="input-filter"
          />
          <input
            type="text"
            placeholder="🔍 Skill (e.g. Speaking, Grammar)"
            value={searchSkill}
            onChange={(e) => setSearchSkill(e.target.value)}
            className="input-filter"
          />
        </div>

        <h2 className="neon-glow">📘 Your Lessons</h2>
        {filteredLessons.length === 0 ? (
          <p>No lessons found. Try a different filter or create one in the English Class room!</p>
        ) : (
          filteredLessons.map((lesson, index) => (
            <div key={index} className="lesson-card">
              <h4>
                Lesson #{lessons.length - index} – {lesson.timestamp}{" "}
                {lesson.completed ? "(✅ Completed)" : ""}
              </h4>
              <p><strong>Level:</strong> {lesson.studentLevel}</p>
              <p><strong>Skill Focus:</strong> {lesson.skillFocus}</p>
              <p><strong>Teacher:</strong> {lesson.teacher}</p>
              <p><strong>Reason:</strong> {lesson.reason}</p>
              <p><strong>Age:</strong> {lesson.age}</p>
              {lesson.module_lesson && (
                <p><strong>Module Lesson:</strong> {lesson.module_lesson}</p>
              )}
              <h5>Class Plan:</h5>
              <p className="highlight-box">{lesson.classPlan}</p>
              {lesson.feedback && (
                <>
                  <h5>Feedback:</h5>
                  <p className="gray-box">{lesson.feedback}</p>
                </>
              )}
            </div>
          ))
        )}

        <h2 className="neon-glow">📄 Homework</h2>
        {filteredHomework.length === 0 ? (
          <p>No homework found. Try saving notes in the Notepad!</p>
        ) : (
          filteredHomework.map((item, index) => (
            <div key={index} className="lesson-card">
              <h4>
                Homework #{homework.length - index} – {item.timestamp}
              </h4>
              <p><strong>Level:</strong> {item.studentLevel}</p>
              <p><strong>Skill Focus:</strong> {item.skillFocus}</p>
              <p><strong>Teacher:</strong> {item.teacher}</p>
              <p><strong>Reason:</strong> {item.reason}</p>
              <p><strong>Age:</strong> {item.age}</p>
              {item.module_lesson && (
                <p><strong>Module Lesson:</strong> {item.module_lesson}</p>
              )}
              <h5>Notes:</h5>
              <p className="highlight-box">{item.notes}</p>
              {item.exercises && Object.keys(item.exercises).length > 0 && (
                <>
                  <h5>Exercises:</h5>
                  <p className="gray-box">{JSON.stringify(item.exercises, null, 2)}</p>
                </>
              )}
              {item.feedback && (
                <>
                  <h5>Feedback:</h5>
                  <p className="gray-box">{item.feedback}</p>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
