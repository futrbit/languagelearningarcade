import React, { useState } from "react";

const sampleSentences = [
  {
    sentence: "The man went to the ______ to buy a talking parrot.",
    answer: "pet shop",
  },
  {
    sentence: "She likes to eat ______ in the morning.",
    answer: "cereal",
  },
];

export default function BlanketyBlank({ sentences = sampleSentences }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(null);

  const current = sentences[currentIndex];

  const checkAnswer = () => {
    if (input.trim().toLowerCase() === current.answer.toLowerCase()) {
      setFeedback({ correct: true, message: "Correct! 🎉" });
    } else {
      setFeedback({ correct: false, message: `Oops! The correct answer was: "${current.answer}"` });
    }
  };

  const next = () => {
    setInput("");
    setFeedback(null);
    if (currentIndex + 1 < sentences.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  return (
    <div style={{ maxWidth: 400, padding: 20, border: "2px solid #6f42c1", borderRadius: 8 }}>
      <h3>Blankety Blank</h3>
      <p>{current.sentence}</p>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        disabled={feedback !== null}
        style={{ width: "100%", padding: 8, fontSize: 16 }}
      />
      {!feedback ? (
        <button onClick={checkAnswer} style={{ marginTop: 10, width: "100%", padding: 10 }}>
          Submit
        </button>
      ) : (
        <>
          <p style={{ color: feedback.correct ? "green" : "red", marginTop: 10 }}>{feedback.message}</p>
          <button onClick={next} style={{ marginTop: 10, width: "100%", padding: 10 }}>
            {currentIndex + 1 < sentences.length ? "Next" : "Restart"}
          </button>
        </>
      )}
    </div>
  );
}
