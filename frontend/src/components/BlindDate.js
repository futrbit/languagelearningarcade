import React, { useState } from "react";

const scenarios = [
  {
    prompt: "You are at a café and meet someone new. How do you greet them?",
    options: ["Hello! Nice to meet you.", "What's up?", "Hey, wanna hang out?", "Goodbye!"],
    correctAnswer: "Hello! Nice to meet you.",
  },
  {
    prompt: "You want to ask about their hobbies. What do you say?",
    options: [
      "What do you like to do in your free time?",
      "Where do you live?",
      "How old are you?",
      "Do you want coffee?",
    ],
    correctAnswer: "What do you like to do in your free time?",
  },
];

export default function BlindDate({ dialogues = scenarios }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const current = dialogues[step];

  const selectOption = (opt) => {
    setSelected(opt);
    setFeedback(opt === current.correctAnswer ? { correct: true, message: "Great choice! 😊" } : { correct: false, message: "Maybe try a more polite answer." });
  };

  const nextStep = () => {
    setSelected(null);
    setFeedback(null);
    if (step + 1 < dialogues.length) {
      setStep(step + 1);
    } else {
      setStep(0);
    }
  };

  return (
    <div style={{ maxWidth: 400, padding: 20, border: "2px solid #fd7e14", borderRadius: 8 }}>
      <h3>Blind Date Roleplay</h3>
      <p>{current.prompt}</p>
      <div>
        {current.options.map(opt => (
          <button
            key={opt}
            disabled={!!selected}
            onClick={() => selectOption(opt)}
            style={{
              backgroundColor: selected === opt ? (feedback?.correct ? "lightgreen" : "salmon") : "",
              cursor: selected ? "default" : "pointer",
              display: "block",
              margin: "8px 0",
              width: "100%",
              padding: "10px",
              fontSize: "16px"
            }}
          >
            {opt}
          </button>
        ))}
      </div>
      {feedback && (
        <div style={{ marginTop: 10 }}>
          <p style={{ color: feedback.correct ? "green" : "red" }}>{feedback.message}</p>
          <button onClick={nextStep} style={{ width: "100%", padding: 10, marginTop: 10 }}>
            {step + 1 < dialogues.length ? "Next" : "Restart"}
          </button>
        </div>
      )}
    </div>
  );
}
