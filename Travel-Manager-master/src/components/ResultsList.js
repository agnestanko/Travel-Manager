import { useNavigate } from "react-router-dom";
import ResultCard from "./ResultCard";

function ResultsList({ results }) {
  const navigate = useNavigate();

  if (!results || results.length === 0) {
    return (
      <div className="resultsWrapper">
        <div className="noResultsMessage">
          <h3>No events found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="resultsWrapper">
      <div className="resultsList">
        {results.map((item) => (
          <ResultCard
            key={item.id}
            item={item}
            onClick={() => navigate(`/attraction/${item.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

export default ResultsList;