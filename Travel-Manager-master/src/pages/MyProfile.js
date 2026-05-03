import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, getCurrentUser } from "../services/authService";
import { API_URL } from "../services/api";
import "./MyProfile.css";

function MyProfile() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [isEditing, setIsEditing] = useState(false);

  const [tickets, setTickets] = useState([]);

  // Map de { ticketId → barcodeObjectURL }
  // Folosim blob URL-uri ca sa putem trimite header-ul de autorizare la fetch
  const [barcodes, setBarcodes] = useState({});

  useEffect(() => {
    // daca nu este logat → redirect
    if (!isLoggedIn()) {
      navigate("/auth");
      return;
    }

    // dupa backend implementat: POST /api/Tickets/buy; GET /api/Tickets/my-tickets
    const fetchTickets = async () => {
      const response = await fetch(`${API_URL}/api/Tickets/my-tickets`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    };

    fetchTickets();
  }, [navigate]);

  // Dupa ce se incarca biletele, fetch-uim barcode-ul fiecaruia ca blob
  // Folosim blob URL-uri deoarece tag-ul <img> nu poate trimite Authorization header direct
  useEffect(() => {
    if (tickets.length === 0) return;

    const fetchBarcodes = async () => {
      const token = localStorage.getItem("token");
      const barcodeMap = {};

      for (const ticket of tickets) {
        try {
          const res = await fetch(`${API_URL}/api/Tickets/${ticket.id}/barcode`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const blob = await res.blob();
            barcodeMap[ticket.id] = URL.createObjectURL(blob);
          }
        } catch (err) {
          console.error(`Error loading barcode for ticket ${ticket.id}:`, err);
        }
      }

      setBarcodes(barcodeMap);
    };

    fetchBarcodes();
  }, [tickets]);

  // data curenta pentru separare active/expired
  const today = new Date().toISOString().split("T")[0];

  const activeTickets = tickets.filter(
    (ticket) => ticket.entryDate >= today
  );

  const expiredTickets = tickets.filter(
    (ticket) => ticket.entryDate < today
  );

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || ""
  });

  // Componenta pentru un card de bilet
  const TicketCard = ({ ticket, expired }) => (
    <div className={`ticket-card ${expired ? "expired" : ""}`}>
      {/* Imaginea atractiei */}
      {ticket.firstImage && (
        <img
          src={`${API_URL}/${ticket.firstImage}`}
          alt={ticket.attractionName}
          className="ticket-image"
        />
      )}

      <div className="ticket-info">
        <h3 className="ticket-attraction">{ticket.attractionName}</h3>

        <p><strong>Entry date:</strong> {ticket.entryDate}</p>
        <p><strong>Purchase date:</strong> {ticket.dateOfPurchase}</p>
        <p><strong>Price:</strong> {ticket.pricePerTicket} RON</p>
        <p className="ticket-code">
          <strong>Code:</strong> TKT-{String(ticket.id).padStart(6, "0")}
        </p>

        {/* Codul de bare generat de backend */}
        {barcodes[ticket.id] ? (
          <img
            src={barcodes[ticket.id]}
            alt={`Barcode for ticket ${ticket.id}`}
            className="ticket-barcode"
          />
        ) : (
          <p className="ticket-barcode-loading">Loading barcode...</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="profile-container">

      <button className="back-btn" onClick={() => navigate("/")}>
        Back to Home
      </button>

      <h1 className="profile-title">My Profile</h1>

      {/* PERSONAL DATA */}
      {/* Backend: PUT /api/User/profile; [Authorize] */}
      <section className="profile-section">
        <h2>Personal data</h2>

        {!isEditing ? (
          <>
            <p><strong>Name:</strong> {user?.name || "Unknown"}</p>
            <p><strong>Email:</strong> {user?.email || "Unknown"}</p>

            <button
              className="edit-btn"
              onClick={() => setIsEditing(true)}
            >
              Edit profile
            </button>
          </>
        ) : (
          <form className="profile-form">
            <label>Name</label>
            <input
              name="name"
              value={profileData.name}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  name: e.target.value
                })
              }
            />

            <label>Email</label>
            <input
              name="email"
              type="email"
              value={profileData.email}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  email: e.target.value
                })
              }
            />

            <div className="profile-actions">
              <button type="button">
                Save changes
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* TICKETS */}
      <section className="profile-section">
        <h2>My Tickets</h2>

        <h3>Active tickets</h3>

        {activeTickets.length === 0 ? (
          <p>No active tickets.</p>
        ) : (
          activeTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} expired={false} />
          ))
        )}

        <h3>Expired tickets</h3>

        {expiredTickets.length === 0 ? (
          <p>No expired tickets.</p>
        ) : (
          expiredTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} expired={true} />
          ))
        )}

      </section>
    </div>
  );
}

export default MyProfile;