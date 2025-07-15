import React from "react";
import WordChainGame from "./WordChainGame";
import QuizGame from "./QuizGame";
import GuessTheWord from "./GuessTheWord";
import MemoryMatch from "./MemoryMatch";
import FastGrammarRace from "./FastGrammarRace";
import DialogueFillIn from "./DialogueFillIn";
import WordSearchGame from "./WordSearchGame";
import CrosswordGame from "./CrosswordGame";
import MillionaireGame from "./MillionaireGame";
import BlanketyBlank from "./BlanketyBlank";
import Blockbusters from "./Blockbusters";
import BlindDate from "./BlindDate";
import WordChainGameExpanded from "./WordChainGameExpanded";
import CreativeWriting from "./CreativeWriting";
import VocabularyCards from "./VocabularyCards";

const GamesRoom = () => {
  return (
    <div className="section-border" style={{ padding: "20px" }}>
      <h2>🎮 Game Room</h2>
      <p>Test your English skills with these fun games!</p>

      <div className="games-grid">
        <div className="game-card">
          <h3>Word Chain</h3>
          <WordChainGame words={["cat", "tiger", "rabbit", "tarantula", "ant", "tortoise", "elephant", "tapir"]} />
        </div>
        <div className="game-card">
          <h3>Quiz Game</h3>
          <QuizGame
            questions={[
              {
                question: "What is the capital of England?",
                options: ["London", "Paris", "New York", "Berlin"],
                correctAnswer: "London",
              },
              {
                question: "Choose the correct past tense: I ___ to the store yesterday.",
                options: ["go", "went", "gone", "going"],
                correctAnswer: "went",
              },
            ]}
          />
        </div>
        <div className="game-card">
          <h3>Guess The Word</h3>
          <GuessTheWord />
        </div>
        <div className="game-card">
          <h3>Memory Match</h3>
          <MemoryMatch />
        </div>
        <div className="game-card">
          <h3>Fast Grammar Race</h3>
          <FastGrammarRace />
        </div>
        <div className="game-card">
          <h3>Dialogue Fill-In</h3>
          <DialogueFillIn />
        </div>
        <div className="game-card">
          <h3>Word Search</h3>
          <WordSearchGame />
        </div>
        <div className="game-card">
          <h3>Crossword</h3>
          <CrosswordGame />
        </div>
        <div className="game-card">
          <h3>Millionaire</h3>
          <MillionaireGame />
        </div>
        <div className="game-card">
          <h3>Blankety Blank</h3>
          <BlanketyBlank />
        </div>
        <div className="game-card">
          <h3>Blockbusters</h3>
          <Blockbusters />
        </div>
        <div className="game-card">
          <h3>Blind Date</h3>
          <BlindDate />
        </div>
        <div className="game-card">
          <h3>Word Chain Expanded</h3>
          <WordChainGameExpanded />
        </div>
        <div className="game-card">
          <h3>Creative Writing</h3>
          <CreativeWriting />
        </div>
        <div className="game-card">
          <h3>Vocabulary Cards</h3>
          <VocabularyCards />
        </div>
      </div>
    </div>
  );
};

export default GamesRoom;
