import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./AttractionDetails.css";
import { isLoggedIn, getCurrentUser } from "../services/authService";
import { API_URL } from "../services/api";
import ImageGallery from "../components/ImageGallery";

// ==============================
// Componenta calendar custom
// Afiseaza o luna, marcand cu albastru zilele disponibile
// ==============================
function AvailabilityCalendar({ availableDates, selectedDate, onSelectDate }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  // Setul de date disponibile pentru comparatie rapida (format "yyyy-MM-dd")
  const availableSet = new Set(availableDates);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  // Construieste grila de zile pentru luna afisata
  const buildCalendarDays = () => {
    // Prima zi a lunii (0=Duminica, 1=Luni...)
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    // Numarul de zile din luna
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    // Offset pentru ca grila sa inceapa de Luni (ISO)
    const offset = (firstDay + 6) % 7;

    const days = [];

    // Celule goale la inceput
    for (let i = 0; i < offset; i++) {
      days.push(null);
    }

    // Zilele lunii
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }

    return days;
  };

  const days = buildCalendarDays();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const formatDate = (day) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${viewYear}-${mm}-${dd}`;
  };

  return (
    <div className="calendar">
      {/* Header: luna + butoane prev/next */}
      <div className="calendar-header">
        <button type="button" onClick={prevMonth}>&#8249;</button>
        <span>{monthNames[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth}>&#8250;</button>
      </div>

      {/* Zilele saptamanii */}
      <div className="calendar-days-of-week">
        {dayNames.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      {/* Grila zilelor */}
      <div className="calendar-grid">
        {days.map((day, index) => {
          if (!day) {
            // Celula goala (offset la inceput de luna)
            return <div key={`empty-${index}`} className="calendar-day" />;
          }

          const dateStr = formatDate(day);
          const isAvailable = availableSet.has(dateStr);
          const isSelected = selectedDate === dateStr;

          let className = "calendar-day current-month";
          if (isAvailable) className += " available";
          if (isSelected) className += " selected";

          return (
            <button
              key={dateStr}
              type="button"
              className={className}
              onClick={() => isAvailable && onSelectDate(dateStr)}
              title={isAvailable ? dateStr : ""}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ==============================
// Pagina principala AttractionDetails
// ==============================
function AttractionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [attraction, setAttraction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [related, setRelated] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  //const [unavailableDates, setUnavailableDates] = useState([]);
  //PAS 3 (viitor)-> calendar custom (highlight zile) - IMPLEMENTAT

  // Stare pentru pop-up de succes dupa cumparare
  const [showSuccess, setShowSuccess] = useState(false);

  // Stare pentru erori returnate de backend (ex: capacitate depasita)
  const [buyError, setBuyError] = useState("");

  const user = getCurrentUser();

  // Stocăm URL-urile imaginilor extrase din baza de date
  const [images, setImages] = useState([]);

  //Input pentru BuyTicketForm -> functii handle -> implementare logica in backend; POST /api/Tickets/buy
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    tickets: 1,
    entryDate: ""
  });

  useEffect(() => {
    const fetchAttraction = async () => {
      try {
        const response = await fetch(`${API_URL}/api/Attraction/${id}`); // << folosește controller-ul corect

        if (!response.ok) throw new Error("API error");

        const attractionData = await response.json(); // direct obiectul, nu array
        setAttraction(attractionData);

        // După ce am primit atracția, extragem imaginile
        if (attractionData && attractionData.images) {
          const imageUrls = attractionData.images.map(img => `${API_URL}/${img.imagePath}`);
          setImages(imageUrls);
        } else {
          setImages([]);
        }
      } catch (error) {
        console.error("Error loading attraction:", error);
      }
    };

    fetchAttraction();
  }, [id]);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const response = await fetch(`${API_URL}/api/relatedattractions/${id}?count=3`);
        if (!response.ok) throw new Error("Failed to fetch related");
        const data = await response.json();
        // Transformă datele pentru afișare
        const items = data.map(item => ({
          id: item.id,
          title: item.name,
          image: item.firstImage
            ? `${API_URL}/${item.firstImage}`
            : "https://via.placeholder.com/300"
        }));
        setRelated(items);
      } catch (err) {
        console.error("Error loading related attractions:", err);
        setRelated([]);
      }
    };

    if (id) fetchRelated();
  }, [id]);

  // Fetch available dates din baza de date pentru atractia curenta
  // Returneaza doar datele viitoare (>= azi), sortate crescator
  useEffect(() => {
    const fetchDates = async () => {
      try {
        const response = await fetch(`${API_URL}/api/Attraction/${id}/available-dates`);
        if (!response.ok) throw new Error("Failed to fetch dates");
        const data = await response.json();
        setAvailableDates(data);
      } catch (err) {
        console.error("Error loading available dates:", err);
        setAvailableDates([]);
      }
    };

    if (id) fetchDates();
  }, [id]);

  if (!attraction) return <p>Attraction not found.</p>;

  const price = Number(attraction.entryPrice) || 0;
  const totalPrice = price * Number(formData.tickets);

  // Imaginile atracției vin din baza de date; dacă nu există, folosim un placeholder
  const attractionImages = images.length > 0 ? images : ["/placeholder.jpg"];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: name === "tickets" ? Number(value) : value
    });
  };

  // Callback primit de la calendar cand utilizatorul selecteaza o data disponibila
  const handleDateSelect = (dateStr) => {
    setFormData({ ...formData, entryDate: dateStr });
    setBuyError(""); // resetam eroarea la schimbarea datei
  };

  const handleBuyTicket = () => {
    if (!isLoggedIn()) {
      navigate("/auth");
      return;
    }

    setBuyError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validare: nu se poate cumpara fara o data valida selectata
    if (!formData.entryDate || !availableDates.includes(formData.entryDate)) {
      setBuyError("Please select a valid entry date from the calendar.");
      return;
    }

    // POST /api/Tickets/buy cu autentificare JWT
    const response = await fetch(`${API_URL}/api/Tickets/buy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        attractionId: Number(id),
        quantity: formData.tickets,
        entryDate: formData.entryDate
      })
    });

    if (response.ok) {
      // Inchidem modalul de cumparare si afisam pop-up de succes
      setShowModal(false);
      setShowSuccess(true);
      // Resetam formularul
      setFormData({ ...formData, entryDate: "", tickets: 1 });
    } else {
      // Afisam eroarea returnata de backend (ex: capacitate depasita)
      const errorText = await response.text();
      setBuyError(errorText || "Purchase failed. Please try again.");
    }
  };

  return (
    <div className="details-container">
      <div className="details-page">
        <div className="details-layout">

          {/* GALERIE STANGA */}
          <div className="details-gallery">
            <ImageGallery images={attractionImages} />
          </div>

          {/* DETALII DREAPTA */}
          <div className="details-info">
            <button onClick={() => navigate(-1)}>Back</button>

            <h1>{attraction.name}</h1>
            <p>{attraction.location}</p>
            <p>{attraction.description}</p>
            <p>{price} RON</p>

            <button onClick={handleBuyTicket}>
              Buy ticket
            </button>
          </div>

        </div>

        <aside className="related-sidebar">
          <h3>Related attractions</h3>

          <div className="related-list">
            {related.map((item) => (
              <div
                className="related-card"
                key={item.id}
                onClick={() => navigate(`/attraction/${item.id}`)}
              >
                <img src={item.image} alt={item.title} />
                <p>{item.title}</p>
              </div>
            ))}
          </div>
        </aside>

        {/* MODAL CUMPARARE BILET */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Buy ticket</h2>

              <form onSubmit={handleSubmit} className="form">
                <input
                  name="fullName"
                  placeholder="Full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />

                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

                {/* Calendar custom cu datele disponibile marcate cu albastru */}
                <label>Entry date</label>
                <AvailabilityCalendar
                  availableDates={availableDates}
                  selectedDate={formData.entryDate}
                  onSelectDate={handleDateSelect}
                />

                {/* Mesaj de hint daca nu s-a selectat o data */}
                {!formData.entryDate && (
                  <p className="formHint">
                    Please select an entry date from the calendar.
                  </p>
                )}
                {formData.entryDate && (
                  <p style={{ color: "#007bff", fontSize: "14px", margin: 0 }}>
                    Selected: {formData.entryDate}
                  </p>
                )}

                <label>Number of tickets</label>
                <input
                  type="number"
                  name="tickets"
                  min="1"
                  value={formData.tickets}
                  onChange={handleChange}
                  required
                />

                <label>Price</label>
                <input value={`${price} RON`} readOnly />

                <label>Total price</label>
                <input value={`${totalPrice} RON`} readOnly />

                {/* Eroare returnata de backend (ex: capacitate depasita, data invalida) */}
                {buyError && (
                  <p className="formHint">{buyError}</p>
                )}

                {/* Butonul de confirmare este dezactivat daca nu s-a selectat o data valida */}
                <button
                  type="submit"
                  disabled={!formData.entryDate}
                  style={{
                    opacity: !formData.entryDate ? 0.5 : 1,
                    cursor: !formData.entryDate ? "not-allowed" : "pointer"
                  }}
                >
                  Confirm purchase
                </button>

                <p className="paymentInfo">
                  Card only payment
                </p>

                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}

        {/* POP-UP SUCCES dupa cumparare */}
        {showSuccess && (
          <div className="modal-overlay" onClick={() => setShowSuccess(false)}>
            <div className="modal success-modal" onClick={(e) => e.stopPropagation()}>
              <div className="success-icon">✓</div>
              <h2>Tickets purchased!</h2>
              <p>Your tickets have been successfully purchased.</p>
              <p>You can view them in your profile.</p>
              <button
                className="success-btn"
                onClick={() => navigate("/profile")}
              >
                Go to My Profile
              </button>
              <button
                style={{ marginTop: "8px" }}
                onClick={() => setShowSuccess(false)}
              >
                Stay on this page
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default AttractionDetails;