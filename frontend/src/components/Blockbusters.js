import React, { useState } from "react";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const sampleWords = {
  A: ["Apple", "Amazing", "Active"],
  B: ["Big", "Beautiful", "Brave"],
  C: ["Cool", "Creative", "Clever"],
};

export default function Blockbusters({ wordList = sampleWords }) {
  const [currentLetter, setCurrentLetter] = useState("A");
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(null);

  const checkWord = () => {
    const validWords = wordList[currentLetter] || [];
    if (validWords.map(w => w.toLowerCase()).includes(input.trim().toLowerCase())) {
      setFeedback({ correct: true, message: `Correct! "${input}" starts with "${currentLetter}"` });
    } else {
      setFeedback({ correct: false, message: `Nope! Try a different word starting with "${currentLetter}"` });
    }
  };

  const nextLetter = () => {
    setFeedback(null);
    setInput("");
    const currentIndex = alphabet.indexOf(currentLetter);
    if (currentIndex + 1 < alphabet.length) {
      setCurrentLetter(alphabet[currentIndex + 1]);
    } else {
      setCurrentLetter("A");
    }
  };

  return (
    <div style={{ maxWidth: 400, padding: 20, border: "2px solid #20c997", borderRadius: 8 }}>
      <h3>Blockbusters</h3>
      <p>Give me a word starting with <strong>{currentLetter}</strong>:</p>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        disabled={feedback !== null}
        style={{ width: "100%", padding: 8, fontSize: 16 }}
      />
      {!feedback ? (
        <button onClick={checkWord} style={{ marginTop: 10, width: "100%", padding: 10 }}>
          Submit
        </button>
      ) : (
        <>
          <p style={{ color: feedback.correct ? "green" : "red", marginTop: 10 }}>{feedback.message}</p>
          <button onClick={nextLetter} style={{ marginTop: 10, width: "100%", padding: 10 }}>
            Next Letter
          </button>
        </>
      )}
    </div>
  );
}
