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
  const [barcodes, setBarcodes] = useState({});

  // Mesaj profil (editare date personale)
  const [profileMessage, setProfileMessage] = useState({ text: "", success: false });

  // State pentru schimbarea parolei
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });
  const [passwordMessage, setPasswordMessage] = useState({ text: "", success: false });

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/auth");
      return;
    }

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

  const today = new Date().toISOString().split("T")[0];
  const activeTickets = tickets.filter((ticket) => ticket.entryDate >= today);
  const expiredTickets = tickets.filter((ticket) => ticket.entryDate < today);

  // --- Date personale ---
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    surname: user?.surname || "",
    email: user?.email || "",
    password: ""
  });

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    setProfileMessage({ text: "", success: false });

    const response = await fetch(`${API_URL}/api/User/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        name: profileData.name,
        surname: profileData.surname,
        email: profileData.email,
        password: profileData.password
      })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("user", JSON.stringify(data.user));
      setProfileMessage({ text: "Changes have been saved.", success: true });
      setIsEditing(false);
      setProfileData({ ...profileData, password: "" });
    } else {
      const errorText = await response.text();
      setProfileMessage({
        text: errorText.replace(/"/g, "") || "An error occurred. Please try again.",
        success: false
      });
    }
  };

  // --- Schimbare parolă ---
  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleChangePassword = async () => {
    setPasswordMessage({ text: "", success: false });

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordMessage({ text: "New passwords do not match.", success: false });
      return;
    }

    const response = await fetch(`${API_URL}/api/User/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
    });

    if (response.ok) {
      const data = await response.json();
      setPasswordMessage({ text: data.message, success: true });
      setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } else {
      const errorText = await response.text();
      setPasswordMessage({
        text: errorText.replace(/"/g, "") || "An error occurred.",
        success: false
      });
    }
  };

  // Componentă bilet (neschimbată)
  const TicketCard = ({ ticket, expired }) => (
    <div className={`ticket-card ${expired ? "expired" : ""}`}>
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

      {/* DATE PERSONALE */}
      <section className="profile-section">
        <h2>Personal data</h2>

        {profileMessage.text && (
          <p className={profileMessage.success ? "profile-msg-success" : "profile-msg-error"}>
            {profileMessage.text}
          </p>
        )}

        {!isEditing ? (
          <>
            <p><strong>Name:</strong> {user?.name || "Unknown"}</p>
            <p><strong>Email:</strong> {user?.email || "Unknown"}</p>
            <button
              className="edit-btn"
              onClick={() => {
                setIsEditing(true);
                setProfileMessage({ text: "", success: false });
              }}
            >
              Edit profile
            </button>
          </>
        ) : (
          <div className="profile-form">
            <label>Name</label>
            <input
              name="name"
              value={profileData.name}
              onChange={handleProfileChange}
            />
            <label>Surname</label>
            <input
              name="surname"
              value={profileData.surname}
              onChange={handleProfileChange}
            />
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={profileData.email}
              onChange={handleProfileChange}
            />
            <label>Confirm with password</label>
            <input
              name="password"
              type="password"
              placeholder="Enter your current password"
              value={profileData.password}
              onChange={handleProfileChange}
            />
            <div className="profile-actions">
              <button type="button" onClick={handleSaveProfile}>
                Save changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setProfileMessage({ text: "", success: false });
                  setProfileData({ ...profileData, password: "" });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* SCHIMBARE PAROLĂ */}
      <section className="profile-section">
        <h2>Change Password</h2>
        {passwordMessage.text && (
          <p className={passwordMessage.success ? "profile-msg-success" : "profile-msg-error"}>
            {passwordMessage.text}
          </p>
        )}
        <div className="profile-form">
          <label>Current password</label>
          <input
            name="currentPassword"
            type="password"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
          />
          <label>New password</label>
          <input
            name="newPassword"
            type="password"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
          />
          <label>Confirm new password</label>
          <input
            name="confirmNewPassword"
            type="password"
            value={passwordData.confirmNewPassword}
            onChange={handlePasswordChange}
          />
          <div className="profile-actions">
            <button type="button" onClick={handleChangePassword}>
              Change password
            </button>
            <button
              type="button"
              onClick={() => {
                setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
                setPasswordMessage({ text: "", success: false });
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </section>

      {/* BILETE */}
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