import React, { useState } from "react";
import "../styles.css";

const clues = {
  across: {
    1: "A domestic feline",
    3: "Opposite of cold",
  },
  down: {
    2: "A yellow fruit",
  },
};

const answers = {
  1: "CAT",
  2: "BANANA",
  3: "HOT",
};

const CrosswordGame = () => {
  const [userAnswers, setUserAnswers] = useState({});

  const handleChange = (number, value) => {
    setUserAnswers({ ...userAnswers, [number]: value.toUpperCase() });
  };

  return (
    <div>
      <h4>✍️ Crossword Puzzle</h4>
      <div>
        <strong>Across</strong>
        <ul>
          {Object.entries(clues.across).map(([num, clue]) => (
            <li key={num}>
              {num}. {clue}
              <input
                type="text"
                onChange={(e) => handleChange(num, e.target.value)}
                value={userAnswers[num] || ""}
              />
            </li>
          ))}
        </ul>
        <strong>Down</strong>
        <ul>
          {Object.entries(clues.down).map(([num, clue]) => (
            <li key={num}>
              {num}. {clue}
              <input
                type="text"
                onChange={(e) => handleChange(num, e.target.value)}
                value={userAnswers[num] || ""}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CrosswordGame;
