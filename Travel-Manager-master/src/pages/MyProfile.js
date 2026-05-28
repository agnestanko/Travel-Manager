import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { isLoggedIn, getCurrentUser } from "../services/authService";
import { API_URL } from "../services/api";
import "./MyProfile.css";

function MyProfile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [isEditing, setIsEditing] = useState(false);

  const TICKETS_PAGE_SIZE = 10;

  const [tickets, setTickets] = useState([]);
  const [ticketPage, setTicketPage] = useState(1);
  const [totalTicketPages, setTotalTicketPages] = useState(1);
  const [hasMoreTickets, setHasMoreTickets] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const [barcodes, setBarcodes] = useState({});
  const [loadingBarcodes, setLoadingBarcodes] = useState({});

  // Cancel ticket states
  const [cancelTicketId, setCancelTicketId] = useState(null);
  const [showCancelSuccess, setShowCancelSuccess] = useState(false);
  const [canceledTicketName, setCanceledTicketName] = useState("");
  const [canceledTicketPrice, setCanceledTicketPrice] = useState(0);

  // Delete account states
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleteRefundAmount, setDeleteRefundAmount] = useState(0);

  // Calendar state
  const now = new Date();
  const [calendarDate, setCalendarDate] = useState({ year: now.getFullYear(), month: now.getMonth() });

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
    if (path.startsWith("http")) return path;
    return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  };

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/auth");
      return;
    }

    if (currentUser?.isAdmin) {
      setTickets([]);
      setHasMoreTickets(false);
      return;
    }

    const fetchTickets = async () => {
      setLoadingTickets(true);

      try {
        const response = await fetch(
          `${API_URL}/api/Tickets/my-tickets?page=${ticketPage}&pageSize=${TICKETS_PAGE_SIZE}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();

          setTickets((prev) => {
            const existingIds = new Set(prev.map((ticket) => ticket.id));
            const newItems = (data.items || []).filter(
              (ticket) => !existingIds.has(ticket.id)
            );

            return [...prev, ...newItems];
          });

          setTotalTicketPages(data.totalPages || 1);
          setHasMoreTickets(ticketPage < (data.totalPages || 1));
        }
      } catch (err) {
        console.error("Error loading tickets:", err);
      } finally {
        setLoadingTickets(false);
      }
    };

    fetchTickets();
  }, [navigate, currentUser, ticketPage]);

  //am sters useeffect ...  if (tickets.length === 0) return;

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
      setProfileMessage({ text: "Changes have been saved.", success: true });
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

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordMessage({ text: "Passwords do not match.", success: false });
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
      setPasswordMessage({ text: "Password changed successfully.", success: true });
      setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } else {
      const errorText = await response.text();
      setPasswordMessage({
        text: errorText.replace(/"/g, "") || "An error occurred. Please try again.",
        success: false
      });
    }
  };

  // Cancel ticket handler
  const handleCancelTicket = async () => {
    if (!cancelTicketId) return;

    const ticket = tickets.find((t) => t.id === cancelTicketId);

    try {
      const response = await fetch(`${API_URL}/api/Tickets/${cancelTicketId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.ok) {
        setCanceledTicketName(ticket?.attractionName || "");
        setCanceledTicketPrice(ticket?.pricePerTicket || 0);
        setTickets((prev) => prev.filter((t) => t.id !== cancelTicketId));
        setCancelTicketId(null);
        setShowCancelSuccess(true);
      }
    } catch (err) {
      console.error("Error canceling ticket:", err);
    }
  };



  // Delete account handler
  const handleDeleteAccount = async () => {
    try {
      const response = await fetch(`${API_URL}/api/User/delete-account`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ password: deletePassword })
      });

      if (response.ok) {
        const data = await response.json();
        setDeleteRefundAmount(data.refundAmount || 0);
        setShowDeleteConfirm(false);
        setShowDeleteSuccess(true);
      } else {
        const errorText = await response.text();
        setDeletePasswordError(errorText.replace(/"/g, "") || "Incorrect password.");
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      console.error("Error deleting account:", err);
    }
  };

  const handleDeleteSuccessClose = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth");
  };

  // Group tickets by date for the calendar
  const ticketsByDate = useMemo(() => {
    const map = {};
    tickets.forEach((ticket) => {
      const date = ticket.entryDate;
      if (!map[date]) map[date] = {};
      const key = ticket.attractionName;
      if (!map[date][key]) {
        map[date][key] = { attractionName: ticket.attractionName, location: ticket.location || "", count: 0 };
      }
      map[date][key].count += 1;
    });
    // Convert nested objects to arrays
    const result = {};
    Object.keys(map).forEach((date) => {
      result[date] = Object.values(map[date]);
    });
    return result;
  }, [tickets]);

  const TicketCalendar = () => {
    const [hoveredDay, setHoveredDay] = useState(null);
    const tooltipRef = useRef(null);
    const { year, month } = calendarDate;

    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const dayNames = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
    // Convert Sunday=0 to Monday=0 offset
    const startOffset = (firstDayOfMonth + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const todayStr = new Date().toISOString().split("T")[0];

    const goToPrev = () => {
      setCalendarDate(({ year, month }) =>
        month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
      );
    };

    const goToNext = () => {
      setCalendarDate(({ year, month }) =>
        month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
      );
    };

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
      <div className="ticket-calendar">
        <div className="cal-header">
          <button className="cal-nav-btn" onClick={goToPrev}>‹</button>
          <span className="cal-month-label">{monthNames[month]} {year}</span>
          <button className="cal-nav-btn" onClick={goToNext}>›</button>
        </div>

        <div className="cal-grid">
          {dayNames.map((d) => (
            <div key={d} className="cal-day-name">{d}</div>
          ))}

          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="cal-cell cal-cell--empty" />;

            const dateStr = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const hasTickets = !!ticketsByDate[dateStr];
            const isToday = dateStr === todayStr;

            return (
              <div
                key={dateStr}
                className={`cal-cell${hasTickets ? " cal-cell--has-tickets" : ""}${isToday ? " cal-cell--today" : ""}`}
                onMouseEnter={() => hasTickets && setHoveredDay(dateStr)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <span className="cal-day-num">{day}</span>

                {hasTickets && hoveredDay === dateStr && (
                  <div className="cal-tooltip" ref={tooltipRef}>
                    <p className="cal-tooltip-date">{dateStr}</p>
                    {ticketsByDate[dateStr].map((entry, i) => (
                      <div key={i} className="cal-tooltip-entry">
                        <span className="cal-tooltip-name">🏛 {entry.attractionName}</span>
                        {entry.location && (
                          <span className="cal-tooltip-location">📍 {entry.location}</span>
                        )}
                        <span className="cal-tooltip-count">🎫 {entry.count} ticket{entry.count > 1 ? "s" : ""}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const loadBarcode = async (ticketId) => {
    if (barcodes[ticketId] || loadingBarcodes[ticketId]) {
      return;
    }

    setLoadingBarcodes((prev) => ({
      ...prev,
      [ticketId]: true
    }));

    try {
      const response = await fetch(`${API_URL}/api/Tickets/${ticketId}/barcode`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const barcodeUrl = URL.createObjectURL(blob);

        setBarcodes((prev) => ({
          ...prev,
          [ticketId]: barcodeUrl
        }));
      }
    } catch (err) {
      console.error(`Error loading barcode for ticket ${ticketId}:`, err);
    } finally {
      setLoadingBarcodes((prev) => ({
        ...prev,
        [ticketId]: false
      }));
    }
  };

  const TicketCard = ({ ticket, expired }) => (
    <motion.div
      className={`ticket-card${expired ? " expired" : ""}`}
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

        <div className="ticket-barcode-row">
          {barcodes[ticket.id] ? (
            <img
              src={barcodes[ticket.id]}
              alt={`Barcode for ticket ${ticket.id}`}
              className="ticket-barcode"
            />
          ) : (
            <button
              type="button"
              className="show-barcode-btn"
              onClick={() => loadBarcode(ticket.id)}
              disabled={loadingBarcodes[ticket.id]}
            >
              {loadingBarcodes[ticket.id] ? "Loading barcode..." : "Show barcode"}
            </button>
          )}

          {!expired && (
            <motion.button
              className="cancel-ticket-btn"
              onClick={() => setCancelTicketId(ticket.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              🗑 Cancel ticket
            </motion.button>
          )}
        </div>
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
            <div className="profile-display">
              <p><strong>Name:</strong> {currentUser?.name} {currentUser?.surname}</p>
              <p><strong>Email:</strong> {currentUser?.email}</p>
              <motion.button
                className="edit-btn"
                onClick={() => setIsEditing(true)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                Edit profile
              </motion.button>
            </div>
          ) : (
            <div className="profile-form">
              <label>Name</label>
              <input
                name="name"
                type="text"
                value={profileData.name}
                onChange={handleProfileChange}
              />

              <label>Surname</label>
              <input
                name="surname"
                type="text"
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
          transition={{ duration: 0.55, ease: "easeOut" }}
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

        <motion.section
          className="profile-section delete-account-section"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <div className="section-title-row">
            <div>
              <h2>Delete account</h2>
            </div>
          </div>

          <p className="delete-account-warning">
            This action is <strong>permanent and irreversible</strong>. All your data, bookings and tickets will be deleted. Active tickets will be refunded to your bank account.
          </p>

          <div className="profile-form">
            <label>Enter your current password to confirm</label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => {
                setDeletePassword(e.target.value);
                setDeletePasswordError("");
              }}
              placeholder="Your current password"
            />

            {deletePasswordError && (
              <p className="profile-msg-error">{deletePasswordError}</p>
            )}

            <div className="profile-actions">
              <motion.button
                type="button"
                className="delete-account-btn"
                onClick={() => {
                  if (!deletePassword) {
                    setDeletePasswordError("Please enter your password.");
                    return;
                  }
                  setShowDeleteConfirm(true);
                }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                Delete my account
              </motion.button>
            </div>
          </div>
        </motion.section>


        {!currentUser?.isAdmin && tickets.length > 0 && (
          <motion.section
            className="profile-section"
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <div className="section-title-row">
              <div>
                <span className="section-label">Overview</span>
                <h2>My Travel Calendar</h2>
              </div>
            </div>
            <TicketCalendar />
          </motion.section>
        )}
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

            {loadingTickets && (
                <p className="tickets-loading-message">Loading tickets...</p>
              )}

              {hasMoreTickets && !loadingTickets && (
                <button
                  type="button"
                  className="load-more-tickets-btn"
                  onClick={() => setTicketPage((prev) => prev + 1)}
                >
                  Load more tickets
                </button>
              )}

              {!hasMoreTickets && tickets.length > 0 && (
                <p className="tickets-end-message">
                  All tickets are loaded.
                </p>
              )}
          </motion.section>
        )}
      </div>

      {/* MODAL CONFIRMARE STERGERE CONT */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="ticket-modal-overlay"
            onClick={() => setShowDeleteConfirm(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="ticket-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 35, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="ticket-modal-icon ticket-modal-icon--danger">⚠️</div>
              <h2>Delete your account?</h2>
              <p>
                Are you absolutely sure? This will permanently delete your account, all your bookings and tickets. <strong>This cannot be undone.</strong>
              </p>
              <div className="ticket-modal-actions">
                <button
                  className="secondary-action-btn"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  No, keep my account
                </button>
                <motion.button
                  className="delete-ticket-btn"
                  onClick={handleDeleteAccount}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Yes, delete account
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POPUP SUCCES STERGERE CONT */}
      <AnimatePresence>
        {showDeleteSuccess && (
          <motion.div
            className="ticket-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="ticket-modal"
              initial={{ opacity: 0, y: 35, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="ticket-modal-icon ticket-modal-icon--success">✓</div>
              <h2>Account deleted</h2>
              <p>Your account and all associated data have been permanently deleted.</p>
              {deleteRefundAmount > 0 && (
                <p className="ticket-refund-note">
                  💳 A total of <strong>{deleteRefundAmount} RON</strong> will be refunded to your bank account within 3–5 business days for your active tickets.
                </p>
              )}
              <motion.button
                className="primary-action-btn"
                onClick={handleDeleteSuccessClose}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                OK
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL CONFIRMARE STERGERE BILET */}
      <AnimatePresence>
        {cancelTicketId && (
          <motion.div
            className="ticket-modal-overlay"
            onClick={() => setCancelTicketId(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="ticket-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 35, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="ticket-modal-icon ticket-modal-icon--warn">🎫</div>
              <h2>Cancel your ticket?</h2>
              <p>
                Are you sure you want to cancel the ticket for{" "}
                <strong>
                  {tickets.find((t) => t.id === cancelTicketId)?.attractionName}
                </strong>
                ? This action cannot be undone.
              </p>
              <div className="ticket-modal-actions">
                <button
                  className="secondary-action-btn"
                  onClick={() => setCancelTicketId(null)}
                >
                  No, keep my ticket
                </button>
                <motion.button
                  className="delete-ticket-btn"
                  onClick={handleCancelTicket}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Yes, cancel ticket
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POPUP SUCCES STERGERE BILET */}
      <AnimatePresence>
        {showCancelSuccess && (
          <motion.div
            className="ticket-modal-overlay"
            onClick={() => setShowCancelSuccess(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="ticket-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 35, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="ticket-modal-icon ticket-modal-icon--success">✓</div>
              <h2>Ticket cancelled!</h2>
              <p>
                Your ticket for <strong>{canceledTicketName}</strong> has been successfully deleted.
              </p>
              <p className="ticket-refund-note">
                💳 The amount of <strong>{canceledTicketPrice} RON</strong> will be refunded to your bank account within 3–5 business days.
              </p>
              <motion.button
                className="primary-action-btn"
                onClick={() => setShowCancelSuccess(false)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                Got it
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default MyProfile;