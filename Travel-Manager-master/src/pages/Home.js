import SearchBar from "../components/SearchBar";
import ResultsList from "../components/ResultsList";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../services/api";
import "./Home.css";

function Home() {
  const [results, setResults] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/home`);

        if (!response.ok) {
          throw new Error("Failed to fetch attractions");
        }

        const data = await response.json();
        setGallery(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, []);

  return (
    <div className="home-page">
      <div className="home-search-container">
        <SearchBar setResults={setResults} />
        <ResultsList results={results} />
      </div>

      <section className="home-gallery-section">
        <h2>Explore attractions</h2>

        {loading && <p>Loading attractions...</p>}
        {error && <p className="error">{error}</p>}

        <div className="home-gallery-grid">
          {gallery.map((item) => (
            <div
              className="home-gallery-card"
              key={item.id}
              onClick={() => navigate(`/attraction/${item.id}`)}
            >
              <img
                src={
                  item.firstImage
                    ? `${API_URL}/${item.firstImage}`
                    : "https://via.placeholder.com/300"
                }
                alt={item.name}
              />
              <p>{item.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-info-section">
        <h2>Why choose us ...</h2>
      </section>
    </div>
  );
}

export default Home;