import React, { useState, useEffect } from "react";

export default function FastGrammarRace({ questions = defaultQuestions }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [timeLeft, setTimeLeft] = useState(10);
  const [disabled, setDisabled] = useState(false);

  const currentQ = questions[index];

  // Countdown timer
  useEffect(() => {
    if (disabled) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [index, disabled]);

  const handleOptionClick = (opt) => {
    setDisabled(true);
    if (opt === currentQ.answer) {
      setScore(score + 1);
      setFeedback("✅ Correct!");
    } else {
      setFeedback(`❌ Wrong! It was: ${currentQ.answer}`);
    }
  };

  const handleTimeout = () => {
    setDisabled(true);
    setFeedback(`⏰ Time's up! Correct answer: ${currentQ.answer}`);
  };

  const next = () => {
    setIndex(index + 1);
    setTimeLeft(10);
    setFeedback("");
    setDisabled(false);
  };

  const restart = () => {
    setIndex(0);
    setScore(0);
    setTimeLeft(10);
    setFeedback("");
    setDisabled(false);
  };

  if (index >= questions.length) {
    return (
      <div style={styles.box}>
        <h3>🏁 Grammar Race Finished!</h3>
        <p>Score: {score} / {questions.length}</p>
        <button onClick={restart}>Play Again</button>
      </div>
    );
  }

  return (
    <div style={styles.box}>
      <h3>🏁 Fast Grammar Race</h3>
      <p><strong>Question {index + 1}:</strong> {currentQ.question}</p>
      <div>
        {currentQ.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleOptionClick(opt)}
            disabled={disabled}
            style={{ ...styles.optionBtn, backgroundColor: disabled && opt === currentQ.answer ? "#a5d6a7" : "" }}
          >
            {opt}
          </button>
        ))}
      </div>
      <p>⏱️ Time left: <strong>{timeLeft}</strong> seconds</p>
      {feedback && <p style={{ marginTop: "10px" }}>{feedback}</p>}
      {feedback && <button onClick={next} style={{ marginTop: "10px" }}>Next</button>}
      <p>Score: {score}</p>
    </div>
  );
}

const styles = {
  box: {
    maxWidth: "500px",
    padding: "20px",
    border: "2px solid #ff9800",
    borderRadius: "10px"
  },
  optionBtn: {
    display: "block",
    width: "100%",
    margin: "8px 0",
    padding: "10px",
    fontSize: "16px"
  }
};

const defaultQuestions = [
  {
    question: "She _____ to school every day.",
    options: ["go", "goes", "gone", "going"],
    answer: "goes"
  },
  {
    question: "I have _____ my homework.",
    options: ["do", "did", "done", "does"],
    answer: "done"
  },
  {
    question: "They _____ playing football when I saw them.",
    options: ["was", "were", "are", "is"],
    answer: "were"
  },
  {
    question: "He _____ not like spinach.",
    options: ["do", "did", "does", "doing"],
    answer: "does"
  }
];
