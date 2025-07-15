import React, { useState } from "react";
import "../styles.css";

const grid = [
  ["C", "A", "T", "D", "O", "G", "B", "I", "R", "D"],
  ["A", "P", "P", "L", "E", "P", "O", "T", "A", "T"],
  ["R", "A", "B", "B", "I", "T", "S", "U", "N", "G"],
  ["O", "R", "A", "N", "G", "E", "F", "I", "S", "H"],
  ["T", "I", "G", "E", "R", "B", "E", "A", "R", "X"],
  ["Y", "E", "L", "L", "O", "W", "G", "R", "E", "E"],
  ["P", "E", "N", "C", "I", "L", "B", "O", "O", "K"],
  ["M", "O", "U", "S", "E", "K", "E", "Y", "B", "O"],
  ["F", "L", "O", "W", "E", "R", "T", "R", "E", "E"],
  ["H", "O", "U", "S", "E", "C", "A", "R", "T", "O"],
];

const wordsToFind = ["CAT", "DOG", "APPLE", "RABBIT", "ORANGE", "TIGER", "PENCIL", "BOOK", "FISH", "HOUSE"];

const WordSearchGame = () => {
  const [foundWords, setFoundWords] = useState([]);

  const handleWordClick = (word) => {
    if (!foundWords.includes(word)) {
      setFoundWords([...foundWords, word]);
    }
  };

  return (
    <div>
      <h4>🧠 Word Search</h4>
      <div className="word-grid">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="grid-row">
            {row.map((letter, colIndex) => (
              <span key={colIndex} className="grid-cell">{letter}</span>
            ))}
          </div>
        ))}
      </div>
      <div className="word-list">
        <h5>Find these words:</h5>
        <ul>
          {wordsToFind.map((word, index) => (
            <li
              key={index}
              style={{
                textDecoration: foundWords.includes(word) ? "line-through" : "none",
                cursor: "pointer"
              }}
              onClick={() => handleWordClick(word)}
            >
              {word}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WordSearchGame;
