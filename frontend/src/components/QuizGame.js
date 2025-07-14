// src/components/QuizGame.js
import React, { useState } from "react";

export default function QuizGame({ questions }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState("");

  const currentQ = questions[currentIndex];

  const handleAnswer = (option) => {
    setSelectedOption(option);
    if (option === currentQ.correctAnswer) {
      setScore(score + 1);
      setFeedback("Correct! 🎉");
    } else {
      setFeedback(`Wrong! Correct answer: ${currentQ.correctAnswer}`);
    }
  };

  const nextQuestion = () => {
    setSelectedOption(null);
    setFeedback("");
    setCurrentIndex(currentIndex + 1);
  };

  if (currentIndex >= questions.length) {
    return (
      <div style={{ maxWidth: "400px", padding: "20px", border: "2px solid #28a745", borderRadius: "8px" }}>
        <h3>Quiz Complete!</h3>
        <p>Your Score: {score} / {questions.length}</p>
        <button
          onClick={() => {
            setCurrentIndex(0);
            setScore(0);
          }}
        >
          Restart Quiz
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "400px", padding: "20px", border: "2px solid #28a745", borderRadius: "8px" }}>
      <h3>Question {currentIndex + 1}</h3>
      <p>{currentQ.question}</p>
      <div>
        {currentQ.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(opt)}
            disabled={selectedOption !== null}
            style={{
              display: "block",
              margin: "10px 0",
              backgroundColor: selectedOption === opt ? (opt === currentQ.correctAnswer ? "lightgreen" : "salmon") : "",
              width: "100%",
              padding: "10px",
              fontSize: "16px",
              cursor: selectedOption === null ? "pointer" : "default",
            }}
          >
            {opt}
          </button>
        ))}
      </div>
      {feedback && (
        <div>
          <p>{feedback}</p>
          <button onClick={nextQuestion}>Next</button>
        </div>
      )}
      <p>Score: {score}</p>
    </div>
  );
}