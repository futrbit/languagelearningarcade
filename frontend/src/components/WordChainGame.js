// src/components/WordChainGame.js
import React, { useState } from "react";

export default function WordChainGame({ words }) {
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
    <div style={{ maxWidth: "400px", padding: "10px", border: "2px solid #007bff", borderRadius: "8px" }}>
      <h3>Word Chain Game</h3>
      <p>Current chain: {usedWords.join(" → ")}</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={`Word starting with '${expectedLetter.toUpperCase()}'`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ padding: "8px", width: "100%" }}
        />
        <button type="submit" style={{ marginTop: "10px", padding: "8px", width: "100%" }}>
          Submit
        </button>
      </form>
      <p style={{ marginTop: "10px", color: "green" }}>{message}</p>
    </div>
  );
}