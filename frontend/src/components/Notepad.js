import React, { useState, useMemo } from "react";
import Markdown from "react-markdown";
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
  savedLessons,
  savedHomework,
  classPlan,
}) => {
  const [notes, setNotes] = useState("");
  const [exerciseAnswers, setExerciseAnswers] = useState({});
  const [flippedCards, setFlippedCards] = useState({});
  const [audioPlayed, setAudioPlayed] = useState(false);

  console.log("Notepad props:", { skillFocus, vocabulary }); // Debug log

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
      flippedCards: Object.keys(flippedCards).length === vocabulary.length ? true : false,
      audioPlayed,
    };
    console.log("Saving notes:", notesObj);
    onSave(notesObj);
    setNotes("");
    setExerciseAnswers({});
    setFlippedCards({});
    setAudioPlayed(false);
  };

  const handleExerciseChange = (index, value) => {
    setExerciseAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const handleCardFlip = (index) => {
    setFlippedCards((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
    if (Object.keys(flippedCards).length + 1 === vocabulary.length) {
      console.log("All vocabulary cards flipped!");
      onSubmitAnswer({ action: "flashcards_completed", skillFocus });
    }
  };

  const handlePlayPrompt = () => {
    if (!exercises.length && !classPlan) {
      alert("No sentence available for playback.");
      return;
    }
    const sentenceMatch = exercises[0]?.match(/^(.*?[.!?])\s/) || classPlan?.match(/^(.*?[.!?])\s/);
    const sentence = sentenceMatch ? sentenceMatch[1] : "Please practice speaking this sentence.";
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
    setAudioPlayed(true);
    console.log("Played audio prompt:", sentence);
    onSubmitAnswer({ action: "audio_played", skillFocus });
  };

  const renderDragDrop = () => (
    <div className="drag-drop-container">
      <h3>Drag & Drop Activity</h3>
      {dragItems.length === 0 ? (
        <p className="error-text">No drag-and-drop items available. Try generating a new lesson.</p>
      ) : (
        <>
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
          <div style={{ marginTop: 15 }}>
            <button onClick={checkDragDropAnswers} className="button-primary">
              Check Answers
            </button>
            <button onClick={resetDragDrop} className="button-primary" style={{ marginLeft: 10 }}>
              Reset
            </button>
          </div>
          {dragFeedback && (
            <p className={`drag-feedback ${dragFeedback.includes("correct") ? "success" : "error"}`}>
              {dragFeedback}
            </p>
          )}
        </>
      )}
    </div>
  );

  const renderFlashcards = () => (
    <div className="flashcards-container">
      <h3>Vocabulary Flashcards</h3>
      {vocabulary.length === 0 ? (
        <p className="error-text">No vocabulary items available. Try generating a new lesson.</p>
      ) : (
        <div className="flashcards">
          {vocabulary.map((item, index) => (
            <div
              key={index}
              className={`flashcard ${flippedCards[index] ? "flipped" : ""}`}
              onClick={() => handleCardFlip(index)}
            >
              <div className="flashcard-inner">
                <div className="flashcard-front">
                  <p>{item.word}</p>
                </div>
                <div className="flashcard-back">
                  <p><strong>Meaning:</strong> {item.meaning}</p>
                  <p><strong>Example:</strong> {item.example}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
  }, [exercises, exerciseAnswers]);

  return (
    <div className="notepad-container section-border">
      <h3>Notepad 📝</h3>
      {(savedLessons?.length > 0 || savedHomework?.length > 0) ? (
        <div className="saved-notes-container">
          <h4>Saved Lessons</h4>
          {savedLessons.length === 0 ? (
            <p>No saved lessons found.</p>
          ) : (
            savedLessons
              .slice()
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .map((lesson, index) => (
                <div key={index} className="saved-note">
                  <p><strong>Date:</strong> {lesson.timestamp}</p>
                  <p><strong>Level:</strong> {lesson.studentLevel}</p>
                  <p><strong>Skill:</strong> {lesson.skillFocus}</p>
                  <p><strong>Class Plan:</strong> {lesson.classPlan.substring(0, 100)}...</p>
                  {lesson.feedback && <p><strong>Feedback:</strong> {lesson.feedback.substring(0, 100)}...</p>}
                </div>
              ))
          )}
          <h4>Saved Homework</h4>
          {savedHomework.length === 0 ? (
            <p>No saved homework found.</p>
          ) : (
            savedHomework
              .slice()
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .map((item, index) => (
                <div key={index} className="saved-note">
                  <p><strong>Date:</strong> {item.timestamp}</p>
                  <p><strong>Level:</strong> {item.studentLevel}</p>
                  <p><strong>Skill:</strong> {item.skillFocus}</p>
                  <p><strong>Notes:</strong> {item.notes.substring(0, 100)}...</p>
                  {item.exercises && Object.keys(item.exercises).length > 0 && (
                    <p><strong>Exercises:</strong> {JSON.stringify(item.exercises, null, 2).substring(0, 100)}...</p>
                  )}
                </div>
              ))
          )}
        </div>
      ) : (
        <p className="error-text">No saved lessons or homework found. Try generating or saving a lesson.</p>
      )}
      {vocabulary.length > 0 && renderFlashcards()} {/* Show flashcards if vocabulary exists */}
      {vocabulary.length > 0 && skillFocus !== "Vocabulary" && (
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
      {renderDragDrop()}
      {renderExercises}
      {skillFocus === "Speaking" && (
        <div style={{ marginTop: 10 }}>
          <button onClick={handlePlayPrompt} className="button-primary">
            Play Prompt 🎙️
          </button>
          {audioPlayed && (
            <button onClick={handlePlayPrompt} className="button-primary" style={{ marginLeft: 10 }}>
              Play Again
            </button>
          )}
        </div>
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
