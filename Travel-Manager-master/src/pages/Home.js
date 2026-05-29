import SearchBar from "../components/SearchBar";
import ResultsList from "../components/ResultsList";
import MotionSection from "../components/MotionSection";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../services/api";
import "./Home.css";

function Home() {
  const [results, setResults] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const galleryRef = useRef(null);

  const navigate = useNavigate();

  const buildImageUrl = (path) => {
    if (!path) return "/placeholder.jpg";

    if (path.startsWith("http")) {
      return path;
    }

    return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const scrollGallery = (direction) => {
    if (!galleryRef.current) return;

    const scrollAmount = 320;

    galleryRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        // Ambele fetch-uri simultan
        const [searchRes, popularRes] = await Promise.all([
          fetch(`${API_URL}/api/Search`),
          fetch(`${API_URL}/api/home/popular`)
        ]);

        if (!searchRes.ok) throw new Error("Failed to fetch attractions");

        const [searchData, popularData] = await Promise.all([
          searchRes.json(),
          popularRes.ok ? popularRes.json() : Promise.resolve([])
        ]);

        setResults(searchData);
        setPopular(popularData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-blob hero-blob-one" />
        <div className="hero-blob hero-blob-two" />

        <motion.div
          className="home-hero-content"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: "easeOut" }}
        >
          <motion.p
            className="hero-kicker"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
          >
            Discover. Plan. Travel.
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7 }}
          >
            Plan less. Travel more.
          </motion.h1>

          <motion.p
            className="hero-description"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
          >
            Find attractions, check availability and manage your travel
            experience in one modern platform.
          </motion.p>
        </motion.div>
      </section>

      <MotionSection delay={0.1} className="home-search-container">
        <SearchBar setResults={setResults} />
        <ResultsList results={results} />
      </MotionSection>

      <MotionSection className="home-gallery-section">
        <div className="section-heading">
          <span>Explore</span>
          <h2>Popular attractions</h2>
          <p>Choose your next experience from our curated travel spots.</p>
        </div>

        {loading && <p className="status-message">Loading attractions...</p>}
        {error && <p className="error">{error}</p>}

        <div className="gallery-scroll-section">
          <button
            type="button"
            className="gallery-scroll-btn gallery-scroll-left"
            onClick={() => scrollGallery("left")}
            aria-label="Scroll popular attractions left"
          >
            ‹
          </button>

          <div className="home-gallery-grid" ref={galleryRef}>
            {popular.slice(0, 8).map((item, index) => (
              <motion.div
                className="home-gallery-card"
                key={item.id}
                onClick={() => navigate(`/attraction/${item.id}`)}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: index * 0.08 }}
                whileHover={{ y: -10, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="gallery-image-wrapper">
                  <img
                    src={
                      item.firstImage
                        ? buildImageUrl(item.firstImage)
                        : "/placeholder.jpg"
                    }
                    alt={item.name}
                  />
                </div>

                <div className="gallery-card-content">
                  <p>{item.name}</p>
                  <span>View details</span>
                </div>
              </motion.div>
            ))}
          </div>

          <button
            type="button"
            className="gallery-scroll-btn gallery-scroll-right"
            onClick={() => scrollGallery("right")}
            aria-label="Scroll popular attractions right"
          >
            ›
          </button>
        </div>
      </MotionSection>

      <MotionSection className="home-info-section">
        <div className="section-heading">
          <span>About us</span>
          <h2>Why choose The Travelers?</h2>
          <p>
            We make travel planning simpler by bringing attractions, tickets and
            personal trip management into one clean experience.
          </p>
        </div>

        <div className="about-grid">
          <motion.div className="about-card" whileHover={{ y: -8 }}>
            <h3>Discover</h3>
            <p>
              Explore handpicked destinations and turn simple ideas into
              unforgettable travel plans.
            </p>
          </motion.div>

          <motion.div className="about-card" whileHover={{ y: -8 }}>
            <h3>Book</h3>
            <p>
              Reserve your spot with ease and manage every ticket directly from
              your profile.
            </p>
          </motion.div>

          <motion.div className="about-card" whileHover={{ y: -8 }}>
            <h3>Enjoy</h3>
            <p>
              Focus on the journey while The Travelers keeps your experience
              simple and organized.
            </p>
          </motion.div>
        </div>
      </MotionSection>
    </div>
  );
}

export default Home;