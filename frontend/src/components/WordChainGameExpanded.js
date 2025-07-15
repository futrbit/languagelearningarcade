import React, { useState, useEffect } from "react";

export default function WordChainGameExpanded({ words }) {
  const [usedWords, setUsedWords] = useState([words[0]]);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("Start with a word beginning with: " + words[0].slice(-1));
  const [timeLeft, setTimeLeft] = useState(15); // 15 seconds timer

  const lastWord = usedWords[usedWords.length - 1];
  const expectedLetter = lastWord.slice(-1).toLowerCase();

  useEffect(() => {
    if (timeLeft <= 0) {
      setMessage("Time's up! Try again.");
      setInput("");
      setTimeLeft(15);
      return;
    }
    if (input) {
      setTimeLeft(15);
    }
    const timerId = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, input]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newWord = input.trim().toLowerCase();

    if (!newWord) {
      setMessage("Please enter a word.");
      return;
    }
    if (usedWords.includes(newWord)) {
      setMessage("You already used that word!");
      return;
    }
    if (newWord[0] !== expectedLetter) {
      setMessage(`Word must start with '${expectedLetter.toUpperCase()}'`);
      return;
    }
    if (!words.includes(newWord)) {
      setMessage("Word not in vocabulary list.");
      return;
    }

    setUsedWords([...usedWords, newWord]);
    setInput("");
    setMessage("Great! Next word should start with: " + newWord.slice(-1).toUpperCase());
    setTimeLeft(15);
  };

  return (
    <div style={{ maxWidth: 400, padding: 10, border: "2px solid #007bff", borderRadius: 8 }}>
      <h3>Word Chain Game</h3>
      <p>Current chain: {usedWords.join(" → ")}</p>
      <p>Time left: {timeLeft}s</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={`Word starting with '${expectedLetter.toUpperCase()}'`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ padding: 8, width: "100%" }}
        />
        <button type="submit" style={{ marginTop: 10, padding: 8, width: "100%" }}>Submit</button>
      </form>
      <p style={{ marginTop: 10, color: "green" }}>{message}</p>
    </div>
  );
}
