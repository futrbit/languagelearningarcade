// src/components/SetupPage.js
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

export default function SetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  const [formData, setFormData] = useState({
    studentLevel: "B2", // Default to match ClassGenerator.js
    age: 18,
    reason: "travel", // Default to match ClassGenerator.js
  });

  // Redirect immediately if setup already done
  useEffect(() => {
    const checkSetup = async () => {
      const user = auth.currentUser;
      const setupComplete = localStorage.getItem("setupComplete") === "true";
      if (user && setupComplete && location.pathname === "/setup") {
        navigate("/app", { replace: true });
      } else {
        setChecking(false); // done checking, can render form
      }
    };
    checkSetup();
  }, [navigate, location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "age") {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        setFormData((prev) => ({ ...prev, [name]: numValue }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Please log in to save profile.");
      }
      const uid = user.uid;
      console.log("Saving setup for UID:", uid, "Data:", formData); // Debug log

      // Save to Firestore
      const courseInfo = {
        studentLevel: formData.studentLevel,
        age: formData.age,
        why: formData.reason,
        skills: [
          { skill: "Speaking", completed: 0, required: 4, lessons: [] },
          { skill: "Listening", completed: 0, required: 4, lessons: [] },
          { skill: "Grammar", completed: 0, required: 4, lessons: [] },
          { skill: "Vocabulary", completed: 0, required: 4, lessons: [] },
          { skill: "Reading", completed: 0, required: 4, lessons: [] },
          { skill: "Writing", completed: 0, required: 4, lessons: [] },
        ],
        setupComplete: true,
        displayName: user.displayName || "User",
        uid,
      };

      await setDoc(doc(db, "users", uid), courseInfo, { merge: true });
      console.log("Firestore setup saved for UID:", uid); // Debug log

      // Save to localStorage to sync with ClassGenerator.js
      localStorage.setItem(`course_${uid}`, JSON.stringify(courseInfo));
      localStorage.setItem("setupComplete", "true");

      navigate("/app"); // Navigate to main app page
    } catch (error) {
      console.error("Error saving setup data:", error);
      alert("Failed to save profile. Please try again.");
    }
  };

  if (checking) return <div>Loading...</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <h2>👋 Welcome to the Language Arcade!</h2>
      <p>Help us customize your experience.</p>
      <form onSubmit={handleSubmit}>
        <label>
          Language Level:
          <select
            name="studentLevel"
            value={formData.studentLevel}
            onChange={handleChange}
          >
            <option value="A1">Beginner (A1)</option>
            <option value="A2">Elementary (A2)</option>
            <option value="B1">Intermediate (B1)</option>
            <option value="B2">Upper Intermediate (B2)</option>
            <option value="C1">Advanced (C1)</option>
            <option value="C2">Proficient (C2)</option>
          </select>
        </label>
        <br />
        <br />
        <label>
          Age:
          <input
            type="number"
            name="age"
            min={6}
            max={100}
            value={formData.age}
            onChange={handleChange}
            required
          />
        </label>
        <br />
        <br />
        <label>
          Why are you learning English?
          <select
            name="reason"
            value={formData.reason}
            onChange={handleChange}
          >
            <option value="personal growth">Personal Growth</option>
            <option value="business">Business</option>
            <option value="travel">Travel</option>
          </select>
        </label>
        <br />
        <br />
        <button type="submit">🚀 Save and Start</button>
      </form>
    </div>
  );
}
