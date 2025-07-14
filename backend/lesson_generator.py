import React, { useState, useEffect } from "react";
import Notepad from "./Notepad.js";
import axios from "axios";
import "../styles.css";

export default function ClassGenerator() {
  const currentUser = localStorage.getItem("currentUser") || "test_user_123";
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  const userData = users[currentUser] || {};
  const course = JSON.parse(localStorage.getItem(`course_${currentUser}`) || "{}");
  const isBusiness = userData.why?.toLowerCase().includes("business");
  const isTravel = userData.why?.toLowerCase().includes("travel");
  const [studentLevel, setStudentLevel] = useState(userData.studentLevel || "A1");
  const [skillFocus, setSkillFocus] = useState(
    course.skills?.find(s => s.completed < s.required)?.skill || "Speaking"
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

  const token = currentUser; // Replace with JWT in production
  const API_URL = process.env.NODE_ENV === "production"
    ? "https://language-arcade-backend.onrender.com"
    : "http://127.0.0.1:8000";

  const teachers = [
    { name: "Emma", avatar: "/avatars/emma.png" },
    { name: "Liam", avatar: "/avatars/liam.png" },
    { name: "Olivia", avatar: "/avatars/olivia.png" },
    { name: "Noah", avatar: "/avatars/noah.png" },
    { name: "Sophia", avatar: "/avatars/sophia.png" },
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
        const res = await axios.get(`${API_URL}/remaining-calls`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        setRemainingCalls(res.data.remaining_calls);
      } catch (err) {
        console.error("Error fetching remaining calls:", err);
        setError(
          err.response?.status === 429
            ? "You've reached your daily lesson limit (5). Try again tomorrow!"
            : err.response?.status === 401
            ? "Please log in to check remaining lessons."
            : "Failed to fetch remaining lessons. Try again later."
        );
        setRemainingCalls(0);
      }
    };
    fetchRemainingCalls();
  }, [token]);

  const initializeCourse = () => {
    let course = JSON.parse(localStorage.getItem(`course_${currentUser}`) || "{}");
    if (!course.skills || !Array.isArray(course.skills)) {
      course = {
        level: studentLevel || "A1",
        reason: selectedReason || userData.why || "personal growth",
        age: parseInt(userData.age, 10) || 18,
        skills: [
          { skill: "Speaking", completed: 0, required: 10, lessons: [] },
          { skill: "Grammar", completed: 0, required: 10, lessons: [] },
          { skill: "Vocabulary", completed: 0, required: 10, lessons: [] },
          { skill: "Writing", completed: 0, required: 10, lessons: [] },
          { skill: "Reading", completed: 0, required: 10, lessons: [] },
        ],
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
        total += ((localStorage[x].length + x.length) * 2);
      }
    }
    const usedMB = (total / 1024 / 1024).toFixed(2);
    const maxMB = 5;
    if (usedMB > maxMB * 0.9) {
      console.warn(`localStorage is ${usedMB}MB, nearing ${maxMB}MB limit`);
      setError("Storage is nearly full. Clear old data.");
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

  // Remove item from its original category using functional updates
  if (source === "starting") {
    setStarting((prev) => prev.filter((i) => i !== item));
  } else if (source === "keeping") {
    setKeeping((prev) => prev.filter((i) => i !== item));
  } else {
    setDragItems((prev) => prev.filter((i) => i !== item));
  }

  // Add item to the target category using functional updates
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
  // Defensive: ensure enough items in dragItems before slicing
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
  if (remainingCalls === 0) {
    setError("You've reached your daily lesson limit (5). Try again tomorrow or go premium!");
    return;
  }

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

  if (!currentUser || !userData.why || !userData.age) {
    setError("User data incomplete. Please set up profile.");
    setLoading(false);
    return;
  }

  if (!checkStorageQuota()) {
    setLoading(false);
    return;
  }

  const course = initializeCourse(); // Must return course object!

  try {
    const usedContent = JSON.parse(localStorage.getItem(`used_content_${currentUser}`) || "{}");
    const payload = {
      student_level: studentLevel,
      skill_focus: skillFocus,
      teacher,
      reason: selectedReason,
      age: parseInt(userData.age, 10) || 18,
      module_lesson: getNextModuleLesson(),
      used_phrases: usedContent.phrases || [],
      used_vocab: usedContent.vocab || [],
    };
    console.log("Generating class with payload:", payload);

    const res = await axios.post(`${API_URL}/generate-class`, payload, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      timeout: 30000,
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
        const [_, word, meaning, example] = line.split("|").map((cell) => cell.trim());
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
      age: parseInt(userData.age, 10) || 18,
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
        : err.response?.data?.detail || "Error generating class. Try again."
    );
    setRemainingCalls(err.response?.data?.remaining_calls || 0);
  } finally {
    setLoading(false);
  }
};

const submitAnswer = async (answer) => {
  try {
    if (!currentUser) {
      throw new Error("No current user found");
    }
    if (!checkStorageQuota()) {
      setError("Storage full.");
      return;
    }

    const res = await axios.post(
      `${API_URL}/submit-answer`,
      {
        answer,
        class_plan: classPlan,
        student_level: studentLevel,
        skill_focus: skillFocus,
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

      let course = initializeCourse(); // Must return course object
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
        // Optionally update Firestore
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
        : err.response?.data?.detail || "Failed to submit answer."
    );
    setRemainingCalls(err.response?.data?.remaining_calls || 0);
  }
};


  const onSave = async (notesObj) => {
  try {
    if (!notesObj.notes || !notesObj.date) {
      setError("Missing notes or date.");
      return;
    }

    // Declare course at top, so available everywhere below
    let course = JSON.parse(localStorage.getItem(`course_${currentUser}`) || "{}");

    // Define skill based on course and skillFocus
    const skill = course.skills?.find((s) => s.skill === skillFocus);

    const key = `homework_${currentUser}`;
    const saved = JSON.parse(localStorage.getItem(key) || "[]").slice(-50);
    const moduleLesson = skillFocus === "Speaking" ? getNextModuleLesson() : 0;

    const newEntry = {
      lesson: classPlan,  // ✅ Must include this!
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
      // Save updated course back to localStorage
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
    const lines = text.split("\n");
    const elements = [];
    let currentList = null;
    let listType = null;
    let inTable = false;
    let tableHeaders = [];
    let tableRows = [];

    lines.forEach((line, index) => {
      line = line.trim();

      if (line.startsWith("## ")) {
        if (currentList) {
          elements.push(
            listType === "ul" ? (
              <ul key={`ul-${index}`} className="markdown-list">
                {currentList}
              </ul>
            ) : (
              <ol key={`ol-${index}`} className="markdown-list">
                {currentList}
              </ol>
            )
          );
          currentList = null;
          listType = null;
        }
        if (inTable) {
          elements.push(
            <table key={`table-${index}`} className="markdown-table">
              <thead>
                <tr>
                  {tableHeaders.map((header, i) => (
                    <th key={i}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
          inTable = false;
          tableHeaders = [];
          tableRows = [];
        }
        if (line.includes("Quick Check") || line.includes("Vocabulary") || line.includes("Exercises")) return;
        elements.push(
          <h2 key={index} className="markdown-header">
            {line.replace(/^##\s+/, "")}
          </h2>
        );
      } else if (line.startsWith("|")) {
        if (currentList) {
          elements.push(
            listType === "ul" ? (
              <ul key={`ul-${index}`} className="markdown-list">
                {currentList}
              </ul>
            ) : (
              <ol key={`ol-${index}`} className="markdown-list">
                {currentList}
              </ol>
            )
          );
          currentList = null;
          listType = null;
        }
        const cells = line.split("|").map((cell) => cell.trim()).filter((cell) => cell);
        if (!inTable && cells.length > 1) {
          inTable = true;
          tableHeaders = cells;
        } else if (inTable && !line.includes("---")) {
          tableRows.push(cells);
        }
      } else if (line.startsWith("- ") && !line.includes("[ ]")) {
        if (inTable) {
          elements.push(
            <table key={`table-${index}`} className="markdown-table">
              <thead>
                <tr>
                  {tableHeaders.map((header, i) => (
                    <th key={i}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
          inTable = false;
          tableHeaders = [];
          tableRows = [];
        }
        if (!currentList || listType !== "ul") {
          if (currentList)
            elements.push(
              listType === "ul" ? (
                <ul key={`ul-${index}`} className="markdown-list">
                  {currentList}
                </ul>
              ) : (
                <ol key={`ol-${index}`} className="markdown-list">
                  {currentList}
                </ol>
              )
            );
          currentList = [];
          listType = "ul";
        }
        const content = line
          .replace(/^- /, "")
          .replace(/\*\*([^ *]+)\*\*/g, (_, match) => `<strong class="markdown-strong">${match}</strong>`);
        currentList.push(
          <li key={index} className="markdown-list-item" dangerouslySetInnerHTML={{ __html: content }} />
        );
      } else if (line.includes("🎙")) {
        if (currentList) {
          elements.push(
            listType === "ul" ? (
              <ul key={`ul-${index}`} className="markdown-list">
                {currentList}
              </ul>
            ) : (
              <ol key={`ol-${index}`} className="markdown-list">
                {currentList}
              </ol>
            )
          );
          currentList = null;
          listType = null;
        }
        if (inTable) {
          elements.push(
            <table key={`table-${index}`} className="markdown-table">
              <thead>
                <tr>
                  {tableHeaders.map((header, i) => (
                    <th key={i}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
          inTable = false;
          tableHeaders = [];
          tableRows = [];
        }
        elements.push(
          <div key={index} className="markdown-voice">
            <button style={{ padding: "10px", background: "#f90", color: "white" }}>
              Record Response 🎙️
            </button>
            <p
              className="markdown-paragraph"
              style={{ fontFamily: "monospace" }}
              dangerouslySetInnerHTML={{
                __html: line
                  .replace(/🎙\s*/, "")
                  .replace(/\*\*([^ *]+)\*\*/g, (_, match) => `<strong class="markdown-strong">${match}</strong>`),
              }}
            />
          </div>
        );
      } else if (line.includes("[") && (line.includes("](https://www.youtube.com") || line.includes("](https://youtu.be"))) {
        if (currentList) {
          elements.push(
            listType === "ul" ? (
              <ul key={`ul-${index}`} className="markdown-list">
                {currentList}
              </ul>
            ) : (
              <ol key={`ol-${index}`} className="markdown-list">
                {currentList}
              </ol>
            )
          );
          currentList = null;
          listType = null;
        }
        if (inTable) {
          elements.push(
            <table key={`table-${index}`} className="markdown-table">
              <thead>
                <tr>
                  {tableHeaders.map((header, i) => (
                    <th key={i}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
          inTable = false;
          tableHeaders = [];
          tableRows = [];
        }
        const match =
          line.match(/\[([^\]]+)\]\((https:\/\/www\.youtube\.com\/watch\?v=[^\)]+)\)/) ||
          line.match(/\[([^\]]+)\]\((https:\/\/youtu\.be\/[^\)]+)\)/);
        if (match) {
          const [, , url] = match;
          const videoId = url.includes("youtube.com") ? url.split("v=")[1].split("&")[0] : url.split("youtu.be/")[1].split("?")[0];
          elements.push(
            <div key={index} className="markdown-video">
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
      } else if (line) {
        if (currentList) {
          elements.push(
            listType === "ul" ? (
              <ul key={`ul-${index}`} className="markdown-list">
                {currentList}
              </ul>
            ) : (
              <ol key={`ol-${index}`} className="markdown-list">
                {currentList}
              </ol>
            )
          );
          currentList = null;
          listType = null;
        }
        if (inTable) {
          elements.push(
            <table key={`table-${index}`} className="markdown-table">
              <thead>
                <tr>
                  {tableHeaders.map((header, i) => (
                    <th key={i}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
          inTable = false;
          tableHeaders = [];
          tableRows = [];
        }
        const content = line
          .replace(/\*\*([^ *]+)\*\*/g, (_, match) => `<strong class="markdown-strong">${match}</strong>`)
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => `<a href="${url}" class="markdown-link" target="_blank" rel="noopener noreferrer">${text}</a>`);
        elements.push(
          <p
            key={index}
            className="markdown-paragraph"
            style={{ fontFamily: "monospace" }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );
      } else if (!currentList && !inTable) {
        elements.push(<br key={index} />);
      }
    });

    if (currentList) {
      elements.push(
        listType === "ul" ? (
          <ul key="final-ul" className="markdown-list">
            {currentList}
          </ul>
        ) : (
          <ol key="final-ol" className="markdown-list">
            {currentList}
          </ol>
        )
      );
    }
    if (inTable) {
      elements.push(
        <table key="final-table" className="markdown-table">
          <thead>
            <tr>
              {tableHeaders.map((header, i) => (
                <th key={i}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return elements;
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
            onClick={() => alert("Upgrade to premium for unlimited lessons!")} // Replace with Stripe link
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
        <p>Level: {userData.studentLevel}, Age: {userData.age}, Reason: {userData.why}</p>
        {course.skills && (
          <p>
            Suggested skill: {course.skills.find((s) => s.completed < s.required)?.skill || "Any"} (
            {course.skills.find((s) => s.completed < s.required)?.required -
              course.skills.find((s) => s.completed < s.required)?.completed || 0}{" "}
            lessons left)
          </p>
        )}
        {skillFocus === "Speaking" && getNextModuleLesson() > 0 && (
          <p>
            Speaking Module Lesson {getNextModuleLesson()}: {speakingModules[getModuleReason()][getNextModuleLesson() - 1].topic}
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
          {["Speaking", "Grammar", "Vocabulary", "Writing", "Reading"].map((skill) => (
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
          disabled={loading || remainingCalls === 0}
          style={{ width: "100%", marginTop: 20, cursor: (loading || remainingCalls === 0) ? "not-allowed" : "pointer" }}
        >
          {loading ? "Generating..." : remainingCalls === 0 ? "Daily Limit Reached" : "Generate Class"}
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
  );
}
      </div>
      <footer className="footer">
        <p>© 2025 Language Learning Arcade. All rights reserved.</p>
      </footer>
    </div>
  );
}