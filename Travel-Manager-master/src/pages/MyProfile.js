import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, getCurrentUser } from "../services/authService";
import "./MyProfile.css";

function MyProfile() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [isEditing, setIsEditing] = useState(false);

  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    // daca nu este logat → redirect
    if (!isLoggedIn()) {
      navigate("/auth");
      return;
    }

    // temporar (pana ai backend)
    setTickets([]);
  }, [navigate]);

    // dupa backend implementat: POST /api/Tickets; GET /api/Tickets/my-tickets
    /*
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
    */

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
            <div className="ticket-card" key={ticket.id}>
              <p><strong>Attraction:</strong> {ticket.attractionName}</p>
              <p><strong>Entry date:</strong> {ticket.entryDate}</p>
              <p><strong>Total price:</strong> {ticket.totalPrice} RON</p>
            </div>
          ))
        )}

        <h3>Expired tickets</h3>

        {expiredTickets.length === 0 ? (
          <p>No expired tickets.</p>
        ) : (
          expiredTickets.map((ticket) => (
            <div className="ticket-card expired" key={ticket.id}>
              <p><strong>Attraction:</strong> {ticket.attractionName}</p>
              <p><strong>Entry date:</strong> {ticket.entryDate}</p>
              <p><strong>Total price:</strong> {ticket.totalPrice} RON</p>
            </div>
          ))
        )}

      </section>
    </div>
  );
}

export default MyProfile;