import "./Header.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, logout, getCurrentUser } from "../services/authService";
import logo from "../assets/logo_header.png"; // importa logo (pune imaginea in /src/assets/logo.png)

function Header() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const loggedIn = isLoggedIn();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
      <div className="header">

         {/* MENU BUTTON */}
      <div className="menuContainer">
        <button
          className="leftBtn"
          onClick={() => setShowMenu(!showMenu)}
        >
          Menu
        </button>

        {/* DROPDOWN MENU */}
        {showMenu && (
          <div className="dropdownMenu">

            <button onClick={
              () => {navigate("/");
              setShowMenu(false);
            }}>
              Home
            </button>

            {/* DOAR daca e logat */}
            {loggedIn && (
              <button onClick={() => {
                navigate("/profile");
                setShowMenu(false);
              }}>
                My Profile
              </button>
            )}

          </div>
        )}
      </div>

      {/* Zona centrala */}
      <div className="center">

        {/* Logo */}
        <img src={logo} alt="logo" className="logo" />

      </div>

      {/* Dreapta */}
      <div className="rightBtn">

        {!loggedIn && (
          <button onClick={() => navigate("/auth")}>
            Login / Register
          </button>
        )}

        {loggedIn && (
          <>
            <div className="userBox">
              <span>👤</span>
              <span className="userName">{user?.name || "User"}</span>
            </div>

            <button onClick={handleLogout}>
              Logout
            </button>
          </>
        )}

      </div>
    </div>
  );
}

export default Header;