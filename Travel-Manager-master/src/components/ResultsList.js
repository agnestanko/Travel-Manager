import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ResultCard from "./ResultCard";

function ResultsList({ results }) {
  const navigate = useNavigate();

  if (!results || results.length === 0) {
    return (
      <motion.div
        className="resultsWrapper"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        <div className="noResultsMessage">
          <h3>No events found</h3>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="resultsWrapper">
      <motion.div
        className="resultsList"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.08
            }
          }
        }}
      >
        {results.map((item) => (
          <ResultCard
            key={item.id}
            item={item}
            onClick={() => navigate(`/attraction/${item.id}`)}
          />
        ))}
      </motion.div>
    </div>
  );
}

export default ResultsList;