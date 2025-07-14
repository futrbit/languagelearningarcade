import React, { useState, useEffect } from "react";

export default function MemoryMatch({ words = defaultWords }) {
  // Create pairs and shuffle cards
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]); // indexes of currently flipped cards
  const [matched, setMatched] = useState([]); // indexes of matched cards
  const [moves, setMoves] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const doubled = [...words, ...words];
    const shuffled = doubled
      .map(value => ({ value, id: Math.random() }))
      .sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setDisabled(false);
    setGameOver(false);
  }, [words]);

  useEffect(() => {
    if (matched.length === cards.length && cards.length > 0) {
      setGameOver(true);
    }
  }, [matched, cards]);

  const handleFlip = (index) => {
    if (disabled || flipped.includes(index) || matched.includes(index)) return;

    if (flipped.length === 1) {
      setFlipped([flipped[0], index]);
      setDisabled(true);
      setMoves(moves + 1);

      if (cards[flipped[0]].value === cards[index].value) {
        setMatched([...matched, flipped[0], index]);
        setTimeout(() => {
          setFlipped([]);
          setDisabled(false);
        }, 1000);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setDisabled(false);
        }, 1200);
      }
    } else {
      setFlipped([index]);
    }
  };

  const restartGame = () => {
    const doubled = [...words, ...words];
    const shuffled = doubled
      .map(value => ({ value, id: Math.random() }))
      .sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setDisabled(false);
    setGameOver(false);
  };

  return (
    <div style={styles.container}>
      <h3>🧠 Memory Match</h3>
      <p>Match all the pairs!</p>
      <div style={styles.grid}>
        {cards.map((card, idx) => {
          const isFlipped = flipped.includes(idx) || matched.includes(idx);
          return (
            <div
              key={card.id}
              onClick={() => handleFlip(idx)}
              style={{
                ...styles.card,
                backgroundColor: isFlipped ? "#4caf50" : "#ccc",
                cursor: matched.includes(idx) ? "default" : "pointer",
              }}
            >
              {isFlipped ? card.value : ""}
            </div>
          );
        })}
      </div>
      <p>Moves: {moves}</p>
      {gameOver && <p>🎉 Congratulations! You matched all pairs.</p>}
      <button onClick={restartGame} style={styles.button}>Restart Game</button>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    padding: "20px",
    border: "2px solid #ff9800",
    borderRadius: "10px",
    fontSize: "16px",
    userSelect: "none",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "10px",
    marginTop: "20px",
    marginBottom: "20px",
  },
  card: {
    height: "60px",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
    fontSize: "18px",
    color: "white",
    userSelect: "none",
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer",
  },
};

const defaultWords = ["cat", "dog", "rabbit", "tiger", "elephant", "lion", "bear", "fox"];
