import React, { useState } from "react";

const sampleQuestions = [
  {
    question: "What is the capital of England?",
    options: ["London", "Paris", "New York", "Berlin"],
    correctAnswer: "London",
  },
  {
    question: "Which is a mammal?",
    options: ["Shark", "Dolphin", "Salmon", "Tuna"],
    correctAnswer: "Dolphin",
  },
  {
    question: "Choose the correct past tense: I ___ to the store yesterday.",
    options: ["go", "went", "gone", "going"],
    correctAnswer: "went",
  },
];

export default function MillionaireGame({ questions = sampleQuestions }) {
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [lifelines, setLifelines] = useState({ fiftyFifty: true, askAI: true });

  const currentQ = questions[qIndex];

  // Lifeline 50/50: remove two incorrect options randomly
  const getFiftyFiftyOptions = () => {
    if (!currentQ) return [];
    const incorrect = currentQ.options.filter(opt => opt !== currentQ.correctAnswer);
    // randomly pick 2 incorrect to remove
    const toRemove = incorrect.sort(() => 0.5 - Math.random()).slice(0, 2);
    return currentQ.options.filter(opt => !toRemove.includes(opt));
  };

  const [availableOptions, setAvailableOptions] = useState(currentQ.options);

  const handleSelect = (opt) => {
    setSelected(opt);
    setShowFeedback(true);
    if (opt === currentQ.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (qIndex + 1 >= questions.length) {
      setGameOver(true);
    } else {
      setQIndex(qIndex + 1);
      setSelected(null);
      setShowFeedback(false);
      setAvailableOptions(questions[qIndex + 1].options);
    }
  };

  const useFiftyFifty = () => {
    if (!lifelines.fiftyFifty) return;
    setAvailableOptions(getFiftyFiftyOptions());
    setLifelines({ ...lifelines, fiftyFifty: false });
  };

  const useAskAI = () => {
    if (!lifelines.askAI) return;
    alert(`AI Hint: The correct answer is probably "${currentQ.correctAnswer}".`);
    setLifelines({ ...lifelines, askAI: false });
  };

  if (gameOver) {
    return (
      <div style={{ maxWidth: 400, padding: 20, border: "2px solid #ffc107", borderRadius: 8 }}>
        <h2>Game Over!</h2>
        <p>Your final score: {score} / {questions.length}</p>
        <button onClick={() => {
          setQIndex(0);
          setScore(0);
          setSelected(null);
          setShowFeedback(false);
          setGameOver(false);
          setLifelines({ fiftyFifty: true, askAI: true });
          setAvailableOptions(questions[0].options);
        }}>Play Again</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, padding: 20, border: "2px solid #ffc107", borderRadius: 8 }}>
      <h3>Who Wants to Be a Millionaire?</h3>
      <p><strong>Question {qIndex + 1}:</strong> {currentQ.question}</p>
      <div>
        {availableOptions.map(opt => (
          <button
            key={opt}
            disabled={!!selected}
            onClick={() => handleSelect(opt)}
            style={{
              backgroundColor: selected === opt ? (opt === currentQ.correctAnswer ? "lightgreen" : "salmon") : "",
              cursor: selected ? "default" : "pointer",
              width: "100%",
              padding: "10px",
              margin: "5px 0",
              fontSize: "16px"
            }}
          >
            {opt}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 15 }}>
        <button disabled={!lifelines.fiftyFifty || !!selected} onClick={useFiftyFifty} style={{ marginRight: 10 }}>
          50/50 Lifeline
        </button>
        <button disabled={!lifelines.askAI || !!selected} onClick={useAskAI}>
          Ask AI Lifeline
        </button>
      </div>

      {showFeedback && (
        <div style={{ marginTop: 15 }}>
          {selected === currentQ.correctAnswer ? (
            <p style={{ color: "green" }}>Correct! 🎉</p>
          ) : (
            <p style={{ color: "red" }}>Wrong! The correct answer is: {currentQ.correctAnswer}</p>
          )}
          <button onClick={handleNext}>Next Question</button>
        </div>
      )}

      <p style={{ marginTop: 20 }}>Score: {score}</p>
    </div>
  );
}
