import SearchBar from "../components/SearchBar";
import ResultsList from "../components/ResultsList";

// Import hook pentru state
import { useState } from "react";

/**
 * Pagina principala a aplicatiei
 * Gestioneaza rezultatele cautarii si afiseaza componentele principale
 */
function Home() {
  // State pentru rezultatele returnate din SearchBar
  const [results, setResults] = useState([]);

  return (
    <div>
      {/* Container principal pentru cautare si rezultate */}
      <div style={styles.container}>
        
        {/* Componenta de cautare - trimite rezultate in state */}
        <SearchBar setResults={setResults} />

        {/* Lista de rezultate */}
        <ResultsList results={results} />
      </div>

      {/* Sectiune pentru continut viitor */}
      <div style={{ marginTop: "200px", textAlign: "center" }}>
        <h2>Why choose us ...</h2>
      </div>
    </div>
  );
}

// Stiluri inline pentru container
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "15px",
    marginTop: "30px"
  }
};

export default Home;