import React, { useState, useEffect } from "react";

/** GuessTheWord Component */
export default function GuessTheWord({ wordList = defaultWords }) {
  const [wordObj, setWordObj] = useState({});
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState([]);
  const [gameOver, setGameOver] = useState(false);

  // Choose a word on load
  useEffect(() => {
    const random = wordList[Math.floor(Math.random() * wordList.length)];
    setWordObj(random);
    setGuessedLetters([]);
    setWrongGuesses([]);
    setGameOver(false);
  }, [wordList]);

  const displayWord = wordObj.word?.split("").map(letter =>
    guessedLetters.includes(letter.toLowerCase()) ? letter : "_"
  ).join(" ");

  const handleGuess = (letter) => {
    if (guessedLetters.includes(letter) || wrongGuesses.includes(letter) || gameOver) return;

    if (wordObj.word.toLowerCase().includes(letter)) {
      setGuessedLetters([...guessedLetters, letter]);
    } else {
      const updatedWrong = [...wrongGuesses, letter];
      setWrongGuesses(updatedWrong);
      if (updatedWrong.length >= 6) {
        setGameOver(true);
      }
    }

    // Check if won
    const allLettersGuessed = wordObj.word.toLowerCase().split("").every(char => guessedLetters.includes(char) || char === letter);
    if (allLettersGuessed) setGameOver(true);
  };

  const resetGame = () => {
    const random = wordList[Math.floor(Math.random() * wordList.length)];
    setWordObj(random);
    setGuessedLetters([]);
    setWrongGuesses([]);
    setGameOver(false);
  };

  return (
    <div style={{
      maxWidth: "500px",
      margin: "0 auto",
      padding: "20px",
      border: "2px solid #673ab7",
      borderRadius: "10px"
    }}>
      <h3>❓ Guess the Word</h3>
      <p><strong>Hint:</strong> {wordObj.hint}</p>

      <h2 style={{ letterSpacing: "10px", fontSize: "32px" }}>{displayWord}</h2>

      <div style={{ marginTop: "10px" }}>
        {"abcdefghijklmnopqrstuvwxyz".split("").map(l => (
          <button
            key={l}
            onClick={() => handleGuess(l)}
            disabled={guessedLetters.includes(l) || wrongGuesses.includes(l) || gameOver}
            style={{
              margin: "4px",
              padding: "6px 10px",
              border: "1px solid #333",
              borderRadius: "4px",
              backgroundColor: guessedLetters.includes(l)
                ? "#a5d6a7"
                : wrongGuesses.includes(l)
                ? "#ef9a9a"
                : "#fff"
            }}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <p style={{ marginTop: "10px" }}>❌ Wrong guesses: {wrongGuesses.join(", ")}</p>

      {gameOver && (
        <div style={{ marginTop: "10px", fontWeight: "bold" }}>
          {displayWord.includes("_")
            ? `Game over! The word was: ${wordObj.word}`
            : "🎉 You guessed it!"}
          <br />
          <button onClick={resetGame} style={{ marginTop: "10px", padding: "8px 12px" }}>Play Again</button>
        </div>
      )}
    </div>
  );
}

const defaultWords = [
  { word: "banana", hint: "A yellow fruit monkeys like." },
  { word: "library", hint: "Place where you borrow books." },
  { word: "elephant", hint: "A giant animal with a trunk." },
  { word: "computer", hint: "A machine for coding or gaming." },
  { word: "teacher", hint: "Someone who helps you learn." },
];
