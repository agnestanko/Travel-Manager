import "./Header.css";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, logout, getCurrentUser } from "../services/authService";

/**
 * Componenta Header
 * Afiseaza titlul aplicatiei si butoanele principale (menu + login)
 */
function Header() {
  const navigate = useNavigate();

  // verificare daca userul este logat
  const loggedIn = isLoggedIn();
  const user = getCurrentUser();

  // functie pentru logout
  const handleLogout = () => {
    logout();
    navigate("/auth")
  };

  return (
    <div className="header">

      {/* Buton pentru meniu (stanga) */}
      <button className="leftBtn">Menu</button>

      {/* Sectiune centrala cu titlu si descriere */}
      <div className="center">
        <h1>Event Finder</h1>
        <p>Find your perfect experience</p>
      </div>

      {/* Buton pentru autentificare (dreapta) */}
      <div className="rightBtn">

        {/* daca NU este logat */}
        {!loggedIn && (
          <>
            <button onClick={() => navigate("/auth")}>
              Login / Register
            </button>
          </> 
        )}

        {/* daca ESTE logat */}
        {loggedIn && (
          <>
            {/* afisam numele daca exista */}
            <span className="userText">
              {user?.name ? `Hello, ${user.name}` : "User"}
            </span>

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