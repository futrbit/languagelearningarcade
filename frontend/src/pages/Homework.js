// src/components/Homework.js
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Homework() {
  const navigate = useNavigate();
  const homework = JSON.parse(localStorage.getItem("homework") || "[]");

  return (
    <div style={{ padding: "20px", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h2>📚 Your Homework</h2>
      <button
        onClick={() => navigate("/app")}
        style={{
          marginBottom: "20px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          padding: "8px 12px",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Back to Arcade
      </button>
      {homework.length === 0 ? (
        <p>No homework saved yet. Generate a lesson and save notes to see them here!</p>
      ) : (
        <div>
          {homework.map((entry, index) => (
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
              <h3>Homework #{index + 1} - {entry.timestamp}</h3>
              <p><strong>Level:</strong> {entry.studentLevel}</p>
              <p><strong>Skill Focus:</strong> {entry.skillFocus}</p>
              <p><strong>Style:</strong> {entry.style}</p>
              <h4>Lesson Plan:</h4>
              <p style={{ whiteSpace: "pre-wrap", backgroundColor: "#e9ffe9", padding: "10px", borderRadius: "6px" }}>
                {entry.lesson}
              </p>
              <h4>Notes:</h4>
              <p style={{ whiteSpace: "pre-wrap", backgroundColor: "#fff8dc", padding: "10px", borderRadius: "6px" }}>
                {entry.notes}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}