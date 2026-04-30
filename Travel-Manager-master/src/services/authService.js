import { API_URL } from "./api";

export const register = async (userData) => {
  const response = await fetch(`${API_URL}/api/Auth/register`, {  // Depinde de backend
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    throw new Error("Registration failed");
  }

  return await response.json();
};

export const login = async (loginData) => {
  const response = await fetch(`${API_URL}/api/Auth/login`, {    // Depinde de backend !
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(loginData)
  });

  if (!response.ok) {
    throw new Error("Login failed");
  }

  const data = await response.json();

  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  return data;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const isLoggedIn = () => {
  return localStorage.getItem("token") !== null;
};

export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};