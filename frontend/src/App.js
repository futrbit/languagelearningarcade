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
import Landing from "./pages/Landing";
import ClassGenerator from "./components/ClassGenerator";
import Homework from "./components/Homework";
import Lessons from "./components/Lessons";
import Progress from "./components/Progress";
import SchoolMap from "./components/SchoolMap";
import WordChainGame from "./components/WordChainGame";
import QuizGame from "./components/QuizGame";
import GuessTheWord from "./components/GuessTheWord";
import MemoryMatch from "./components/MemoryMatch";
import FastGrammarRace from "./components/FastGrammarRace";
import DialogueFillIn from "./components/DialogueFillIn";
import GamesRoom from "./components/GamesRoom";
import SetupPage from "./components/SetupPage";
import About from "./components/About";

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
          const courseData = JSON.parse(storedCourse);
          setCourse(courseData && Array.isArray(courseData.skills) ? courseData : {});
        } else {
          setCourse({});
        }
      } catch (err) {
        console.error("Error syncing course from storage:", err);
        setCourse({});
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user]);

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
      console.error("Logout failed:", error);
      alert("Logout failed. Please try again.");
    }
  };

  const renderContent = () => {
    if (!user) return <p>Please log in to access the app.</p>;

    if (mode === "course" && selectedRoom && !canAccessRoom(selectedRoom)) {
      const incompleteSkill = course.skills?.find(s => (s.completed || 0) < (s.required || 0));
      return (
        <p style={{ fontSize: "18px" }}>
          🔒 This room is locked in Course Mode.{" "}
          {speakingCompleted < 5
            ? `Complete ${5 - speakingCompleted} more Speaking lessons.`
            : selectedRoom === "arcade"
            ? "Complete 2 Vocabulary lessons to unlock the Game Room."
            : selectedRoom === "library"
            ? "Complete 2 Grammar lessons to unlock the Library."
            : `Complete ${(incompleteSkill?.required || 0) - (incompleteSkill?.completed || 0)} lesson(s) in ${incompleteSkill?.skill || "any skill"}.`}
        </p>
      );
    }

    switch (selectedRoom) {
      case "classroom1":
        return <ClassGenerator course={course} />;
      case "arcade":
        return <GamesRoom />;
      case "library":
        return (
          <div style={{ padding: "20px" }}>
            <h3>Library 📚</h3>
            <p>Coming soon: Reading and writing activities.</p>
          </div>
        );
      case "media":
        return (
          <div style={{ padding: "20px" }}>
            <h3>Media Room 🎧</h3>
            <p>Watch, listen, and learn! Coming soon.</p>
          </div>
        );
      default:
        return (
          <div style={{ padding: "20px", fontSize: "18px" }}>
            <h2>Welcome to the Language Learning Arcade!</h2>
            <p>Select a room to start your journey.</p>
            {mode === "course" && (
              <p>In Course Mode, you must complete speaking lessons to unlock new areas.</p>
            )}
            {course.reason && (
              <p>
                Your goal: <strong>{course.reason}</strong>
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <div>Logged in as: <strong>{user}</strong></div>
        <div>
          <button onClick={() => navigate("/homework")}>📚 Homework</button>
          <button onClick={() => navigate("/lessons")}>📘 Lessons</button>
          <button onClick={() => navigate("/progress")}>📊 Progress</button>
          <button onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <strong>🧭 Mode:</strong>
        <button onClick={() => setMode("arcade")}>🎮 Arcade</button>
        <button onClick={() => setMode("course")}>📘 Course</button>
      </div>

      <div style={{ display: "flex", gap: "30px" }}>
        <SchoolMap onSelectRoom={setSelectedRoom} />
        <div style={{ flexGrow: 1 }}>{renderContent()}</div>
      </div>
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
              why: userData.why || "personal",
              displayName: userData.displayName || "User",
            };
            localStorage.setItem("users", JSON.stringify(users));
          } else {
            setNeedsSetup(true);
          }
        } catch (error) {
          console.error("Error checking profile:", error);
          setError("Failed to load user profile.");
          setNeedsSetup(true);
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

  if (authLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

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
                    if (!userId) throw new Error("No user found");

                    if (!formData.studentLevel || !formData.age || !formData.reason) {
                      throw new Error("All fields are required.");
                    }

                    await setDoc(
                      doc(db, "users", userId),
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
                    setNeedsSetup(false);
                  } catch (error) {
                    console.error("Setup save error:", error.message);
                    alert("Error saving setup: " + error.message);
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
        <Route path="/games" element={user ? <GamesRoom /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
