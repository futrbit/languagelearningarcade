// src/components/VocabularyCards.js
import React, { useState } from "react";
import "../styles.css";

const sampleVocabulary = [
  { word: "benevolent", meaning: "Well-meaning and kindly", example: "She had a benevolent smile." },
  { word: "serendipity", meaning: "Finding something good without looking for it", example: "Meeting her was pure serendipity." },
  { word: "ineffable", meaning: "Too great to be expressed in words", example: "The view was ineffable." },
  { word: "ephemeral", meaning: "Lasting a very short time", example: "Youth is ephemeral." },
];

const VocabularyCards = () => {
  const [flipped, setFlipped] = useState({});

  const toggleFlip = (index) => {
    setFlipped((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="section-border" style={{ padding: 20 }}>
      <h2>🧠 Vocabulary Flashcards</h2>
      <p>Click a card to flip and learn!</p>

      <div className="flashcards">
        {sampleVocabulary.map((item, index) => (
          <div
            key={index}
            className={`flashcard ${flipped[index] ? "flipped" : ""}`}
            onClick={() => toggleFlip(index)}
          >
            <div className="flashcard-inner">
              <div className="flashcard-front">
                <p>{item.word}</p>
              </div>
              <div className="flashcard-back">
                <p><strong>Meaning:</strong> {item.meaning}</p>
                <p><strong>Example:</strong> {item.example}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VocabularyCards;
