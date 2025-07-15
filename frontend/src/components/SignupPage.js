import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { initializeApp } from "firebase/app";

// ✅ Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBLjfqWYT02rZ7KSsKD7mm5o1d9KKuNBdY",
  authDomain: "languagelearningarcade.firebaseapp.com",
  projectId: "languagelearningarcade",
  storageBucket: "languagelearningarcade.appspot.com",
  messagingSenderId: "198729393087",
  appId: "1:198729393087:web:e3fe739e954272431bf70a",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      let result;
      if (isSignup) {
        result = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
      }

      const user = result.user;
      localStorage.setItem("currentUser", user.email);
      onLogin(user.email);

      const courseData = localStorage.getItem(`course_${user.email}`);
      if (!courseData) {
        navigate("/setup");
      } else {
        navigate("/app");
      }
    } catch (err) {
      setError(err.message);
      console.error("Login error:", err);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      localStorage.setItem("currentUser", user.email);
      onLogin(user.email);

      const courseData = localStorage.getItem(`course_${user.email}`);
      if (!courseData) {
        navigate("/setup");
      } else {
        navigate("/app");
      }
    } catch (err) {
      setError(err.message);
      console.error("Google login error:", err);
    }
  };

  return (
    <div style={{
      maxWidth: "400px",
      margin: "50px auto",
      textAlign: "center",
      padding: "20px",
      borderRadius: "10px",
      background: "#f9f9f9",
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
    }}>
      <h2>{isSignup ? "Create Account" : "Login"}</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "10px", fontSize: "1em" }}
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "10px", fontSize: "1em" }}
        />
        <button
          type="submit"
          style={{
            backgroundColor: "#7A6BC4",
            color: "white",
            border: "none",
            padding: "10px 20px",
            fontSize: "1em",
            borderRadius: "6px",
            cursor: "pointer",
            width: "100%",
          }}
        >
          {isSignup ? "Sign Up" : "Login"}
        </button>
      </form>

      <p style={{ marginTop: "10px" }}>
        {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          onClick={() => setIsSignup(!isSignup)}
          style={{ color: "#007bff", border: "none", background: "none", cursor: "pointer" }}
        >
          {isSignup ? "Log in" : "Sign up"}
        </button>
      </p>

      <hr style={{ margin: "20px 0" }} />

      <button
        onClick={handleGoogleLogin}
        style={{
          backgroundColor: "#4285F4",
          color: "white",
          border: "none",
          padding: "10px 20px",
          fontSize: "1em",
          borderRadius: "6px",
          cursor: "pointer",
          width: "100%",
        }}
      >
        Login with Google
      </button>

      {error && <p style={{ color: "crimson", marginTop: "15px" }}>{error}</p>}
    </div>
  );
}
