import { useNavigate } from "react-router-dom";
import "./ResultCard.css";

/**
 * Componenta pentru afisarea unui rezultat individual
 * @param {Object} item - datele pentru un rezultat (name, location, price)
 * @param {Function} onClick - actiune la click pe card
 */
function ResultCard({ item, onClick }) {
  return (
    <div
      className="resultItem"
      onClick={onClick}
    >
      <h3 className="resultName">{item.name}</h3>

      <div className="resultDetails">
        <span>{item.location}</span>
        <span>{item.entryPrice} RON</span> 
      </div>
    </div>
  );
}

export default ResultCard;