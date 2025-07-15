import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Lessons() {
  const navigate = useNavigate();
  const currentUser = localStorage.getItem("currentUser") || auth.currentUser?.uid || "test_user_123";
  const [searchLevel, setSearchLevel] = useState("");
  const [searchSkill, setSearchSkill] = useState("");
  const [lessons, setLessons] = useState([]);
  const [homework, setHomework] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      // Load from localStorage
      const savedLessons = JSON.parse(localStorage.getItem(`lessons_${currentUser}`) || "[]");
      const savedHomework = JSON.parse(localStorage.getItem(`homework_${currentUser}`) || "[]");
      console.log("Lessons loaded:", savedLessons);
      console.log("Homework loaded:", savedHomework);
      setLessons(savedLessons);
      setHomework(savedHomework);

      // Load from Firestore
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
            console.log("Firestore data loaded:", data);
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
    <div
      style={{
        padding: "20px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <h2>📘 Your Lessons & Homework</h2>
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <button
          onClick={() => navigate("/app")}
          style={{
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            padding: "8px 12px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          ⬅️ Back to Arcade
        </button>
        <input
          type="text"
          placeholder="🔍 Filter by level (e.g. A2, B1)"
          value={searchLevel}
          onChange={(e) => setSearchLevel(e.target.value)}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />
        <input
          type="text"
          placeholder="🔍 Filter by skill (e.g. Speaking, Grammar)"
          value={searchSkill}
          onChange={(e) => setSearchSkill(e.target.value)}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />
      </div>

      <h3>Lessons</h3>
      {filteredLessons.length === 0 ? (
        <p>No lessons found. Try a different level or skill, or create one in the English Class room!</p>
      ) : (
        filteredLessons.map((lesson, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              marginBottom: "15px",
              borderRadius: "8px",
              backgroundColor: lesson.completed ? "#e9ffe9" : "#f9f9f9",
            }}
          >
            <h4>
              Lesson #{lessons.length - index} – {lesson.timestamp}{" "}
              {lesson.completed ? "(Completed)" : ""}
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
            <p
              style={{
                whiteSpace: "pre-wrap",
                backgroundColor: "#e9ffe9",
                padding: "10px",
                borderRadius: "6px",
              }}
            >
              {lesson.classPlan}
            </p>
            {lesson.feedback && (
              <>
                <h5>Feedback:</h5>
                <p
                  style={{
                    whiteSpace: "pre-wrap",
                    backgroundColor: "#f0f0f0",
                    padding: "10px",
                    borderRadius: "6px",
                  }}
                >
                  {lesson.feedback}
                </p>
              </>
            )}
          </div>
        ))
      )}

      <h3>Homework</h3>
      {filteredHomework.length === 0 ? (
        <p>No homework found. Try saving notes in the Notepad!</p>
      ) : (
        filteredHomework.map((item, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              marginBottom: "15px",
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
            }}
          >
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
            <p
              style={{
                whiteSpace: "pre-wrap",
                backgroundColor: "#e9ffe9",
                padding: "10px",
                borderRadius: "6px",
              }}
            >
              {item.notes}
            </p>
            {item.exercises && Object.keys(item.exercises).length > 0 && (
              <>
                <h5>Exercises:</h5>
                <p
                  style={{
                    whiteSpace: "pre-wrap",
                    backgroundColor: "#f0f0f0",
                    padding: "10px",
                    borderRadius: "6px",
                  }}
                >
                  {JSON.stringify(item.exercises, null, 2)}
                </p>
              </>
            )}
            {item.feedback && (
              <>
                <h5>Feedback:</h5>
                <p
                  style={{
                    whiteSpace: "pre-wrap",
                    backgroundColor: "#f0f0f0",
                    padding: "10px",
                    borderRadius: "6px",
                  }}
                >
                  {item.feedback}
                </p>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
