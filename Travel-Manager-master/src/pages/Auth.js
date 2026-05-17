import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "../services/api";
import "./Auth.css";

function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  const [isRegister, setIsRegister] = useState(
    searchParams.get("mode") === "register"
  );

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    password: ""
  });

  const [message, setMessage] = useState({
    text: "",
    success: false
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const switchMode = () => {
    setIsRegister(!isRegister);
    setMessage({ text: "", success: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", success: false });

    const url = isRegister
      ? `${API_URL}/api/Auth/register`
      : `${API_URL}/api/Auth/login`;

    const bodyData = isRegister
      ? formData
      : {
          email: formData.email,
          password: formData.password
        };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bodyData)
    });

    if (response.ok) {
      if (isRegister) {
        setMessage({
          text: "Account created successfully. You can now log in.",
          success: true
        });

        setIsRegister(false);

        setFormData({
          name: "",
          surname: "",
          email: formData.email,
          password: ""
        });
      } else {
        const data = await response.json();

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        navigate(redirectPath);
      }
    } else {
      setMessage({
        text: isRegister
          ? "Registration failed. Please check your data."
          : "Invalid email or password.",
        success: false
      });
    }
  };

  return (
    <motion.div
      className="auth-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
    >
      <div className="auth-background-blob auth-blob-one" />
      <div className="auth-background-blob auth-blob-two" />

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 36, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <button
          type="button"
          className="auth-back-btn"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <div className="auth-heading">
          <span>{isRegister ? "Create account" : "Welcome back"}</span>
          <h2>{isRegister ? "Register" : "Login"}</h2>
          <p>
            {isRegister
              ? "Create your account and start planning your next trip."
              : "Log in to manage tickets, profile details and bookings."}
          </p>
        </div>

        <div className="auth-toggle">
          <button
            type="button"
            className={!isRegister ? "active" : ""}
            onClick={() => setIsRegister(false)}
          >
            Login
          </button>
          <button
            type="button"
            className={isRegister ? "active" : ""}
            onClick={() => setIsRegister(true)}
          >
            Register
          </button>
        </div>

        {message.text && (
          <motion.p
            className={message.success ? "auth-msg-success" : "auth-msg-error"}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {message.text}
          </motion.p>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <AnimatePresence mode="wait">
            {isRegister && (
              <motion.div
                className="register-fields"
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <input
                  name="name"
                  placeholder="Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />

                <input
                  name="surname"
                  placeholder="Surname"
                  value={formData.surname}
                  onChange={handleChange}
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <motion.button
            type="submit"
            className="main-btn"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            {isRegister ? "Create account" : "Login"}
          </motion.button>
        </form>

        <p className="auth-switch-text">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            className="link-btn"
            onClick={switchMode}
          >
            {isRegister ? "Login" : "Register"}
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
}

export default Auth;