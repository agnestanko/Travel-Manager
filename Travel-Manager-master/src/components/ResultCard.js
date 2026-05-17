import { motion } from "framer-motion";
import "./ResultCard.css";

/**
 * Componenta pentru afisarea unui rezultat individual
 * @param {Object} item - datele pentru un rezultat (name, location, price)
 * @param {Function} onClick - actiune la click pe card
 */
function ResultCard({ item, onClick }) {
  return (
    <motion.div
      className="resultItem"
      onClick={onClick}
      variants={{
        hidden: { opacity: 0, y: 25 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <h3 className="resultName">{item.name}</h3>

      <div className="resultDetails">
        <span>{item.location}</span>
        <span>{item.entryPrice} RON</span>
      </div>
    </motion.div>
  );
}

export default ResultCard;