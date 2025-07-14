import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Lessons() {
  const navigate = useNavigate();
  const allLessons = JSON.parse(localStorage.getItem("lessons") || "[]");
  const [searchLevel, setSearchLevel] = useState("");

  // Sort by timestamp (latest first)
  const lessons = allLessons
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .filter((lesson) =>
      lesson.studentLevel.toLowerCase().includes(searchLevel.toLowerCase())
    );

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <h2>📘 Your Lessons</h2>
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
      </div>

      {lessons.length === 0 ? (
        <p>No lessons found. Try a different level or create one in the English Class room!</p>
      ) : (
        lessons.map((lesson, index) => (
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
            <h3>
              Lesson #{allLessons.length - index} – {lesson.timestamp}{" "}
              {lesson.completed ? "(Completed)" : ""}
            </h3>
            <p><strong>Level:</strong> {lesson.studentLevel}</p>
            <p><strong>Skill Focus:</strong> {lesson.skillFocus}</p>
            <p><strong>Teacher:</strong> {lesson.teacher}</p>
            <p><strong>Reason:</strong> {lesson.reason}</p>
            <p><strong>Age:</strong> {lesson.age}</p>
            {lesson.module_lesson && (
              <p><strong>Module Lesson:</strong> {lesson.module_lesson}</p>
            )}
            <h4>Class Plan:</h4>
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
          </div>
        ))
      )}
    </div>
  );
}
