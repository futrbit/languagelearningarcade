import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Homework() {
  const [homeworkList, setHomeworkList] = useState([]);
  const user = localStorage.getItem("currentUser");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    try {
      const saved = localStorage.getItem(`homework_${user}`);
      if (saved) {
        setHomeworkList(JSON.parse(saved));
      } else {
        setHomeworkList([]);
      }
    } catch (err) {
      console.error("Error loading homework:", err);
      setHomeworkList([]);
    }
  }, [user]);

  const downloadJSON = (data, filename) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const href = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const handleDownloadAll = () => {
    downloadJSON(homeworkList, `${user}_homework.json`);
  };

  const handleDownloadOne = (entry, index) => {
    downloadJSON(entry, `${user}_homework_${index + 1}.json`);
  };

  if (!user) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Please log in to view your homework.</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between" }}>
        <button
          onClick={() => navigate("/app")}
          style={{
            padding: "10px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          ⬅️ Back to Arcade
        </button>

        {homeworkList.length > 0 && (
          <button
            onClick={handleDownloadAll}
            style={{
              padding: "10px 16px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            📥 Download All
          </button>
        )}
      </div>

      <h2>📚 {user}'s Saved Homework</h2>

      {homeworkList.length === 0 ? (
        <p>No homework saved yet. Complete and save some worksheets!</p>
      ) : (
        homeworkList
          .slice()
          .reverse()
          .map((hw, index) => (
            <div
              key={index}
              style={{
                marginBottom: "20px",
                padding: "15px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                backgroundColor: "#f9f9f9",
                position: "relative",
              }}
            >
              <button
                onClick={() => handleDownloadOne(hw, index)}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  backgroundColor: "#f90",
                  color: "white",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                💾 Download This
              </button>

              <div style={{ marginBottom: "8px", fontWeight: "600" }}>
                Saved on: {hw.timestamp || "Unknown date"}
              </div>
              <div style={{ whiteSpace: "pre-wrap", marginBottom: "10px" }}>
                <strong>Notes:</strong> <br />
                {hw.notes || "(No notes)"}
              </div>
              <div>
                <strong>Exercises:</strong>
                {hw.exercises && Object.keys(hw.exercises).length > 0 ? (
                  <ul>
                    {Object.entries(hw.exercises).map(([exIndex, answer]) => (
                      <li key={exIndex} style={{ marginBottom: "6px" }}>
                        <strong>Exercise {parseInt(exIndex, 10) + 1}:</strong>{" "}
                        {Array.isArray(answer) ? answer.join(", ") : answer}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>(No exercise answers saved)</p>
                )}
              </div>
            </div>
          ))
      )}
    </div>
  );
}
