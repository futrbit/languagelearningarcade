import React, { useState, useMemo } from "react";
import Markdown from "react-markdown"; // Fixed: Use 'Markdown' instead of 'ReactMarkdown'
import rehypeSanitize from "rehype-sanitize";
import "../styles.css";

const Notepad = ({
  onSave,
  onSubmitAnswer,
  dragItems,
  starting,
  keeping,
  dragFeedback,
  handleDragStart,
  handleDrop,
  handleDragOver,
  handleRemove,
  checkDragDropAnswers,
  resetDragDrop,
  vocabulary,
  exercises,
  skillFocus,
}) => {
  const [notes, setNotes] = useState("");
  const [exerciseAnswers, setExerciseAnswers] = useState({});

  const handleRecord = () => {
    // Placeholder for recording functionality
    alert("Recording feature not implemented yet.");
  };

  const handleSubmit = () => {
    if (!notes.trim()) {
      alert("Please enter some notes before submitting.");
      return;
    }
    onSubmitAnswer(notes);
  };

  const handleSave = () => {
    const notesObj = {
      notes,
      date: new Date().toLocaleString(),
      exercises: exerciseAnswers,
    };
    onSave(notesObj);
    setNotes("");
    setExerciseAnswers({});
  };

  const handleExerciseChange = (index, value) => {
    setExerciseAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const renderDragDrop = () => (
    <div className="drag-drop-container">
      <h3>Drag & Drop Activity</h3>
      <div className="drag-items">
        {dragItems.map((item, index) => (
          <div
            key={index}
            draggable
            onDragStart={(e) => handleDragStart(e, item, "dragItems")}
            className="drag-item"
          >
            {item}
          </div>
        ))}
      </div>
      <div className="drop-zones">
        <div
          className="drop-zone"
          onDrop={(e) => handleDrop(e, "starting")}
          onDragOver={handleDragOver}
        >
          <h4>Starting</h4>
          {starting.map((item, index) => (
            <div
              key={index}
              className="drag-item"
              onClick={() => handleRemove(item, "starting")}
            >
              {item}
            </div>
          ))}
        </div>
        <div
          className="drop-zone"
          onDrop={(e) => handleDrop(e, "keeping")}
          onDragOver={handleDragOver}
        >
          <h4>Keeping</h4>
          {keeping.map((item, index) => (
            <div
              key={index}
              className="drag-item"
              onClick={() => handleRemove(item, "keeping")}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
      <button onClick={checkDragDropAnswers} className="button-primary">
        Check Answers
      </button>
      <button onClick={resetDragDrop} className="button-primary" style={{ marginLeft: 10 }}>
        Reset
      </button>
      {dragFeedback && <p className="drag-feedback">{dragFeedback}</p>}
    </div>
  );

  const renderExercises = useMemo(() => {
    if (!exercises.length) return null;
    return (
      <div className="exercises-container">
        <h3>Exercises</h3>
        {exercises.map((exercise, index) => (
          <div key={index} className="exercise-item">
            <Markdown rehypePlugins={[rehypeSanitize]}>{exercise}</Markdown>
            <textarea
              value={exerciseAnswers[index] || ""}
              onChange={(e) => handleExerciseChange(index, e.target.value)}
              placeholder="Enter your answer..."
              className="exercise-textarea"
            />
          </div>
        ))}
      </div>
    );
  }, [exercises, exerciseAnswers, handleRecord]); // Fixed: Added handleRecord to dependency array

  return (
    <div className="notepad-container section-border">
      <h3>Notepad 📝</h3>
      {dragItems.length > 0 && renderDragDrop()}
      {vocabulary.length > 0 && (
        <div className="vocabulary-container">
          <h3>Vocabulary</h3>
          <table className="markdown-table">
            <thead>
              <tr>
                <th>Word</th>
                <th>Meaning</th>
                <th>Example</th>
              </tr>
            </thead>
            <tbody>
              {vocabulary.map((item, index) => (
                <tr key={index}>
                  <td>{item.word}</td>
                  <td>{item.meaning}</td>
                  <td>{item.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {renderExercises}
      {skillFocus === "Speaking" && (
        <button onClick={handleRecord} className="button-primary" style={{ marginTop: 10 }}>
          Record Response 🎙️
        </button>
      )}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Write your notes here..."
        className="notepad-textarea"
      />
      <div style={{ marginTop: 10 }}>
        <button onClick={handleSubmit} className="button-primary">
          Submit Answer
        </button>
        <button onClick={handleSave} className="button-primary" style={{ marginLeft: 10 }}>
          Save to Homework
        </button>
      </div>
    </div>
  );
};

export default Notepad;