import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_URL } from "../services/api";
import "./Auth.css";

function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isRegister, setIsRegister] = useState(
    searchParams.get("mode") === "register"
  );

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        alert("Account created successfully!");
        setIsRegister(false);
      } else {
        const data = await response.json();

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert("Login successful!");
        navigate("/");
      }
    } else {
      alert(isRegister ? "Registration failed." : "Invalid email or password.");
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate(-1)}
        >
          Back
        </button>

        <h2>{isRegister ? "Register" : "Login"}</h2>

        {isRegister && (
          <>
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
          </>
        )}

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

        <button type="submit" className="main-btn">
          {isRegister ? "Register" : "Login"}
        </button>

        <p>
          {isRegister ? "Ai deja cont?" : "Nu ai cont?"}{" "}
          <button
            type="button"
            className="link-btn"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? "Login" : "Register"}
          </button>
        </p>
      </form>
    </div>
  );
}

export default Auth;