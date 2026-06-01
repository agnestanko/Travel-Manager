import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./SearchBar.css";
import { API_URL } from "../services/api";

function SearchBar({ setResults, setSearchLoading }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [debouncedQuery, setDebouncedQuery] = useState(
    searchParams.get("query") || "",
  );
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "none");
  const [showFilter, setShowFilter] = useState(false);
  const types = ["Historical", "Nature", "Relaxation", "Entertainment"];

  const hasActiveFilters =
    query.trim() !== "" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    type !== "" ||
    sort !== "none";

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(query);
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchResults = async () => {
      setSearchLoading?.(true);

      try {
        const urlParams = new URLSearchParams();
        const apiParams = new URLSearchParams();

        const trimmedQuery = debouncedQuery.trim();

        // URL params: pastram ce vede userul in pagina
        if (query.trim() !== "") {
          urlParams.append("query", query.trim());
        }

        if (minPrice !== "") {
          urlParams.append("minPrice", minPrice);
          apiParams.append("minPrice", minPrice);
        }

        if (maxPrice !== "") {
          urlParams.append("maxPrice", maxPrice);
          apiParams.append("maxPrice", maxPrice);
        }

        if (type !== "") {
          urlParams.append("type", type);
          apiParams.append("type", type);
        }

        if (sort !== "none") {
          urlParams.append("sort", sort);
          apiParams.append("sort", sort);
        }

        // API params: trimitem query doar daca are minimum 3 caractere
        if (trimmedQuery.length >= 3) {
          apiParams.append("query", trimmedQuery);
        }

        setSearchParams(urlParams, { replace: true });

        const response = await fetch(
          `${API_URL}/api/Search?${apiParams.toString()}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("API error");
        }

        const data = await response.json();
        setResults(data);
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        console.error("Eroare la fetch:", error);
        setResults([]);
      } finally {
        setSearchLoading?.(false);
      }
    };

    fetchResults();

    return () => controller.abort();
  }, [
    query,
    debouncedQuery,
    minPrice,
    maxPrice,
    type,
    sort,
    setResults,
    setSearchParams,
    setSearchLoading,
  ]);

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
