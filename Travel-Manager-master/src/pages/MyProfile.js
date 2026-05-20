import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { isLoggedIn, getCurrentUser } from "../services/authService";
import { API_URL } from "../services/api";
import "./MyProfile.css";

function MyProfile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [isEditing, setIsEditing] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [barcodes, setBarcodes] = useState({});

  const [profileMessage, setProfileMessage] = useState({
    text: "",
    success: false
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });

  const [passwordMessage, setPasswordMessage] = useState({
    text: "",
    success: false
  });

  const [profileData, setProfileData] = useState({
    name: currentUser?.name || "",
    surname: currentUser?.surname || "",
    email: currentUser?.email || "",
    password: ""
  });

  const buildImageUrl = (path) => {
    if (!path) return "/placeholder.jpg";

    if (path.startsWith("http")) {
      return path;
    }

    return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  };

    useEffect(() => {
      if (!isLoggedIn()) {
        navigate("/auth");
        return;
      }

      if (currentUser?.isAdmin) {
        setTickets([]);
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
    }, [navigate, currentUser]);

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
      setCurrentUser(data.user);

      setProfileMessage({
        text: "Changes have been saved.",
        success: true
      });

      setIsEditing(false);

      setProfileData({
        name: data.user.name || "",
        surname: data.user.surname || "",
        email: data.user.email || "",
        password: ""
      });
    } else {
      const errorText = await response.text();

      setProfileMessage({
        text: errorText.replace(/"/g, "") || "An error occurred. Please try again.",
        success: false
      });
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleChangePassword = async () => {
    setPasswordMessage({ text: "", success: false });

    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmNewPassword
    ) {
      setPasswordMessage({
        text: "Please complete all password fields.",
        success: false
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordMessage({
        text: "New passwords do not match.",
        success: false
      });
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

      setPasswordMessage({
        text: data.message,
        success: true
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
      });
    } else {
      const errorText = await response.text();

      setPasswordMessage({
        text: errorText.replace(/"/g, "") || "An error occurred.",
        success: false
      });
    }
  };

  const TicketCard = ({ ticket, expired }) => (
    <motion.div
      className={`ticket-card ${expired ? "expired" : ""}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      whileHover={{ y: -6 }}
    >
      {ticket.firstImage && (
        <img
          src={buildImageUrl(ticket.firstImage)}
          alt={ticket.attractionName}
          className="ticket-image"
        />
      )}

      <div className="ticket-info">
        <div>
          <span className="ticket-status">
            {expired ? "Expired ticket" : "Active ticket"}
          </span>
          <h3 className="ticket-attraction">{ticket.attractionName}</h3>
        </div>

        <div className="ticket-details-grid">
          <p><strong>Entry date:</strong> {ticket.entryDate}</p>
          <p><strong>Purchase date:</strong> {ticket.dateOfPurchase}</p>
          <p><strong>Price:</strong> {ticket.pricePerTicket} RON</p>
        </div>

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
    </motion.div>
  );

  return (
    <motion.div
      className="profile-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
    >
      <div className="profile-container">
        <motion.button
          className="back-btn"
          onClick={() => navigate("/")}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          ← Back to Home
        </motion.button>

        <motion.div
          className="profile-hero"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="profile-kicker">Account center</span>
          <h1 className="profile-title">My Profile</h1>
          <p>
            Manage your personal data, password and purchased tickets in one place.
          </p>
        </motion.div>

        <motion.section
          className="profile-section"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <div className="section-title-row">
            <div>
              <span className="section-label">Personal data</span>
              <h2>Account information</h2>
            </div>
          </div>

          {profileMessage.text && (
            <p className={profileMessage.success ? "profile-msg-success" : "profile-msg-error"}>
              {profileMessage.text}
            </p>
          )}

          {!isEditing ? (
            <>
              <div className="profile-data-list">
                <div className="profile-data-item">
                  <div className="profile-data-icon">👤</div>
                  <div>
                    <span>Name</span>
                    <strong>{currentUser?.name || "Unknown"}</strong>
                  </div>
                </div>

                <div className="profile-data-item">
                  <div className="profile-data-icon">🪪</div>
                  <div>
                    <span>Surname</span>
                    <strong>{currentUser?.surname || "Unknown"}</strong>
                  </div>
                </div>

                <div className="profile-data-item">
                  <div className="profile-data-icon">✉️</div>
                  <div>
                    <span>Email</span>
                    <strong>{currentUser?.email || "Unknown"}</strong>
                  </div>
                </div>
              </div>

              <motion.button
                className="edit-btn"
                onClick={() => {
                  setIsEditing(true);
                  setProfileMessage({ text: "", success: false });
                }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                Edit profile
              </motion.button>
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
                <motion.button
                  type="button"
                  className="primary-action-btn"
                  onClick={handleSaveProfile}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Save changes
                </motion.button>

                <button
                  type="button"
                  className="secondary-action-btn"
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
        </motion.section>

        <motion.section
          className="profile-section"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, delay: 0.05, ease: "easeOut" }}
        >
          <div className="section-title-row">
            <div>
              <span className="section-label">Security</span>
              <h2>Change password</h2>
            </div>
          </div>

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
              <motion.button
                type="button"
                className="primary-action-btn"
                onClick={handleChangePassword}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                Change password
              </motion.button>

              <button
                type="button"
                className="secondary-action-btn"
                onClick={() => {
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmNewPassword: ""
                  });
                  setPasswordMessage({ text: "", success: false });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.section>

          {!currentUser?.isAdmin && (
          <motion.section
            className="profile-section tickets-section"
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
          >
            <div className="section-title-row">
              <div>
                <span className="section-label">Travel wallet</span>
                <h2>My Tickets</h2>
              </div>
            </div>

            <div className="ticket-group">
              <h3>Active tickets</h3>

              {activeTickets.length === 0 ? (
                <p className="empty-ticket-message">No active tickets.</p>
              ) : (
                activeTickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} expired={false} />
                ))
              )}
            </div>

            <div className="ticket-group">
              <h3>Expired tickets</h3>

              {expiredTickets.length === 0 ? (
                <p className="empty-ticket-message">No expired tickets.</p>
              ) : (
                expiredTickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} expired={true} />
                ))
              )}
            </div>
          </motion.section>
        )}
      </div>
    </motion.div>
  );
}

export default MyProfile;