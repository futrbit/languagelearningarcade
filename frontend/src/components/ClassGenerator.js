import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Markdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import Notepad from "./Notepad";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import "../styles.css";

const API_URL = "https://llabackend.onrender.com";

const ClassGenerator = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(localStorage.getItem("currentUser") || null);
  const [userData, setUserData] = useState({});
  const [classPlan, setClassPlan] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedLessons, setSavedLessons] = useState([]);
  const [savedHomework, setSavedHomework] = useState([]);
  const [remainingCalls, setRemainingCalls] = useState(parseInt(localStorage.getItem(`remainingCalls_${currentUser}`) || "5", 10));
  const [studentLevel, setStudentLevel] = useState("");
  const [skillFocus, setSkillFocus] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [dragItems, setDragItems] = useState([]);
  const [starting, setStarting] = useState([]);
  const [keeping, setKeeping] = useState([]);
  const [dragFeedback, setDragFeedback] = useState("");
  const [vocabulary, setVocabulary] = useState([]);
  const [exercises, setExercises] = useState([]);
  const validSkills = ["Speaking", "Grammar", "Vocabulary", "Writing", "Reading"];

  const checkStorageQuota = () => {
    const lessons = JSON.parse(localStorage.getItem(`lessons_${currentUser}`) || "[]");
    const homework = JSON.parse(localStorage.getItem(`homework_${currentUser}`) || "[]");
    const totalSize = JSON.stringify(lessons).length + JSON.stringify(homework).length;
    return totalSize < 5 * 1024 * 1024; // 5MB limit
  };

  const initializeCourse = () => {
    let course = JSON.parse(localStorage.getItem(`course_${currentUser}`) || "{}");
    if (!course.skills || !Array.isArray(course.skills)) {
      course = {
        level: studentLevel || "A1",
        reason: selectedReason || "personal growth",
        age: parseInt(JSON.parse(localStorage.getItem("users") || "{}")[currentUser]?.age, 10) || 18,
        skills: validSkills.map((skill) => ({
          skill,
          completed: 0,
          required: 10,
          lessons: [],
        })),
      };
      localStorage.setItem(`course_${currentUser}`, JSON.stringify(course));
    }
    return course;
  };

  const updateSkillProgressInFirestore = async (userId, course) => {
    try {
      await setDoc(doc(db, "users", userId), { course }, { merge: true });
      console.log("Updated Firestore course for", userId, ":", course);
    } catch (error) {
      console.error("Error updating Firestore course:", error);
    }
  };

  const syncLessonsToFirestore = async (userId, lessons, homework) => {
    try {
      await setDoc(doc(db, "users", userId), { lessons, homework }, { merge: true });
      console.log("Synced lessons and homework to Firestore for", userId);
    } catch (error) {
      console.error("Error syncing to Firestore:", error);
    }
  };

  const getNextModuleLesson = (skill, reason, lessons) => {
    const completedModules = lessons
      .filter((l) => l.skillFocus === skill && l.completed && l.module_lesson)
      .map((l) => l.module_lesson)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => a - b);
    let nextModule = 1;
    if (completedModules.length > 0) {
      nextModule = Math.max(...completedModules) + 1;
    }
    if (nextModule > 5) {
      nextModule = 1;
    }
    console.log("getNextModuleLesson:", nextModule);
    return nextModule;
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user.uid);
        localStorage.setItem("currentUser", user.uid);
        setUserData({ displayName: user.displayName || "User" });
        try {
          const storedLessons = JSON.parse(localStorage.getItem(`lessons_${user.uid}`) || "[]");
          const storedHomework = JSON.parse(localStorage.getItem(`homework_${user.uid}`) || "[]");
          console.log("Loaded lessons:", storedLessons);
          console.log("Loaded homework:", storedHomework);
          setSavedLessons(storedLessons);
          setSavedHomework(storedHomework);

          let attempt = 0;
          const maxRetries = 3;
          while (attempt < maxRetries) {
            try {
              const userDoc = await getDoc(doc(db, "users", user.uid));
              if (userDoc.exists()) {
                const data = userDoc.data();
                localStorage.setItem(`lessons_${user.uid}`, JSON.stringify(data.lessons || []));
                localStorage.setItem(`homework_${user.uid}`, JSON.stringify(data.homework || []));
                if (data.course) {
                  localStorage.setItem(`course_${user.uid}`, JSON.stringify(data.course));
                }
                setSavedLessons(data.lessons || []);
                setSavedHomework(data.homework || []);
                console.log("Loaded Firestore data:", data);
                break;
              } else {
                console.warn("No user document found in Firestore");
                break;
              }
            } catch (error) {
              attempt++;
              console.warn(`Firestore read attempt ${attempt} failed:`, error);
              if (attempt === maxRetries) {
                setError("Failed to load data from server. Using local data.");
                break;
              }
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        } catch (err) {
          console.error("Error loading data:", err);
          setError("Failed to load lessons or homework.");
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem("currentUser");
        setError("Please log in to generate lessons.");
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const generateClass = async () => {
    if (!auth.currentUser) {
      setError("Please log in to generate lessons.");
      return;
    }
    if (!checkStorageQuota()) {
      setError("Storage full.");
      return;
    }
    if (remainingCalls <= 0) {
      setError("You've reached your daily lesson limit (5). Try again tomorrow!");
      return;
    }

    setLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const users = JSON.parse(localStorage.getItem("users") || "{}");
      const userData = users[auth.currentUser.uid] || {};
      const level = userData.level || "A1";
      const reason = userData.reason || "personal growth";
      const age = parseInt(userData.age, 10) || 18;
      const skill = validSkills.includes(userData.skill) ? userData.skill : "Speaking";
      const lessons = JSON.parse(localStorage.getItem(`lessons_${currentUser}`) || "[]");
      const moduleLesson = skill === "Speaking" ? getNextModuleLesson(skill, reason, lessons) : undefined;

      const res = await axios.post(
        `${API_URL}/generate-class`,
        {
          student_level: level,
          skill_focus: skill,
          reason,
          age,
          module_lesson: moduleLesson,
        },
        {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          timeout: 30000,
        }
      );

      const newRemainingCalls = res.data.remaining_calls?.generate || 0;
      setRemainingCalls(newRemainingCalls);
      localStorage.setItem(`remainingCalls_${currentUser}`, newRemainingCalls.toString());
      localStorage.setItem(`lastCallDate_${currentUser}`, new Date().toDateString());
      console.log("Fetched remaining calls from server:", newRemainingCalls);

      setClassPlan(res.data.class_plan);
      setStudentLevel(level);
      setSkillFocus(skill);
      setSelectedReason(reason);

      const dragMatch = res.data.class_plan.match(/## Quick Check\n([\s\S]*?)(?=\n##|$)/);
      if (dragMatch) {
        const quickCheckText = dragMatch[1];
        const items = quickCheckText.match(/- \[\s*\] ([^\n]+)/g)?.map((item) => item.replace(/- \[\s*\] /, "")) || [];
        if (items.length === 0) {
          console.warn("Quick Check section found but no items parsed:", quickCheckText);
          setDragItems(["Placeholder 1", "Placeholder 2", "Placeholder 3", "Placeholder 4"]);
        } else {
          setDragItems(items);
        }
      } else {
        console.warn("No Quick Check section found in classPlan:", res.data.class_plan);
        setDragItems(["Placeholder 1", "Placeholder 2", "Placeholder 3", "Placeholder 4"]);
      }

      const vocabMatch = res.data.class_plan.match(/## Vocabulary\n([\s\S]*?)(?=\n##|$)/);
      const vocabItems = vocabMatch
        ? vocabMatch[1].match(/- ([^:]+): (.+?) \(([^)]+)\)/g)?.map((item) => {
            const [, word, meaning, example] = item.match(/- ([^:]+): (.+?) \(([^)]+)\)/);
            return { word, meaning, example };
          }) || []
        : [];
      setVocabulary(vocabItems);

      const exerciseMatch = res.data.class_plan.match(/## Exercises\n([\s\S]*?)(?=\n##|$)/);
      const exerciseItems = exerciseMatch
        ? exerciseMatch[1].match(/- ([^\n]+)/g)?.map((item) => item.replace(/- /, "")) || []
        : [];
      setExercises(exerciseItems);

      const newLesson = {
        classPlan: res.data.class_plan,
        studentLevel: level,
        skillFocus: skill,
        teacher: userData.teacher || "Unknown",
        reason,
        age,
        timestamp: new Date().toLocaleString(),
        completed: false,
        module_lesson: moduleLesson,
        feedback: "",
      };
      const updatedLessons = [...lessons, newLesson].slice(-50);
      localStorage.setItem(`lessons_${currentUser}`, JSON.stringify(updatedLessons));
      setSavedLessons(updatedLessons);
      console.log("Saved new lesson:", newLesson);

      await syncLessonsToFirestore(auth.currentUser.uid, updatedLessons, savedHomework);
    } catch (err) {
      console.error("Error generating class:", err);
      const cachedCalls = parseInt(localStorage.getItem(`remainingCalls_${currentUser}`) || "5", 10);
      setRemainingCalls(cachedCalls);
      setError(
        err.response?.status === 429
          ? "You've reached your daily lesson limit (5). Try again tomorrow!"
          : err.response?.status === 401
          ? "Please log in to generate lessons."
          : err.response?.status === 404
          ? "Class generation endpoint not found. Contact support."
          : err.response?.status === 0
          ? "CORS error: Backend not allowing requests. Contact support or check ad blockers."
          : err.code === "ECONNABORTED"
          ? "Request timed out. Using cached credits: " + cachedCalls
          : err.message.includes("Network Error")
          ? "Network error: Check your internet connection or ad blockers."
          : err.message || "Failed to generate lesson. Check ad blockers or network settings."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, item, source) => {
    e.dataTransfer.setData("item", item);
    e.dataTransfer.setData("source", source);
  };

  const handleDrop = (e, target) => {
    e.preventDefault();
    const item = e.dataTransfer.getData("item");
    const source = e.dataTransfer.getData("source");
    if (source === target) return;
    if (source === "dragItems") {
      setDragItems((prev) => prev.filter((i) => i !== item));
      if (target === "starting") {
        setStarting((prev) => [...prev, item]);
      } else if (target === "keeping") {
        setKeeping((prev) => [...prev, item]);
      }
    } else if (source === "starting" && target === "keeping") {
      setStarting((prev) => prev.filter((i) => i !== item));
      setKeeping((prev) => [...prev, item]);
    } else if (source === "keeping" && target === "starting") {
      setKeeping((prev) => prev.filter((i) => i !== item));
      setStarting((prev) => [...prev, item]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleRemove = (item, source) => {
    if (source === "starting") {
      setStarting((prev) => prev.filter((i) => i !== item));
      setDragItems((prev) => [...prev, item]);
    } else if (source === "keeping") {
      setKeeping((prev) => prev.filter((i) => i !== item));
      setDragItems((prev) => [...prev, item]);
    }
  };

  const checkDragDropAnswers = () => {
    const correctStarting = ["Placeholder 1", "Placeholder 2"];
    const correctKeeping = ["Placeholder 3", "Placeholder 4"];
    const isStartingCorrect = starting.length === correctStarting.length && starting.every((item) => correctStarting.includes(item));
    const isKeepingCorrect = keeping.length === correctKeeping.length && keeping.every((item) => correctKeeping.includes(item));
    if (isStartingCorrect && isKeepingCorrect) {
      setDragFeedback("All correct! 🎉");
    } else {
      setDragFeedback("Some answers are incorrect. Try again!");
    }
  };

  const resetDragDrop = () => {
    setDragItems(["Placeholder 1", "Placeholder 2", "Placeholder 3", "Placeholder 4"]);
    setStarting([]);
    setKeeping([]);
    setDragFeedback("");
  };

  const saveNotes = (notesObj) => {
    if (!checkStorageQuota()) {
      setError("Storage full.");
      return;
    }
    const homework = JSON.parse(localStorage.getItem(`homework_${currentUser}`) || "[]");
    const newHomework = {
      ...notesObj,
      lesson: classPlan,
      studentLevel,
      skillFocus,
      teacher: userData.teacher || "Unknown",
      reason: selectedReason,
      age: parseInt(userData.age, 10) || 18,
      module_lesson: savedLessons[savedLessons.length - 1]?.module_lesson,
      feedback: "",
      dragItems: { starting, keeping },
      exercises,
    };
    const updatedHomework = [...homework, newHomework].slice(-50);
    localStorage.setItem(`homework_${currentUser}`, JSON.stringify(updatedHomework));
    setSavedHomework(updatedHomework);
    console.log("Saved homework:", newHomework);
    syncLessonsToFirestore(currentUser, savedLessons, updatedHomework);
  };

  const submitAnswer = async (answer) => {
    if (!auth.currentUser) {
      setError("Please log in to submit answers.");
      return;
    }
    if (!checkStorageQuota()) {
      setError("Storage full.");
      return;
    }

    setLoading(true);
    try {
      let feedback = "";
      let updateProgress = false;

      if (typeof answer === "object" && answer.action) {
        if (answer.action === "flashcards_completed" && answer.skillFocus === "Vocabulary") {
          feedback = "All vocabulary flashcards completed! Great job! 🎉";
          updateProgress = true;
        } else if (answer.action === "audio_played" && answer.skillFocus === "Speaking") {
          feedback = "Audio prompt played successfully! Practice speaking! 🎙️";
          updateProgress = true;
        } else {
          throw new Error("Invalid action or skillFocus");
        }
      } else {
        const token = await auth.currentUser.getIdToken();
        const res = await axios.post(
          `${API_URL}/submit-answer`,
          {
            answer,
            class_plan: classPlan,
            student_level: studentLevel,
            skill_focus: validSkills.includes(skillFocus) ? skillFocus : "Speaking",
            reason: selectedReason,
          },
          {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            timeout: 30000,
          }
        );
        feedback = res.data.feedback;
        const newRemainingCalls = res.data.remaining_calls?.generate || 0;
        setRemainingCalls(newRemainingCalls);
        localStorage.setItem(`remainingCalls_${currentUser}`, newRemainingCalls.toString());
        localStorage.setItem(`lastCallDate_${currentUser}`, new Date().toDateString());
        console.log("Updated remaining calls after submitAnswer:", newRemainingCalls);
        updateProgress = true;
      }

      setFeedback(feedback);

      if (updateProgress) {
        const lessons = JSON.parse(localStorage.getItem(`lessons_${currentUser}`) || "[]").slice(-50);
        const lastLesson = lessons[lessons.length - 1];
        if (lastLesson) {
          lastLesson.feedback = feedback;
          lastLesson.completed = true;
          localStorage.setItem(`lessons_${currentUser}`, JSON.stringify(lessons));
          console.log("Updated lesson with feedback and completed:", lastLesson);
          setSavedLessons(lessons);

          const course = initializeCourse();
          const skill = course.skills.find((skillItem) => skillItem.skill === skillFocus);
          if (skill) {
            skill.completed = (skill.completed || 0) + 1;
            if (skillFocus === "Speaking" && lastLesson.module_lesson > 0) {
              skill.lessons = skill.lessons || [];
              if (!skill.lessons.some((l) => l.module_lesson === lastLesson.module_lesson)) {
                skill.lessons.push({ module_lesson: lastLesson.module_lesson, completed: true });
              }
            }
            localStorage.setItem(`course_${currentUser}`, JSON.stringify(course));
            console.log("Updated course after submitAnswer:", course);
            await updateSkillProgressInFirestore(currentUser, course);
          } else {
            console.warn(`Skill ${skillFocus} not found`);
            setError(`Skill ${skillFocus} not found in course`);
          }

          await syncLessonsToFirestore(currentUser, lessons, JSON.parse(localStorage.getItem(`homework_${currentUser}`) || "[]"));
        } else {
          console.warn("No last lesson found to update");
          setError("No lesson found to update progress.");
        }
      }
    } catch (err) {
      console.error("Error submitting answer:", err);
      const cachedCalls = parseInt(localStorage.getItem(`remainingCalls_${currentUser}`) || "5", 10);
      setRemainingCalls(cachedCalls);
      setFeedback(
        err.response?.status === 429
          ? "You've reached your daily lesson limit (5). Try again tomorrow!"
          : err.response?.status === 401
          ? "Please log in to submit answers."
          : err.response?.status === 404
          ? "Answer submission endpoint not found. Contact support."
          : err.response?.status === 0
          ? "CORS error: Backend not allowing requests. Contact support or check ad blockers."
          : err.code === "ECONNABORTED"
          ? "Request timed out. Using cached credits: " + cachedCalls
          : err.message.includes("Network Error")
          ? "Network error: Check your internet connection or ad blockers."
          : err.message || "Failed to submit answer. Check ad blockers or network settings."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header className="header">
        <img src="/logo.png" alt="Language Learning Arcade Logo" className="header-logo" />
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/progress">Progress</a>
          <a href="/homework">Homework</a>
          <a href="/lessons">Lessons</a>
          {currentUser ? (
            <button className="button-primary" onClick={() => auth.signOut().then(() => navigate("/login"))}>
              Logout
            </button>
          ) : (
            <button className="button-primary" onClick={() => navigate("/login")}>
              Login
            </button>
          )}
        </nav>
      </header>

      <div className="app-container section-border">
        <h2>Language Learning Arcade</h2>
        {error && <p className="error-text">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className="class-plan-container">
              <h3>Your Lesson Plan</h3>
              {classPlan ? (
                <Markdown rehypePlugins={[rehypeSanitize]}>{classPlan}</Markdown>
              ) : (
                <p>No lesson plan available. Try generating a new lesson.</p>
              )}
            </div>
            <Notepad
              onSave={saveNotes}
              onSubmitAnswer={submitAnswer}
              dragItems={dragItems}
              starting={starting}
              keeping={keeping}
              dragFeedback={dragFeedback}
              handleDragStart={handleDragStart}
              handleDrop={handleDrop}
              handleDragOver={handleDragOver}
              handleRemove={handleRemove}
              checkDragDropAnswers={checkDragDropAnswers}
              resetDragDrop={resetDragDrop}
              vocabulary={vocabulary}
              exercises={exercises}
              skillFocus={skillFocus}
              savedLessons={savedLessons}
              savedHomework={savedHomework}
              classPlan={classPlan}
            />
            {feedback && (
              <div className="feedback-container">
                <h3>Feedback</h3>
                <p>{feedback}</p>
              </div>
            )}
            <div className="credits-container">
              <p>Remaining credits today: {remainingCalls}</p>
              <button onClick={generateClass} disabled={remainingCalls <= 0 || loading} className="button-primary">
                Generate New Lesson
              </button>
            </div>
          </>
        )}
      </div>

      <footer className="footer">
        <p>© 2025 Language Learning Arcade. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ClassGenerator;
