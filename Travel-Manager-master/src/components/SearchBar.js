import { useState, useEffect } from "react";
import "./SearchBar.css";
import { API_URL } from "../services/api";

function SearchBar({ setResults }) {
  const [query, setQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("none");
  const [showFilter, setShowFilter] = useState(false);

  const locations = ["Oradea", "Paris", "Bucuresti"];

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const params = new URLSearchParams();

        if (query.trim() !== "") params.append("query", query);
        if (minPrice !== "") params.append("minPrice", minPrice);
        if (maxPrice !== "") params.append("maxPrice", maxPrice);
        if (location !== "") params.append("location", location);
        if (sort !== "none") params.append("sort", sort);

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
  }, [query, minPrice, maxPrice, location, sort, setResults]);

  const toggleSort = () => {
    if (sort === "none" || sort === "desc") setSort("asc");
    else setSort("desc");
  };

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setLocation("");
    setQuery("");
    setSort("none");
  };

  return (
    <div className="wrapper">
      <div className="topRow">
        <input
          className="input"
          placeholder="Search events..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div
          className="dropdownWrapper"
          onMouseEnter={() => setShowFilter(true)}
          onMouseLeave={() => setShowFilter(false)}
        >
          <button type="button" className="iconBtn">Filter ▼</button>

          {showFilter && (
            <div className="dropdown">
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
                <label>Location</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="selectInput"
                >
                  <option value="">All locations</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
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
            </div>
          )}
        </div>

        <button
          type="button"
          className="iconBtn"
          onClick={toggleSort}
        >
          Sort by price {sort === "asc" ? "↑" : sort === "desc" ? "↓" : ""}
        </button>
      </div>
    </div>
  );
}

export default SearchBar;