import Home from "./pages/Home";
import AttractionDetails from "./pages/AttractionDetails";
import Auth from "./pages/Auth";
import { BrowserRouter, Routes, Route } from "react-router-dom";

/**
 * Componenta principala a aplicatiei
 * Se ocupa de routing intre pagini
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pagina principala */}
        <Route path="/" element={<Home />} />

        {/* Pagina de detalii pentru o atractie */}
        <Route path="/attraction/:id" element={<AttractionDetails />} />

         {/* Pagina pentru autentificare */}
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;