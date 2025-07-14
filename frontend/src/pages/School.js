import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles.css";

// Rooms for the school map
const rooms = [
  { id: "classroom1", name: "English Class", x: 10, y: 10, width: 120, height: 80 },
  { id: "arcade", name: "Game Room", x: 150, y: 10, width: 120, height: 80 },
  { id: "library", name: "Library", x: 10, y: 110, width: 120, height: 80 },
  { id: "media", name: "Media Room", x: 150, y: 110, width: 120, height: 80 },
];

// Teacher avatars for the "school"
const teachers = [
  { name: "Emma", avatar: "/emma.png" },
  { name: "Liam", avatar: "/liam.png" },
  { name: "Olivia", avatar: "/olivia.png" },
  { name: "Noah", avatar: "/noah.png" },
  { name: "Sophia", avatar: "/sophia.png" },
];

// School Map Component
const SchoolMap = ({ onSelectRoom }) => (
  <div className="section-border">
    <h3>School Map</h3>
    <svg width="300" height="220" style={{ border: "2px solid var(--primary-color)", background: "var(--background-color)" }}>
      {rooms.map(({ id, name, x, y, width, height }) => (
        <g
          key={id}
          onClick={() => onSelectRoom(id)}
          style={{ cursor: "pointer" }}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSelectRoom(id);
          }}
          aria-label={`Select ${name}`}
        >
          <rect x={x} y={y} width={width} height={height} fill="#fff" stroke="var(--primary-color)" strokeWidth={2} />
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize="14"
            pointerEvents="none"
          >
            {name}
          </text>
        </g>
      ))}
    </svg>
  </div>
);

// Word Chain Game Component
const WordChainGame = ({ words }) => {
  const [usedWords, setUsedWords] = useState([words[0]]);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("Start with a word beginning with: " + words[0].slice(-1));

  const lastWord = usedWords[usedWords.length - 1];
  const expectedLetter = lastWord.slice(-1).toLowerCase();

  const handleSubmit = (e) => {
    e.preventDefault();
    const newWord = input.trim().toLowerCase();

    if (!newWord) return setMessage("Please enter a word.");
    if (usedWords.includes(newWord)) return setMessage("You already used that word!");
    if (newWord[0] !== expectedLetter) return setMessage(`Word must start with '${expectedLetter.toUpperCase()}'`);
    if (!words.includes(newWord)) return setMessage("Word not in vocabulary list.");

    setUsedWords([...usedWords, newWord]);
    setInput("");
    setMessage("Great! Next word should start with: " + newWord.slice(-1).toUpperCase());
  };

  return (
    <div className="section-border">
      <h3>Word Chain Game</h3>
      <p>Current chain: {usedWords.join(" → ")}</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={`Word starting with '${expectedLetter.toUpperCase()}'`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ padding: "8px", width: "100%", borderRadius: "4px" }}
          aria-label={`Enter word starting with ${expectedLetter.toUpperCase()}`}
        />
        <button className="button-primary" type="submit" style={{ marginTop: "10px", width: "100%" }}>
          Submit
        </button>
      </form>
      <p style={{ marginTop: "10px", color: "var(--success-color)" }}>{message}</p>
    </div>
  );
};

export default function School() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Check login
  useEffect(() => {
    const username = localStorage.getItem("llarcade_user") || localStorage.getItem("currentUser"); // Fallback to currentUser
    if (!username) {
      navigate("/login");
    } else {
      setUser(username);
    }
  }, [navigate]);

  // Basic vocab for Word Chain
  const vocab = ["cat", "tiger", "rabbit", "tarantula", "ant", "tortoise", "elephant", "tapir"];

  const renderContent = () => {
    switch (selectedRoom) {
      case "classroom1":
        return (
          <div>
            <h3>English Class</h3>
            <p>Practice with our star teachers!</p>
            <div className="avatar-container">
              {teachers.map((teacher) => (
                <div key={teacher.name} style={{ textAlign: "center", margin: "10px" }}>
                  <img
                    src={teacher.avatar}
                    alt={`Teacher ${teacher.name}`}
                    style={{ width: "50px", height: "50px", borderRadius: "50%" }}
                    onError={(e) => (e.target.src = "/avatars/default.png")}
                  />
                  <p>{teacher.name}</p>
                </div>
              ))}
            </div>
            <button className="button-primary" onClick={() => navigate("/app")}>
              Start a Lesson
            </button>
          </div>
        );
      case "arcade":
        return <WordChainGame words={vocab} />;
      case "library":
        return <p>Quiz Game coming soon!</p>;
      case "media":
        return <p>Media Room (Videos, Songs) coming soon!</p>;
      default:
        return <p style={{ fontSize: "18px" }}>Select a room to get started, {user}!</p>;
    }
  };

  return (
    <div>
      <header className="header">
        <img
          src="/logo.png"
          alt="Language Learning Arcade Logo"
          onError={(e) => (e.target.src = "https://via.placeholder.com/150x50?text=Logo")}
        />
        <nav>
          <a href="/" aria-label="Go to home page">Home</a>
          <a href="/about" aria-label="Go to about page">About</a>
          <a href="/app" aria-label="Start learning English">Learn</a>
          <a href="/progress" aria-label="View progress">Progress</a>
          <a href="/homework" aria-label="View homework">Homework</a>
          <a href="/lessons" aria-label="View lessons">Lessons</a>
        </nav>
      </header>
      <div className="app-container">
        <h1>Welcome to the Language Learning Arcade, {user}!</h1>
        <button
          className="button-primary"
          onClick={() => {
            localStorage.removeItem("llarcade_user");
            localStorage.removeItem("currentUser");
            navigate("/");
          }}
          style={{ marginBottom: "20px" }}
        >
          Logout
        </button>
        <div style={{ display: "flex", gap: "30px" }}>
          <SchoolMap onSelectRoom={setSelectedRoom} />
          <div style={{ flexGrow: 1 }}>{renderContent()}</div>
        </div>
      </div>
      <footer className="footer">
        <p>© 2025 Language Learning Arcade. Built with 🎮 and ❤️</p>
      </footer>
    </div>
  );
}