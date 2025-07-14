import React, { useState } from "react";

export default function DialogueFillIn({ dialogues = defaultDialogues }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [completed, setCompleted] = useState(false);

  const currentDialogue = dialogues[currentIndex];

  // Handle selection for a blank
  const handleSelect = (blankIndex, option) => {
    setSelectedOptions(prev => ({ ...prev, [blankIndex]: option }));
  };

  // Check answers and give feedback
  const checkAnswers = () => {
    let correctCount = 0;
    currentDialogue.answers.forEach((ans, idx) => {
      if (selectedOptions[idx] === ans) correctCount++;
    });

    setScore(score + correctCount);
    setFeedback(`You got ${correctCount} out of ${currentDialogue.answers.length} correct!`);
    setCompleted(true);
  };

  const nextDialogue = () => {
    setCurrentIndex(currentIndex + 1);
    setSelectedOptions({});
    setFeedback("");
    setCompleted(false);
  };

  const restart = () => {
    setCurrentIndex(0);
    setSelectedOptions({});
    setFeedback("");
    setCompleted(false);
    setScore(0);
  };

  if (currentIndex >= dialogues.length) {
    return (
      <div style={styles.container}>
        <h3>🎉 Dialogue Fill-In Complete!</h3>
        <p>Your total score: {score}</p>
        <button onClick={restart}>Play Again</button>
      </div>
    );
  }

  // Render dialogue text with blanks replaced by select dropdowns
  const renderDialogue = () => {
    const parts = currentDialogue.text.split(/\[____\]/);

    return parts.map((part, idx) => {
      if (idx === parts.length - 1) {
        return <span key={idx}>{part}</span>;
      }
      return (
        <span key={idx}>
          {part}
          <select
            disabled={completed}
            value={selectedOptions[idx] || ""}
            onChange={(e) => handleSelect(idx, e.target.value)}
            style={styles.select}
          >
            <option value="">--Select--</option>
            {currentDialogue.options[idx].map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        </span>
      );
    });
  };

  return (
    <div style={styles.container}>
      <h3>💬 Dialogue Fill-In</h3>
      <p style={styles.dialogue}>{renderDialogue()}</p>

      {!completed ? (
        <button onClick={checkAnswers} disabled={Object.keys(selectedOptions).length !== currentDialogue.answers.length} style={styles.btn}>
          Check Answers
        </button>
      ) : (
        <>
          <p style={{ marginTop: 10 }}>{feedback}</p>
          <button onClick={nextDialogue} style={styles.btn}>Next Dialogue</button>
        </>
      )}
      <p style={{ marginTop: 10 }}>Score: {score}</p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    padding: "20px",
    border: "2px solid #4caf50",
    borderRadius: "10px",
    fontSize: "16px",
  },
  dialogue: {
    marginBottom: "20px",
    lineHeight: "1.6",
  },
  select: {
    margin: "0 8px",
    padding: "5px",
    fontSize: "16px",
  },
  btn: {
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer",
  },
};

const defaultDialogues = [
  {
    text: "A: Hello! How are you [____]? B: I'm fine, thank you. And you?",
    options: [["today", "tomorrow", "yesterday"]],
    answers: ["today"],
  },
  {
    text: "A: What do you want to [____] tonight? B: Let's watch a movie.",
    options: [["eat", "do", "go"]],
    answers: ["do"],
  },
  {
    text: "A: Did you [____] the homework? B: Yes, I did it yesterday.",
    options: [["do", "did", "done"]],
    answers: ["do"],
  },
];
