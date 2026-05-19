import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./SearchBar.css";
import { API_URL } from "../services/api";

function SearchBar({ setResults }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "none");
  const [showFilter, setShowFilter] = useState(false);
  const types = ["Istoric", "Natură", "Relaxare", "Distracție"];

  const hasActiveFilters =
    query.trim() !== "" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    type !== "" ||
    sort !== "none";

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const params = new URLSearchParams();

        if (query.trim() !== "") params.append("query", query);
        if (minPrice !== "") params.append("minPrice", minPrice);
        if (maxPrice !== "") params.append("maxPrice", maxPrice);
        if (type !== "") params.append("type", type);
        if (sort !== "none") params.append("sort", sort);

        setSearchParams(params, { replace: true });

        const response = await fetch(`${API_URL}/api/Search?${params.toString()}`);

        if (!response.ok) {
          throw new Error("API error");
        }

        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error("Eroare la fetch:", error);
        setResults([]);
      }
    };

    fetchResults();
  }, [query, minPrice, maxPrice, type, sort, setResults, setSearchParams]);

  const toggleSort = () => {
    if (sort === "none" || sort === "desc") setSort("asc");
    else setSort("desc");
  };

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setType("");
    setQuery("");
    setSort("none");
  };

  return (
    <motion.div
      className="wrapper"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div className="topRow">
        <div className="searchInputWrapper">
          <span className="searchIcon">⌕</span>
          <input
            className="input"
            placeholder="Search attractions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div
          className="dropdownWrapper"
          onMouseEnter={() => setShowFilter(true)}
          onMouseLeave={() => setShowFilter(false)}
        >
          <motion.button
            type="button"
            className={`iconBtn ${showFilter ? "activeBtn" : ""}`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
          >
            Filter <span className="chevron">▼</span>
          </motion.button>

          <AnimatePresence>
            {showFilter && (
              <motion.div
                className="dropdown"
                initial={{ opacity: 0, y: -10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.96 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="filterSection">
                  <label>Price range</label>
                  <div className="priceRange">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="priceInput"
                    />

                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="priceInput"
                    />
                  </div>
                </div>

                <div className="filterSection">
                  <label>Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="selectInput"
                  >
                    <option value="">All types</option>
                    {types.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  className="clearBtn"
                  onClick={clearFilters}
                >
                  Clear all filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          type="button"
          className={`iconBtn ${sort !== "none" ? "activeBtn" : ""}`}
          onClick={toggleSort}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
        >
          Sort by price {sort === "asc" ? "↑" : sort === "desc" ? "↓" : ""}
        </motion.button>
      </div>

      {hasActiveFilters && (
        <motion.div
          className="activeFilters"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span>Active search</span>
          <button type="button" onClick={clearFilters}>
            Reset
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

export default SearchBar;