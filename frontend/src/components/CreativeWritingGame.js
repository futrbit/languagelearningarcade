// src/components/CreativeWriting.js
import React, { useState, useEffect } from "react";

const emojiBank = ["🦄", "🍕", "🚀", "🎩", "🐉", "🌋", "🕰️", "🎭", "🐢", "🏰", "👽", "🧃"];

const getRandomEmojis = (count) => {
  const shuffled = [...emojiBank].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const CreativeWriting = () => {
  const [emojis, setEmojis] = useState([]);
  const [story, setStory] = useState("");
  const wordCount = story.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    setEmojis(getRandomEmojis(5));
  }, []);

  const handleReset = () => {
    setEmojis(getRandomEmojis(5));
    setStory("");
  };

  return (
    <div className="section-border" style={{ padding: 20 }}>
      <h2>✍️ Creative Writing Challenge</h2>
      <p>Use all the emojis below to write a short story (max 100 words):</p>

      <div style={{ fontSize: "2rem", marginBottom: 10 }}>
        {emojis.map((emoji, index) => (
          <span key={index} style={{ marginRight: 10 }}>{emoji}</span>
        ))}
      </div>

      <textarea
        rows="6"
        value={story}
        onChange={(e) => setStory(e.target.value)}
        placeholder="Write your story here..."
        className="notepad-textarea"
        style={{ width: "100%", marginBottom: 10 }}
      />

      <p><strong>Word Count:</strong> {wordCount}/100</p>

      <button
        className="button-primary"
        disabled={wordCount > 100}
        onClick={() => alert("Story submitted!")}
      >
        Submit
      </button>
      <button onClick={handleReset} style={{ marginLeft: 10 }}>
        🔄 New Emojis
      </button>
    </div>
  );
};

export default CreativeWriting;
