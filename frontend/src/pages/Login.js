import React, { useState, useCallback } from "react";
import { auth, googleProvider, db } from "../firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const redirectAfterLogin = useCallback(
    async (user) => {
      try {
        const userProfileRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userProfileRef);

        const userInfo = {
          studentLevel: docSnap.exists() ? docSnap.data().level || "A1" : "A1",
          age: docSnap.exists() ? docSnap.data().ageGroup || "Adult_18_35" : "Adult_18_35",
          why: docSnap.exists() ? docSnap.data().reason || "personal growth" : "personal growth",
        };

        await setDoc(
          userProfileRef,
          {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            ...userInfo,
          },
          { merge: true }
        );

        localStorage.setItem("currentUser", user.uid);
        localStorage.setItem("users", JSON.stringify({ [user.uid]: userInfo }));
        onLogin(user.uid);

        // Only redirect after login is complete and Firestore has been handled
        if (docSnap.exists()) {
          navigate("/app");
        } else {
          navigate("/setup");
        }
      } catch (err) {
        console.error("Firestore error:", err);
        setError("Failed to load user profile: " + err.message);
      }
    },
    [navigate, onLogin]
  );

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      await redirectAfterLogin(result.user);
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("Google sign-in failed: " + err.message);
    }
  };

  const handleLogin = async () => {
    try {
      setError(null);
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      await redirectAfterLogin(userCred.user);
    } catch (err) {
      console.error("Email login error:", err);
      setError("Email login failed: " + err.message);
    }
  };

  const handleSignup = async () => {
    try {
      setError(null);
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await redirectAfterLogin(userCred.user);
    } catch (err) {
      console.error("Signup error:", err);
      setError("Signup failed: " + err.message);
    }
  };

  return (
    <div style={{ padding: 30, textAlign: "center" }}>
      <h2>Sign In to the Learning Arcade</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding: 10, marginBottom: 10, width: "80%" }}
      />
      <br />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ padding: 10, marginBottom: 20, width: "80%" }}
      />
      <br />
      <button className="button-primary" onClick={handleLogin}>
        Login
      </button>
      <button
        className="button-primary"
        onClick={handleSignup}
        style={{ marginLeft: 10 }}
      >
        Sign Up
      </button>
      <hr style={{ margin: "20px 0" }} />
      <button className="button-fancy" onClick={signInWithGoogle}>
        Sign in with Google
      </button>
    </div>
  );
}
