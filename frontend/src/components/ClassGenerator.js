import React, { useState, useEffect, useMemo } from "react";
import Markdown from "react-markdown"; // Fixed: Use 'Markdown' instead of 'ReactMarkdown'
import rehypeSanitize from "rehype-sanitize";
import Notepad from "./Notepad.js";
import axios from "axios";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import "../styles.css";

export default function ClassGenerator() {
  const validSkills = ["Speaking", "Grammar", "Vocabulary", "Writing", "Reading"];
  const currentUser = localStorage.getItem("currentUser") || auth.currentUser?.uid || "test_user_123";
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  const userData = users[currentUser] || {};
  const courseData = JSON.parse(localStorage.getItem(`course_${currentUser}`) || "{}");
  const isBusiness = userData.why?.toLowerCase().includes("business");
  const isTravel = userData.why?.toLowerCase().includes("travel");
  const [studentLevel, setStudentLevel] = useState(userData.studentLevel || "A1");
  const [skillFocus, setSkillFocus] = useState(
    courseData.skills?.find((s) => s.completed < s.required && validSkills.includes(s.skill))?.skill || "Speaking"
  );
  const [teacher, setTeacher] = useState("Emma");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [classPlan, setClassPlan] = useState("");
  const [feedback, setFeedback] = useState("");
  const [selectedReason, setSelectedReason] = useState(userData.why || "personal growth");
  const [dragItems, setDragItems] = useState([]);
  const [starting, setStarting] = useState([]);
  const [keeping, setKeeping] = useState([]);
  const [dragFeedback, setDragFeedback] = useState("");
  const [vocabulary, setVocabulary] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [remainingCalls, setRemainingCalls] = useState(null);

  const API_URL = process.env.NODE_ENV === "production"
    ? "https://languagelearningarcade.onrender.com"
    : "http://127.0.0.1:8000";

  const teachers = [
    { name: "Emma", avatar: "/emma.png" },
    { name: "Liam", avatar: "/liam.png" },
    { name: "Olivia", avatar: "/olivia.png" },
    { name: "Noah", avatar: "/noah.png" },
    { name: "Sophia", avatar: "/sophia.png" },
  ];

  const speakingModules = {
    business: [
      { lesson: 1, topic: "Storytelling in Business" },
      { lesson: 2, topic: "Quick Thinking in Meetings" },
      { lesson: 3, topic: "Professional Networking" },
      { lesson: 4, topic: "Negotiations" },
      { lesson: 5, topic: "Presentation Delivery" },
    ],
    travel: [
      { lesson: 1, topic: "Asking for Directions" },
      { lesson: 2, topic: "Ordering Food" },
      { lesson: 3, topic: "Booking Accommodations" },
      { lesson: 4, topic: "Making Small Talk" },
      { lesson: 5, topic: "Handling Emergencies" },
    ],
    personal: [
      { lesson: 1, topic: "Casual Conversation" },
      { lesson: 2, topic: "Building Rapport in Conversations" },
      { lesson: 3, topic: "Debating" },
      { lesson: 4, topic: "Describing Experiences" },
      { lesson: 5, topic: "Expressing Opinions" },
    ],
  };

  useEffect(() => {
    const fetchRemainingCalls = async () => {
      try {
        if (!auth.currentUser) throw new Error("User not authenticated");
        const token = await auth.currentUser.getIdToken();
        const res = await axios.get(`${API_URL}/remaining-calls`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 60000,
        });
        setRemainingCalls(res.data.remaining_calls.generate);
      } catch (err) {
        console.error("Error fetching remaining calls:", err);
        setError(
          err.response?.status === 429
            ? "You've reached your daily lesson limit (5). Try again tomorrow!"
            : err.response?.status === 401
            ? "Please log in to check remaining lessons."
            : err.message === "User not authenticated"
            ? "Please log in to access lessons."
            : "Failed to fetch remaining lessons. Try again later."
        );
        setRemainingCalls(0);
      }
    };
    fetchRemainingCalls();
  }, [API_URL]); // Fixed: Added API_URL to dependency array

  const initializeCourse = () => {
    let course = JSON.parse(localStorage.getItem(`course_${currentUser}`) || "{}");
    if (!course.skills || !Array.isArray(course.skills)) {
      course = {
        level: studentLevel || "A1",
        reason: selectedReason || userData.why || "personal growth",
        age: parseInt(userData.age, 10) || 18,
        skills: validSkills.map((skill) => ({
          skill,
          completed: 0,
          required: 10,
          lessons: [],
        })),
      };
      localStorage.setItem(`course_${currentUser}`, JSON.stringify(course));
      console.log("Initialized course for", currentUser, ":", course);
    }
    return course;
  };

  const checkStorageQuota = () => {
    let total = 0;
    for (let x in localStorage) {
      if (localStorage.hasOwnProperty(x)) {
        total += (localStorage[x].length + x.length) * 2;
      }
    }
    const usedMB = (total / 1024 / 1024).toFixed(2);
    const maxMB = 5;
    if (usedMB >= maxMB) {
      console.error(`localStorage is full (${usedMB}MB)`);
      setError("Storage is full. Please clear old data.");
      return false;
    }
    if (usedMB > maxMB * 0.9) {
      console.warn(`localStorage is ${usedMB}MB, nearing ${maxMB}MB limit`);
      setError("Storage is nearly full. Clear old data to continue.");
      return false;
    }
    return true;
  };

  const getModuleReason = () => {
    if (isBusiness) return "business";
    if (isTravel) return "travel";
    return "personal";
  };

  const getNextModuleLesson = () => {
    if (skillFocus !== "Speaking") return 0;
    const course = JSON.parse(localStorage.getItem(`course_${currentUser}`) || "{}");
    const speakingSkill = course.skills?.find((s) => s.skill === "Speaking");
    const completedModuleLessons = speakingSkill?.lessons?.filter((l) => l.module_lesson && l.completed).length || 0;
    const nextLesson = completedModuleLessons < 5 ? completedModuleLessons + 1 : 0;
    console.log("getNextModuleLesson:", nextLesson);
    return nextLesson;
  };

  const updateSkillProgressInFirestore = async (userId, course) => {
    try {
      if (!auth.currentUser || auth.currentUser.uid !== userId) {
        throw new Error("User not authenticated");
      }
      await setDoc(doc(db, "users", userId), { course }, { merge: true });
      console.log("Updated Firestore course for", userId, ":", course);
    } catch (error) {
      console.error("Error updating Firestore:", error);
      setError("Failed to sync progress with server.");
    }
  };

  const handleReasonClick = (reason) => {
    setSelectedReason(reason);
    setClassPlan("");
    setFeedback("");
    setDragItems([]);
    setStarting([]);
    setKeeping([]);
    setDragFeedback("");
    setVocabulary([]);
    setExercises([]);
  };

  const handleDragStart = (e, item, source) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ item, source }));
  };

  const handleDrop = (e, category) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    const { item, source } = data;

    if (source === "starting") {
      setStarting((prev) => prev.filter((i) => i !== item));
    } else if (source === "keeping") {
      setKeeping((prev) => prev.filter((i) => i !== item));
    } else {
      setDragItems((prev) => prev.filter((i) => i !== item));
    }

    if (category === "starting") {
      setStarting((prev) => [...prev, item]);
    } else if (category === "keeping") {
      setKeeping((prev) => [...prev, item]);
    }

    checkDragDropAnswers();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleRemove = (item, category) => {
    if (category === "starting") {
      setStarting((prev) => prev.filter((i) => i !== item));
      setDragItems((prev) => [...prev, item]);
    } else if (category === "keeping") {
      setKeeping((prev) => prev.filter((i) => i !== item));
      setDragItems((prev) => [...prev, item]);
    }
    checkDragDropAnswers();
  };

  const resetDragDrop = () => {
    setDragItems((prev) => [...prev, ...starting, ...keeping]);
    setStarting([]);
    setKeeping([]);
    setDragFeedback("");
  };

  const checkDragDropAnswers = () => {
    if (dragItems.length < 4) {
      setDragFeedback("Not enough items to check answers.");
      return "Not enough items to check answers.";
    }
    const correctStarting = dragItems.slice(0, 2);
    const correctKeeping = dragItems.slice(2, 4);

    const startingCorrect =
      starting.length === correctStarting.length &&
      starting.every((item) => correctStarting.includes(item));
    const keepingCorrect =
      keeping.length === correctKeeping.length &&
      keeping.every((item) => correctKeeping.includes(item));

    const feedback = startingCorrect && keepingCorrect
      ? "All correct! Great job! 🎉"
      : "Some answers are incorrect. Try again!";
    setDragFeedback(feedback);
    return feedback;
  };

  const generateClass = async () => {
    if (!auth.currentUser) {
      setError("Please log in to generate lessons.");
      return;
    }
    if (remainingCalls === 0) {
      setError("You've reached your daily lesson limit (5). Try again tomorrow or go premium!");
      return;
    }
    if (!checkStorageQuota()) return;

    setLoading(true);
    setError(null);
    setClassPlan("");
    setFeedback("");
    setDragItems([]);
    setStarting([]);
    setKeeping([]);
    setDragFeedback("");
    setVocabulary([]);
    setExercises([]);

    if (!userData.why || isNaN(parseInt(userData.age, 10))) {
      setError("User data incomplete. Please set up profile.");
      setLoading(false);
      return;
    }

    initializeCourse();

    try {
      const token = await auth.currentUser.getIdToken();
      const usedContent = JSON.parse(localStorage.getItem(`used_content_${currentUser}`) || "{}");
      const payload = {
        student_level: studentLevel,
        skill_focus: validSkills.includes(skillFocus) ? skillFocus : "Speaking",
        teacher,
        reason: selectedReason,
        age: parseInt(userData.age, 10),
        module_lesson: getNextModuleLesson(),
        used_phrases: usedContent.phrases || [],
        used_vocab: usedContent.vocab || [],
      };
      console.log("Generating class with payload:", payload);

      const res = await axios.post(`${API_URL}/generate-class`, payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        timeout: 60000,
      });

      setClassPlan(res.data.class_plan);
      setRemainingCalls(res.data.remaining_calls);

      const dragMatch = res.data.class_plan.match(/## Quick Check\n([\s\S]*?)(?=\n##|$)/);
      if (dragMatch) {
        const quickCheckText = dragMatch[1];
        const items = quickCheckText.match(/- \[ \] ([^\n]+)/g)?.map((item) => item.replace(/- \[ \] /, "")) || [];
        setDragItems(items);
      } else {
        console.warn("No Quick Check section found");
      }

      const vocabMatch = res.data.class_plan.match(/## Vocabulary\n([\s\S]*?)(?=\n##|$)/);
      if (vocabMatch) {
        const vocabText = vocabMatch[1];
        const lines = vocabText.split("\n").filter((line) => line.startsWith("|") && !line.includes("---"));
        const vocabData = lines.map((line) => {
          const [, word, meaning, example] = line.split("|").map((cell) => cell.trim()); // Removed unused '_'
          return { word, meaning, example };
        });
        setVocabulary(vocabData);
      } else {
        console.warn("No Vocabulary section found");
      }

      const exerciseMatch = res.data.class_plan.match(/## Exercises\n([\s\S]*?)(?=\n##|$)/);
      if (exerciseMatch) {
        const exerciseText = exerciseMatch[1];
        const exerciseList = exerciseText.split("\n").filter((line) => line.match(/^\d+\./));
        setExercises(exerciseList);
      } else {
        console.warn("No Exercises section found");
      }

      const lessons = JSON.parse(localStorage.getItem("lessons") || "[]").slice(-50);
      const newLesson = {
        classPlan: res.data.class_plan,
        studentLevel,
        skillFocus,
        teacher,
        reason: selectedReason,
        age: parseInt(userData.age, 10),
        timestamp: new Date().toLocaleString(),
        completed: false,
        module_lesson: skillFocus === "Speaking" ? getNextModuleLesson() : 0,
      };
      localStorage.setItem("lessons", JSON.stringify([...lessons, newLesson]));
      console.log("Lesson saved:", newLesson);

      const updatedContent = {
        phrases: [...(usedContent.phrases || []), ...dragItems],
        vocab: [...(usedContent.vocab || []), ...vocabulary.map((v) => v.word)],
      };
      localStorage.setItem(`used_content_${currentUser}`, JSON.stringify(updatedContent));
    } catch (err) {
      console.error("Class generation error:", err);
      setError(
        err.response?.status === 429
          ? "You've reached your daily lesson limit (5). Try again tomorrow!"
          : err.response?.status === 401
          ? "Please log in to generate lessons."
          : err.code === "ECONNABORTED"
          ? "Request timed out. Please try again."
          : err.response?.data?.detail || "Error generating class. Try again."
      );
      setRemainingCalls(err.response?.data?.remaining_calls || 0);
    } finally {
      setLoading(false);
    }
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

    setLoading(true); // Using 'loading' instead of unused 'submitting'
    try {
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

      setFeedback(res.data.feedback);
      setRemainingCalls(res.data.remaining_calls);

      const lessons = JSON.parse(localStorage.getItem("lessons") || "[]").slice(-50);
      const lastLesson = lessons[lessons.length - 1];
      if (lastLesson) {
        lastLesson.feedback = res.data.feedback;
        lastLesson.completed = true;
        localStorage.setItem("lessons", JSON.stringify(lessons));
        console.log("Updated lesson with feedback and completed:", lastLesson);

        const course = initializeCourse();
        const skill = course.skills.find((s) => s.skill === skillFocus);
        if (skill) {
          skill.completed = (skill.completed || 0) + 1;
          if (skillFocus === "Speaking" && lastLesson.module_lesson > 0) {
            skill.lessons = skill.lessons || [];
            if (!skill.lessons.some((l) => l.module_lesson === lastLesson.module_lesson)) {
              skill.lessons.push({ module_lesson: lastLesson.module_lesson, completed: true });
            }
          }
          localStorage.setItem(`course_${currentUser}`, JSON.stringify(course));
          await updateSkillProgressInFirestore(currentUser, course);
          console.log("Updated course after submitAnswer:", course);
        } else {
          console.warn(`Skill ${skillFocus} not found`);
          setError(`Skill ${skillFocus} not found in course`);
        }
      }
    } catch (err) {
      console.error("Error submitting answer:", err);
      setFeedback(
        err.response?.status === 429
          ? "You've reached your daily lesson limit (5). Try again tomorrow!"
          : err.response?.status === 401
          ? "Please log in to submit answers."
          : err.code === "ECONNABORTED"
          ? "Request timed out. Please try again."
          : err.response?.data?.detail || "Failed to submit answer."
      );
      setRemainingCalls(err.response?.data?.remaining_calls || 0);
    } finally {
      setLoading(false);
    }
  };

  const onSave = async (notesObj) => {
    try {
      if (!auth.currentUser) {
        setError("Please log in to save homework.");
        return;
      }
      if (!notesObj.notes || !notesObj.date) {
        setError("Missing notes or date.");
        return;
      }
      if (!checkStorageQuota()) {
        setError("Storage full.");
        return;
      }

      const course = initializeCourse();
      const skill = course.skills?.find((s) => s.skill === skillFocus);
      const key = `homework_${currentUser}`;
      const saved = JSON.parse(localStorage.getItem(key) || "[]").slice(-50);
      const moduleLesson = skillFocus === "Speaking" ? getNextModuleLesson() : 0;

      const newEntry = {
        lesson: classPlan,
        notes: notesObj.notes,
        timestamp: notesObj.date,
        studentLevel,
        skillFocus,
        teacher,
        reason: selectedReason,
        age: parseInt(course.age, 10) || 18,
        module_lesson: moduleLesson,
        feedback,
        dragItems: { starting, keeping },
        exercises: notesObj.exercises || {},
      };

      saved.push(newEntry);
      localStorage.setItem(key, JSON.stringify(saved));

      const badgeMatch = classPlan.match(/## Badge\n.*?🏅 \*\*(.*?)\*\*/s);
      const badgeName = badgeMatch ? badgeMatch[1].trim() : "Lesson Star";

      const badges = JSON.parse(localStorage.getItem(`badges_${currentUser}`) || "[]");
      if (!badges.includes(badgeName)) {
        badges.push(badgeName);
        localStorage.setItem(`badges_${currentUser}`, JSON.stringify(badges));
      }

      if (skill) {
        skill.completed = (skill.completed || 0) + 1;
        if (skillFocus === "Speaking" && moduleLesson > 0) {
          skill.lessons = skill.lessons || [];
          if (!skill.lessons.some((l) => l.module_lesson === moduleLesson)) {
            skill.lessons.push({ module_lesson: moduleLesson, completed: true });
          }
        }
        localStorage.setItem(`course_${currentUser}`, JSON.stringify(course));
        await updateSkillProgressInFirestore(currentUser, course);
      } else {
        setError(`Skill ${skillFocus} not found in course`);
      }

      alert(`📚 Saved to Homework! Earned badge: ${badgeName}`);
    } catch (err) {
      console.error("Error saving homework:", err);
      setError("Failed to save: " + err.message);
    }
  };

  const renderMarkdown = (text) => {
    if (!text) return null;
    return (
      <Markdown
        rehypePlugins={[rehypeSanitize]}
        components={{
          h2: ({ children }) => <h2 className="markdown-header">{children}</h2>,
          ul: ({ children }) => <ul className="markdown-list">{children}</ul>,
          ol: ({ children }) => <ol className="markdown-list">{children}</ol>,
          li: ({ children }) => <li className="markdown-list-item">{children}</li>,
          strong: ({ children }) => <strong className="markdown-strong">{children}</strong>,
          table: ({ children }) => <table className="markdown-table">{children}</table>,
          th: ({ children }) => <th style={{ border: "1px solid #aaa", padding: "8px" }}>{children}</th>,
          td: ({ children }) => <td style={{ border: "1px solid #aaa", padding: "8px" }}>{children}</td>,
          p: ({ children, ...props }) => {
            if (typeof children === "string" && children.includes("🎙")) {
              return (
                <div className="markdown-voice">
                  <button style={{ padding: "10px", background: "#f90", color: "white" }}>
                    Record Response 🎙️
                  </button>
                  <p className="markdown-paragraph" style={{ fontFamily: "monospace" }}>
                    {children.replace(/🎙\s*/, "")}
                  </p>
                </div>
              );
            }
            return <p className="markdown-paragraph" style={{ fontFamily: "monospace" }} {...props}>{children}</p>;
          },
          a: ({ href, children }) => {
            if (href.includes("youtube.com/watch?v=") || href.includes("youtu.be")) {
              const videoId = href.includes("youtube.com")
                ? href.split("v=")[1]?.split("&")[0]
                : href.split("youtu.be/")[1]?.split("?")[0];
              if (videoId) {
                return (
                  <div className="markdown-video">
                    <iframe
                      width="100%"
                      height="315"
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title="Lesson Video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                );
              }
            }
            return (
              <a href={href} className="markdown-link" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {text.replace(/## (Quick Check|Vocabulary|Exercises)\n([\s\S]*?)(?=\n##|$)/g, "")}
      </Markdown>
    );
  };

  const suggestedSkill = useMemo(() => {
    if (!courseData.skills) return { skill: "Any", lessonsLeft: 0 };
    const skill = courseData.skills.find((s) => s.completed < s.required && validSkills.includes(s.skill));
    return skill ? { skill: skill.skill, lessonsLeft: skill.required - skill.completed } : { skill: "Any", lessonsLeft: 0 };
  }, [courseData.skills, validSkills]); // Fixed: Added validSkills to dependency array

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
        </nav>
      </header>
      <div className="app-container section-border">
        <h2>🎛 Generate Class</h2>
        <p className="limit-text">
          {remainingCalls === null ? "Loading lessons left..." : `Lessons left today: ${remainingCalls}/5`}
        </p>
        {remainingCalls === 0 && (
          <button
            className="button-primary"
            onClick={() => window.location.href = "https://x.ai/grok"} // Replace with actual Stripe link
            style={{ width: "100%", marginBottom: 15 }}
          >
            Go Premium for Unlimited Lessons!
          </button>
        )}
        <div className="reason-buttons">
          <label>Filter by Reason:</label>
          <div>
            {["travel", "business", "personal growth"].map((reason) => (
              <button
                key={reason}
                className={`button-primary ${selectedReason.toLowerCase() === reason ? "button-selected" : ""}`}
                onClick={() => handleReasonClick(reason)}
              >
                {reason.charAt(0).toUpperCase() + reason.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <p>Level: {userData.studentLevel || "Not set"}, Age: {userData.age || "Not set"}, Reason: {userData.why || "Not set"}</p>
        <p>
          Suggested skill: {suggestedSkill.skill} ({suggestedSkill.lessonsLeft} lessons left)
        </p>
        {skillFocus === "Speaking" && getNextModuleLesson() > 0 && (
          <p>
            Speaking Module Lesson {getNextModuleLesson()}: {speakingModules[getModuleReason()][getNextModuleLesson() - 1]?.topic || "Unknown"}
          </p>
        )}

        <label htmlFor="levelSelect">Student Level:</label>
        <select
          id="levelSelect"
          value={studentLevel}
          onChange={(e) => setStudentLevel(e.target.value)}
          style={{ marginTop: 5, padding: 5, width: "100%" }}
        >
          {["A1", "A2", "B1", "B2", "C1", "C2"].map((lvl) => (
            <option key={lvl} value={lvl}>
              {lvl}
            </option>
          ))}
        </select>

        <label htmlFor="skillSelect" style={{ display: "block", marginTop: 15 }}>
          Skill Focus:
        </label>
        <select
          id="skillSelect"
          value={skillFocus}
          onChange={(e) => setSkillFocus(e.target.value)}
          style={{ marginTop: 5, padding: 5, width: "100%" }}
        >
          {validSkills.map((skill) => (
            <option key={skill} value={skill}>
              {skill}
            </option>
          ))}
        </select>

        <label htmlFor="teacherSelect" style={{ display: "block", marginTop: 15 }}>
          Choose Your Teacher:
        </label>
        <select
          id="teacherSelect"
          value={teacher}
          onChange={(e) => setTeacher(e.target.value)}
          style={{ marginTop: 5, padding: 5, width: "100%" }}
        >
          {teachers.map((t) => (
            <option key={t.name} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
        <div className="avatar-container">
          {teachers.map((t) => (
            <div
              key={t.name}
              className={`avatar-item ${teacher === t.name ? "avatar-selected" : ""}`}
              onClick={() => setTeacher(t.name)}
            >
              <img src={t.avatar} alt={`Teacher ${t.name}`} className="avatar-image" />
              <p>
                <strong>{t.name}</strong>
              </p>
            </div>
          ))}
        </div>

        <button
          className="button-fancy"
          onClick={generateClass}
          disabled={loading || remainingCalls === 0 || !auth.currentUser}
          style={{ width: "100%", marginTop: 20, cursor: (loading || remainingCalls === 0 || !auth.currentUser) ? "not-allowed" : "pointer" }}
        >
          {loading ? "Generating..." : remainingCalls === 0 ? "Daily Limit Reached" : !auth.currentUser ? "Please Log In" : "Generate Class"}
        </button>

        {error && <p className="error-text">{error}</p>}

        {classPlan ? (
          <div style={{ display: "flex", gap: "20px", marginTop: 25 }}>
            <div className="section-border lesson-plan-container" style={{ flex: 1, overflowY: "auto" }}>
              <h3>Generated Class Plan</h3>
              {renderMarkdown(classPlan)}
            </div>
            <div style={{ flex: 1 }}>
              <Notepad
                onSave={onSave}
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
              />
            </div>
          </div>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : (
          <p>No class plan generated yet.</p>
        )}

        {feedback && (
          <div className="section-border lesson-plan-container" style={{ marginTop: 15 }}>
            <h3>📝 Feedback</h3>
            {renderMarkdown(feedback)}
          </div>
        )}
      </div>
      <footer className="footer">
        <p>© 2025 Language Learning Arcade. All rights reserved.</p>
      </footer>
    </div>
  );
}
