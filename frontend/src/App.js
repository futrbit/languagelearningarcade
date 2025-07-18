import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

import Login from "./components/Login";
import Landing from "./components/Landing";
import ClassGenerator from "./components/ClassGenerator";
import Homework from "./components/Homework";
import Lessons from "./components/Lessons";
import Progress from "./components/Progress";
import SchoolMap from "./components/SchoolMap";
import SetupPage from "./components/SetupPage";
import About from "./components/About";

import WordChainGame from "./components/WordChainGame";
import WordChainGameExpanded from "./components/WordChainGameExpanded";
import QuizGame from "./components/QuizGame";
import GuessTheWord from "./components/GuessTheWord";
import MemoryMatch from "./components/MemoryMatch";
import FastGrammarRace from "./components/FastGrammarRace";
import DialogueFillIn from "./components/DialogueFillIn";
import MillionaireGame from "./components/MillionaireGame";
import BlanketyBlank from "./components/BlanketyBlank";
import Blockbusters from "./components/Blockbusters";
import BlindDate from "./components/BlindDate";
import CreativeWritingGame from "./components/CreativeWritingGame";
import VocabularyCards from "./components/VocabularyCards";
import WordSearch from "./components/WordSearch";
import Crossword from "./components/Crossword";
import "./styles.css";

