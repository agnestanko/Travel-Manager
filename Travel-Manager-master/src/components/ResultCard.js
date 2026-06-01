import { motion } from "framer-motion";
import { API_URL } from "../services/api";
import "./ResultCard.css";

/**
 * Componenta pentru afisarea unui rezultat individual
 * @param {Object} item - datele pentru un rezultat
 * @param {Function} onClick - actiune la click pe card
 */
function ResultCard({ item, onClick }) {
  /**
   * Construieste URL-ul complet pentru imagine.
   * Daca backend-ul trimite o cale relativa, adaugam API_URL.
   */
  const buildImageUrl = (path) => {
    if (!path) return "/placeholder.jpg";

    if (path.startsWith("http")) {
      return path;
    }

    return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  };

  // Backend-ul trimite prima imagine in campul firstImage
  const imageUrl = item.firstImage
    ? buildImageUrl(item.firstImage)
    : "/placeholder.jpg";

  return (
    <motion.div
      className="resultItem"
      onClick={onClick}
      variants={{
        hidden: { opacity: 0, y: 25 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      <img
        className="resultImage"
        src={imageUrl}
        alt={item.name}
        loading="lazy"
        onError={(event) => {
          event.currentTarget.src = "/placeholder.jpg";
        }}
      />

      <div className="resultContent">
        <h3 className="resultName">{item.name}</h3>

        <div className="resultDetails">
          <span>{item.location}</span>
          <span>{item.entryPrice} RON</span>
        </div>
      </div>
    </motion.div>
  );
}

export default ResultCard;