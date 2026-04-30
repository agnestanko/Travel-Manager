import "./Header.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, logout, getCurrentUser } from "../services/authService";
import logo from "../assets/logo_header.png";

function Header() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const loggedIn = isLoggedIn();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const goToPage = (path) => {
    navigate(path);
    setShowMenu(false);
  };

  return (
    <header className="header">
      <div className="header-inner">

        <div className="menuContainer">
          <button
            className="leftBtn"
            onClick={() => setShowMenu(!showMenu)}
          >
            Menu
          </button>

          {showMenu && (
            <div className="dropdownMenu">
              <button onClick={() => goToPage("/")}>Home</button>

              {loggedIn && (
                <button onClick={() => goToPage("/profile")}>
                  My Profile
                </button>
              )}
            </div>
          )}
        </div>

        <div className="center">
          <img src={logo} alt="The Travelers logo" className="logo" />
        </div>

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
    </header>
  );
}

export default Header;