function MainApp({ user, setUser }) {
  const navigate = useNavigate();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [mode, setMode] = useState("arcade");

  const [course, setCourse] = useState(() => {
    try {
      const storedCourse = localStorage.getItem(`course_${user}`);
      if (storedCourse && storedCourse !== "undefined") {
        return JSON.parse(storedCourse);
      }
      return {};
    } catch (err) {
      console.error("Error parsing course data:", err);
      return {};
    }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const storedCourse = localStorage.getItem(`course_${user}`);
        if (storedCourse && storedCourse !== "undefined") {
          setCourse(JSON.parse(storedCourse));
        } else {
          setCourse({});
        }
      } catch (err) {
        console.error("Error updating course data:", err);
        setCourse({});
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user]);

  const vocab = ["cat", "tiger", "rabbit", "tarantula", "ant", "tortoise", "elephant", "tapir"];
  const wordChainExpandedWords = ["apple", "elephant", "tiger", "rocket", "table"];
  const quizQuestions = [
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
  ];

  const isBusiness = course.reason?.toLowerCase().includes("business");
  const isTravel = course.reason?.toLowerCase().includes("travel");
  const moduleReason = isBusiness ? "business" : isTravel ? "travel" : "personal";
  const speakingCompleted = course.skills?.find(s => s.skill === "Speaking")?.lessons?.filter(l => l.module_lesson && l.completed).length || 0;

  const canAccessRoom = (room) => {
    if (!course.skills) return false;
    if (mode !== "course") return true;
    if (room === "classroom1") return true;
    if (speakingCompleted < 5) return false;
    if (room === "arcade" && course.skills?.find(s => s.skill === "Vocabulary")?.completed >= 2) return true;
    if (room === "library" && course.skills?.find(s => s.skill === "Grammar")?.completed >= 2) return true;
    return course.skills.every(skill => (skill.completed || 0) >= (skill.required || 0));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      localStorage.clear();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  const renderContent = () => {
    if (!user) return <p className="error">Please log in to access the app.</p>;

    if (mode === "course" && selectedRoom && !canAccessRoom(selectedRoom)) {
      const incompleteSkill = course.skills?.find(s => (s.completed || 0) < (s.required || 0));
      return (
        <p className="error">
          🔒 Room locked.{" "}
          {speakingCompleted < 5
            ? `Complete ${5 - speakingCompleted} more ${moduleReason} Speaking lessons.`
            : selectedRoom === "arcade"
            ? "Complete 2 Vocabulary lessons to unlock the Game Room."
            : selectedRoom === "library"
            ? "Complete 2 Grammar lessons to unlock the Library."
            : `Complete ${(incompleteSkill?.required || 0) - (incompleteSkill?.completed || 0)} more in ${incompleteSkill?.skill}.`}
        </p>
      );
    }

    switch (selectedRoom) {
      case "classroom1":
        return <ClassGenerator course={course} />;
      case "arcade":
        return (
          <div className="game-container">
            <WordChainGame words={vocab} />
            <WordChainGameExpanded words={wordChainExpandedWords} />
            <QuizGame questions={quizQuestions} />
            <GuessTheWord />
            <MemoryMatch />
            <FastGrammarRace />
            <DialogueFillIn />
            <MillionaireGame />
            <BlanketyBlank />
            <Blockbusters />
            <BlindDate />
            <CreativeWritingGame />
            <VocabularyCards />
            <WordSearch />
            <Crossword />
          </div>
        );
      case "library":
        return <QuizGame questions={quizQuestions} />;
      case "media":
        return (
          <div className="section-border">
            <h3>Media Room</h3>
            <p>Video & Song lessons coming soon!</p>
          </div>
        );
      default:
        return (
          <div className="section-border">
            <h2>Welcome to the Language Learning Arcade!</h2>
            <p>Click a room to start your quest.</p>
          </div>
        );
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src="/logo.png" className="App-logo" alt="logo" />
        <h1>My School App</h1>
        <nav>
          <button onClick={() => setMode("arcade")} className={mode === "arcade" ? "active" : ""}>
            🎮 Arcade
          </button>
          <button onClick={() => setMode("course")} className={mode === "course" ? "active" : ""}>
            📘 Course
          </button>
          <button onClick={() => navigate("/homework")}>📚 Homework</button>
          <button onClick={() => navigate("/lessons")}>📘 Lessons</button>
          <button onClick={() => navigate("/progress")}>📊 Progress</button>
          <button onClick={handleLogout}>Log Out</button>
        </nav>
      </header>
      <div className="app-container">
        <div className="sidebar">
          <h3>Navigation</h3>
          <ul>
            <li><button onClick={() => navigate("/homework")} className="App-link">Homework</button></li>
            <li><button onClick={() => navigate("/lessons")} className="App-link">Lessons</button></li>
            <li><button onClick={() => navigate("/progress")} className="App-link">Progress</button></li>
            <li><button onClick={handleLogout} className="App-link">Log Out</button></li>
          </ul>
          <div className="user-info">
            <p>Logged in as: <strong>{user}</strong></p>
            <p>Mode: <strong>{mode}</strong></p>
          </div>
        </div>
        <div className="main-content">
          <div className="section-border">
            <SchoolMap onSelectRoom={setSelectedRoom} />
            {renderContent()}
          </div>
        </div>
      </div>
      <footer className="footer">
        <p>© 2025 Language Learning Arcade. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(localStorage.getItem("currentUser") || null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userId = firebaseUser.uid;
        setUser(userId);
        localStorage.setItem("currentUser", userId);

        try {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setNeedsSetup(!userData?.setupComplete);
            const users = JSON.parse(localStorage.getItem("users") || "{}");
            users[userId] = {
              studentLevel: userData.studentLevel || "A1",
              age: userData.age || 18,
              why: userData.why || "personal growth",
              displayName: userData.displayName || "User",
            };
            localStorage.setItem("users", JSON.stringify(users));
          } else {
            setNeedsSetup(true);
          }
        } catch (error) {
          console.error("Error checking user profile:", error);
          setError("Failed to load user profile.");
        }
      } else {
        setUser(null);
        setNeedsSetup(false);
        localStorage.clear();
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) return <div className="section-border">Loading...</div>;
  if (error) return <div className="section-border error">Error: {error}</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login onLogin={setUser} />} />
        <Route
          path="/app"
          element={
            user ? (
              needsSetup ? <Navigate to="/setup" /> : <MainApp user={user} setUser={setUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/setup"
          element={
            user ? (
              <SetupPage
                onSave={async (formData) => {
                  try {
                    const userId = auth.currentUser?.uid;
                    if (!userId) throw new Error("No user");

                    const missing = [];
                    if (!formData.studentLevel) missing.push("Student Level");
                    if (!formData.age || isNaN(formData.age)) missing.push("Age");
                    if (!formData.reason) missing.push("Reason");

                    if (missing.length > 0) {
                      throw new Error(`Missing or invalid fields: ${missing.join(", ")}`);
                    }

                    const userProfileRef = doc(db, "users", userId);
                    await setDoc(
                      userProfileRef,
                      {
                        studentLevel: formData.studentLevel,
                        age: parseInt(formData.age, 10),
                        why: formData.reason,
                        displayName: auth.currentUser?.displayName || "User",
                        setupComplete: true,
                      },
                      { merge: true }
                    );

                    const courseData = {
                      level: formData.studentLevel,
                      reason: formData.reason,
                      age: parseInt(formData.age, 10),
                      skills: ["Speaking", "Listening", "Grammar", "Vocabulary", "Reading", "Writing"].map(skill => ({
                        skill,
                        required: 4,
                        completed: 0,
                        lessons: [],
                      })),
                    };

                    localStorage.setItem(`course_${userId}`, JSON.stringify(courseData));
                    localStorage.setItem(`badges_${userId}`, JSON.stringify([]));

                    const users = JSON.parse(localStorage.getItem("users") || "{}");
                    users[userId] = {
                      studentLevel: formData.studentLevel,
                      age: parseInt(formData.age, 10),
                      why: formData.reason,
                      displayName: auth.currentUser?.displayName || "User",
                    };
                    localStorage.setItem("users", JSON.stringify(users));

                    setNeedsSetup(false);
                  } catch (error) {
                    console.error("Error saving setup data:", error.message);
                    alert(`Setup failed: ${error.message}`);
                  }
                }}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/homework" element={user ? <Homework /> : <Navigate to="/login" />} />
        <Route path="/lessons" element={user ? <Lessons /> : <Navigate to="/login" />} />
        <Route path="/progress" element={user ? <Progress /> : <Navigate to="/login" />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}
