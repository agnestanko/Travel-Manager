import "./Header.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
    <motion.header
      className="header"
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <div className="header-inner">
        <div className="menuContainer">
          <motion.button
            className="leftBtn"
            onClick={() => setShowMenu(!showMenu)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
          >
            <span className="menuIcon">☰</span>
            Menu
          </motion.button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                className="dropdownMenu"
                initial={{ opacity: 0, y: -10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.96 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <button onClick={() => goToPage("/")}>Home</button>

                {loggedIn && (
                  <button onClick={() => goToPage("/profile")}>
                    My Profile
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          className="center"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          onClick={() => navigate("/")}
        >
          <img src={logo} alt="The Travelers logo" className="logo" />
        </motion.div>

        <div className="rightBtn">
          {!loggedIn && (
            <motion.button
              className="authBtn"
              onClick={() => navigate("/auth")}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
            >
              Login / Register
            </motion.button>
          )}

          {loggedIn && (
            <>
              <motion.div
                className="userBox"
                whileHover={{ y: -2 }}
                onClick={() => navigate("/profile")}
              >
                <span className="userAvatar">👤</span>
                <span className="userName">{user?.name || "User"}</span>
              </motion.div>

              <motion.button
                className="logoutBtn"
                onClick={handleLogout}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
              >
                Logout
              </motion.button>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}

export default Header;