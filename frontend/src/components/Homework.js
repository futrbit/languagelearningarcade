import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles.css";

export default function Homework() {
  const [homeworkList, setHomeworkList] = useState([]);
  const user = localStorage.getItem("currentUser");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    try {
      const saved = localStorage.getItem(`homework_${user}`);
      setHomeworkList(saved ? JSON.parse(saved) : []);
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
      <div className="landing-page">
        <div className="landing-content section-border">
          <h2>Please log in to view your homework.</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <div className="landing-content section-border">
        <div className="homework-header">
          <button className="button-primary" onClick={() => navigate("/app")}>
            ⬅️ Back to Arcade
          </button>
          {homeworkList.length > 0 && (
            <button className="button-secondary" onClick={handleDownloadAll}>
              📥 Download All
            </button>
          )}
        </div>

        <h2 className="neon-glow">📚 {user}'s Saved Homework</h2>

        {homeworkList.length === 0 ? (
          <p>No homework saved yet. Complete and save some worksheets!</p>
        ) : (
          homeworkList
            .slice()
            .reverse()
            .map((hw, index) => (
              <div key={index} className="homework-card">
                <button className="button-glow small" onClick={() => handleDownloadOne(hw, index)}>
                  💾 Download This
                </button>
                <div className="homework-meta">Saved on: {hw.timestamp || "Unknown date"}</div>
                <div className="homework-notes">
                  <strong>Notes:</strong> <br />
                  {hw.notes || "(No notes)"}
                </div>
                <div className="homework-exercises">
                  <strong>Exercises:</strong>
                  {hw.exercises && Object.keys(hw.exercises).length > 0 ? (
                    <ul>
                      {Object.entries(hw.exercises).map(([exIndex, answer]) => (
                        <li key={exIndex}>
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
    </div>
  );
}
