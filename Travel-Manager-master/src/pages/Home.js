import SearchBar from "../components/SearchBar";
import ResultsList from "../components/ResultsList";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

// Astept backend
import img1 from "../assets/gallery1.jpeg";
import img2 from "../assets/gallery2.jpeg";
import img3 from "../assets/gallery3.jpeg";

function Home() {
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const allAttractionsGallery = [
    { id: 1, title: "Aquapark Nymphaea", image: img1 },
    { id: 2, title: "Adventure Park", image: img2 },
    { id: 3, title: "City Experience", image: img3 }
  ];

  return (
    <div className="home-page">
      <div className="home-search-container">
        <SearchBar setResults={setResults} />
        <ResultsList results={results} />
      </div>

      <section className="home-gallery-section">
        <h2>Explore attractions</h2>

        <div className="home-gallery-grid">
          {allAttractionsGallery.map((item) => (
            <div
              className="home-gallery-card"
              key={item.id}
              onClick={() => navigate(`/attraction/${item.id}`)}
            >
              <img src={item.image} alt={item.title} />
              <p>{item.title}</p>
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