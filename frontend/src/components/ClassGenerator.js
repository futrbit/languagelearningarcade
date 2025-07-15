import React, { useState, useEffect, useMemo } from "react";
import Markdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import Notepad from "./Notepad.js";
import axios from "axios";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
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
    courseData.skills?.find((skillItem) => skillItem.completed < skillItem.required && validSkills.includes(skillItem.skill))?.skill || "Speaking"
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
  const [savedLessons, setSavedLessons] = useState([]);
  const [savedHomework, setSavedHomework] = useState([]);

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
        if (!auth.currentUser) {
          throw new Error("User not authenticated");
        }
        const token = await auth.currentUser.getIdToken();
        const lastCallDate = localStorage.getItem(`lastCallDate_${currentUser}`);
        const today = new Date().toDateString();
        
        if (lastCallDate !== today) {
          localStorage.setItem(`remainingCalls_${currentUser}`, "5");
          localStorage.setItem(`lastCallDate_${currentUser}`, today);
          console.log("Reset remainingCalls to 5 for new day:", today);
        }

        const cachedCalls = parseInt(localStorage.getItem(`remainingCalls_${currentUser}`) || "5", 10);
        setRemainingCalls(cachedCalls);

        const res = await axios.get(`${API_URL}/remaining-calls`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        });
        
        const serverCalls = res.data.remaining_calls?.generate || 0;
        setRemainingCalls(serverCalls);
        localStorage.setItem(`remainingCalls_${currentUser}`, serverCalls.toString());
        localStorage.setItem(`lastCallDate_${currentUser}`, today);
        console.log("Fetched remaining calls from server:", serverCalls);
        
        if (serverCalls === 0) {
          setError("No lessons left today. Try again tomorrow or check your subscription at https://x.ai/grok.");
        }
      } catch (err) {
        console.error("Error fetching remaining calls:", err);
        const cachedCalls = parseInt(localStorage.getItem(`remainingCalls_${currentUser}`) || "5", 10);
        setRemainingCalls(cachedCalls);
        setError(
          err.response?.status === 429
            ? "You've reached your daily lesson limit (5). Try again tomorrow!"
            : err.response?.status === 401
            ? "Please log in to check remaining lessons."
            : err.response?.status === 404
            ? "Credits endpoint not found. Contact support."
            : err.message === "User not authenticated"
            ? "Please log in to access lessons."
            : err.code === "ECONNABORTED"
            ? "Request timed out. Using cached credits: " + cachedCalls
            : err.message.includes("Network Error")
            ? "Network error: Check your internet connection or ad blockers."
            : "Failed to fetch remaining lessons. Using cached credits: " + cachedCalls + ". Check ad blockers or network settings."
        );
      }
    };

    const loadData = async () => {
      const lessons = JSON.parse(localStorage.getItem(`lessons_${currentUser}`) || "[]");
      const homework = JSON.parse(localStorage.getItem(`homework_${currentUser}`) || "[]");
      console.log("Loaded lessons:", lessons);
      console.log("Loaded homework:", homework);
      setSavedLessons(lessons);
      setSavedHomework(homework);

      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.lessons) {
              localStorage.setItem(`lessons_${currentUser}`, JSON.stringify(data.lessons));
              setSavedLessons(data.lessons);
            }
            if (data.homework) {
              localStorage.setItem(`homework_${currentUser}`, JSON.stringify(data.homework));
              setSavedHomework(data.homework);
            }
            console.log("Loaded Firestore data:", data);
          }
        } catch (error) {
          console.error("Error loading Firestore data:", error);
          setError("Failed to load lessons from server. Check ad blockers or network settings.");
        }
      }
    };

    fetchRemainingCalls();
    loadData();
  }, [API_URL, currentUser]);

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
    const speakingSkill = course.skills?.find((skillItem) => skillItem.skill === "Speaking");
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
      setError("Failed to sync progress with server. Check ad blockers or network settings.");
    }
  };

  const syncLessonsToFirestore = async (userId, lessons, homework) => {
    try {
      if (!auth.currentUser || auth.currentUser.uid !== userId) {
        throw new Error("User not authenticated");
      }
      await setDoc(doc(db, "users", userId), { lessons, homework }, { merge: true });
      console.log("Synced lessons and homework to Firestore for", userId, ":", { lessons, homework });
    } catch (error) {
      console.error("Error syncing lessons to Firestore:", error);
      setError("Failed to sync lessons with server. Check ad blockers or network settings.");
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
      setError("You've reached your daily lesson limit (5). Try again tomorrow or check your subscription at https://x.ai/grok.");
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
      const newRemainingCalls = res.data.remaining_calls?.generate || 0;
      setRemainingCalls(newRemainingCalls);
      localStorage.setItem(`remainingCalls_${currentUser}`, newRemainingCalls.toString());
      localStorage.setItem(`lastCallDate_${currentUser}`, new Date().toDateString());
      console.log("Updated remaining calls after generateClass:", newRemainingCalls);

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
        console.log("Parsed dragItems:", items);
      } else {
        console.warn("No Quick Check section found in classPlan:", res.data.class_plan);
        setDragItems(["Placeholder 1", "Placeholder 2", "Placeholder 3", "Placeholder 4"]);
      }

      const vocabMatch = res.data.class_plan.match(/## Vocabulary\n([\s\S]*?)(?=\n##|$)/);
      if (vocabMatch) {
        const vocabText = vocabMatch[1];
        const lines = vocabText.split("\n").filter((line) => line.startsWith("|") && !line.includes("---"));
        const vocabData = lines.map((line) => {
          const [, word, meaning, example] = line.split("|").map((cell) => cell.trim());
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

      const lessons = JSON.parse(localStorage.getItem(`lessons_${currentUser}`) || "[]").slice(-50);
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
      lessons.push(newLesson);
      localStorage.setItem(`lessons_${currentUser}`, JSON.stringify(lessons));
      console.log("Lesson saved to localStorage:", newLesson);
      setSavedLessons(lessons);

      const updatedContent = {
        phrases: [...(usedContent.phrases || []), ...dragItems],
        vocab: [...(usedContent.vocab || []), ...vocabulary.map((v) => v.word)],
      };
      localStorage.setItem(`used_content_${currentUser}`, JSON.stringify(updatedContent));

      await syncLessonsToFirestore(currentUser, lessons, JSON.parse(localStorage.getItem(`homework_${currentUser}`) || "[]"));
    } catch (err) {
      console.error("Class generation error:", err);
      const cachedCalls = parseInt(localStorage.getItem(`remainingCalls_${currentUser}`) || "5", 10);
      setRemainingCalls(cachedCalls);
      let errorMessage = "Failed to generate class. Please try again.";
      if (err.response) {
        if (err.response.status === 429) {
          errorMessage = "You've reached your daily lesson limit (5). Try again tomorrow!";
        } else if (err.response.status === 401) {
          errorMessage = "Please log in to generate lessons.";
        } else if (err.response.status === 404) {
          errorMessage = "Lesson generation endpoint not found. Contact support.";
        } else if (err.response.status === 0) {
          errorMessage = "CORS error: Backend not allowing requests. Contact support or check ad blockers.";
        } else {
          errorMessage = err.response.data?.detail || "Error generating class. Check ad blockers or network settings.";
        }
      } else if (err.code === "ECONNABORTED") {
        errorMessage = "Request timed out. Using cached credits: " + cachedCalls;
      } else if (err.message.includes("Network Error")) {
        errorMessage = "Network error: Check your internet connection or ad blockers.";
      }
      setError(errorMessage);
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

    setLoading(true);
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
          timeout: 60000,
        }
      );

      setFeedback(res.data.feedback);
      const newRemainingCalls = res.data.remaining_calls?.generate || 0;
      setRemainingCalls(newRemainingCalls);
      localStorage.setItem(`remainingCalls_${currentUser}`, newRemainingCalls.toString());
      localStorage.setItem(`lastCallDate_${currentUser}`, new Date().toDateString());
      console.log("Updated remaining calls after submitAnswer:", newRemainingCalls);

      const lessons = JSON.parse(localStorage.getItem(`lessons_${currentUser}`) || "[]").slice(-50);
      const lastLesson = lessons[lessons.length - 1];
      if (lastLesson) {
        lastLesson.feedback = res.data.feedback;
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
          await updateSkillProgressInFirestore(currentUser, course);
          console.log("Updated course after submitAnswer:", course);
        } else {
          console.warn(`Skill ${skillFocus} not found`);
          setError(`Skill ${skillFocus} not found in course`);
        }

        await syncLessonsToFirestore(currentUser, lessons, JSON.parse(localStorage.getItem(`homework_${currentUser}`) || "[]"));
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
          : err.response?.data?.detail || "Failed to submit answer. Check ad blockers or network settings."
      );
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
      const skill = course.skills?.find((skillItem) => skillItem.skill === skillFocus);
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
      console.log("Homework saved to localStorage:", newEntry);
      setSavedHomework(saved);

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

      await syncLessonsToFirestore(currentUser, JSON.parse(localStorage.getItem(`lessons_${currentUser}`) || "[]"), saved);

      alert(`📚 Saved to Homework! Earned badge: ${badgeName}`);
    } catch (err) {
      console.error("Error saving homework:", err);
      setError("Failed to save: Check ad blockers or network settings.");
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
    if (!courseData.skills || !Array.isArray(courseData.skills)) {
      return { skill: "Any", lessonsLeft: 0 };
    }
    const incompleteSkill = courseData.skills.find(
      (skillItem) => skillItem.completed < skillItem.required && validSkills.includes(skillItem.skill)
    );
    return incompleteSkill
      ? { skill: incompleteSkill.skill, lessonsLeft: incompleteSkill.required - incompleteSkill.completed }
      : { skill: "Any", lessonsLeft: 0 };
  }, [courseData.skills, validSkills]);

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
            classPlan={classPlan} // Added prop
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
