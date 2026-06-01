import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const availableSet = new Set(availableDates);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  const buildCalendarDays = () => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const offset = (firstDay + 6) % 7;

    const days = [];
    for (let i = 0; i < offset; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  };

  const days = buildCalendarDays();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else setViewMonth(viewMonth + 1);
  };

  const formatDate = (day) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${viewYear}-${mm}-${dd}`;
  };

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button type="button" onClick={prevMonth}>
          &#8249;
        </button>
        <span>
          {monthNames[viewMonth]} {viewYear}
        </span>
        <button type="button" onClick={nextMonth}>
          &#8250;
        </button>
      </div>

      <div className="calendar-days-of-week">
        {dayNames.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="calendar-grid">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="calendar-day" />;
          }

          const dateStr = formatDate(day);
          const isAvailable = availableSet.has(dateStr);
          const isSelected = selectedDate === dateStr;
          const past =
            new Date(dateStr) < new Date(today.toISOString().split("T")[0]);

          let className = "calendar-day current-month";
          if (isAvailable) className += " available";
          if (isSelected) className += " selected";
          if (past) className += " past";

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
// Star Rating component
// ==============================
function StarRating({ value, onChange, readOnly = false, size = "md" }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div
      className={`star-rating star-rating--${size}${readOnly ? " star-rating--readonly" : ""}`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star${display >= star ? " star--filled" : ""}`}
          onClick={() => !readOnly && onChange && onChange(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
        >
          ★
        </span>
      ))}
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [buyError, setBuyError] = useState("");
  const [images, setImages] = useState([]);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState({
    text: "",
    success: false,
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  const user = getCurrentUser();

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    tickets: 1,
    entryDate: "",
  });

  const buildImageUrl = (path) => {
    if (!path) return "/placeholder.jpg";
    if (path.startsWith("http")) return path;
    return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  };

  useEffect(() => {
    const fetchAttraction = async () => {
      try {
        const response = await fetch(`${API_URL}/api/Attraction/${id}`);

        if (!response.ok) {
          throw new Error("API error");
        }

        const attractionData = await response.json();
        setAttraction(attractionData);

        if (attractionData?.images?.length > 0) {
          const imageUrls = attractionData.images.map((img) =>
            buildImageUrl(img.imagePath),
          );
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
        const response = await fetch(
          `${API_URL}/api/relatedattractions/${id}?count=3`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch related");
        }

        const data = await response.json();

        const items = data.map((item) => ({
          id: item.id,
          title: item.name,
          image: item.firstImage
            ? buildImageUrl(item.firstImage)
            : "/placeholder.jpg",
        }));

        setRelated(items);
      } catch (err) {
        console.error("Error loading related attractions:", err);
        setRelated([]);
      }
    };

    if (id) fetchRelated();
  }, [id]);

  useEffect(() => {
    const fetchDates = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/Attraction/${id}/available-dates`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch dates");
        }

        const data = await response.json();
        setAvailableDates(data);
      } catch (err) {
        console.error("Error loading available dates:", err);
        setAvailableDates([]);
      }
    };

    if (id) fetchDates();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const headers = {};
        const token = localStorage.getItem("token");
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}/api/Reviews/${id}`, {
          headers,
        });
        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews ?? data);
          setCanReview(data.canReview ?? false);
        }
      } catch (err) {
        console.error("Error loading reviews:", err);
      }
    };

    if (id) fetchReviews();
  }, [id]);

  if (!attraction) {
    return (
      <div className="details-container">
        <p className="details-loading">Attraction not found.</p>
      </div>
    );
  }

  const price = Number(attraction.entryPrice) || 0;
  const totalPrice = price * Number(formData.tickets);
  const attractionImages = images.length > 0 ? images : ["/placeholder.jpg"];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: name === "tickets" ? Number(value) : value,
    });
  };

  const handleDateSelect = (dateStr) => {
    setFormData({ ...formData, entryDate: dateStr });
    setBuyError("");
  };

  const handleBuyTicket = () => {
    if (!isLoggedIn()) {
      navigate(`/auth?redirect=${encodeURIComponent(`/attraction/${id}`)}`);
      return;
    }

    setBuyError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.entryDate || !availableDates.includes(formData.entryDate)) {
      setBuyError("Please select a valid entry date from the calendar.");
      return;
    }

    const response = await fetch(`${API_URL}/api/Tickets/buy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        attractionId: Number(id),
        quantity: formData.tickets,
        entryDate: formData.entryDate,
      }),
    });

    if (response.ok) {
      setShowModal(false);
      setShowSuccess(true);
      setFormData({ ...formData, entryDate: "", tickets: 1 });
    } else {
      const errorText = await response.text();
      setBuyError(errorText || "Purchase failed. Please try again.");
    }
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      setReviewMessage({ text: "Please select a rating.", success: false });
      return;
    }
    if (!reviewComment.trim()) {
      setReviewMessage({ text: "Please write a comment.", success: false });
      return;
    }

    setSubmittingReview(true);
    setReviewMessage({ text: "", success: false });

    try {
      const response = await fetch(`${API_URL}/api/Reviews/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ comment: reviewComment, rating: reviewRating }),
      });

      if (response.ok) {
        const newReview = await response.json();
        setReviews((prev) => [newReview, ...prev]);
        setReviewRating(0);
        setReviewComment("");
        setCanReview(false);
        setReviewMessage({
          text: "Review submitted successfully!",
          success: true,
        });
      } else {
        const err = await response.text();
        setReviewMessage({
          text: err.replace(/"/g, "") || "Could not submit review.",
          success: false,
        });
      }
    } catch (err) {
      setReviewMessage({ text: "An error occurred.", success: false });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      const response = await fetch(`${API_URL}/api/Reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      }
    } catch (err) {
      console.error("Error deleting review:", err);
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(
        1,
      )
    : null;

  return (
    <motion.div
      className="details-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
    >
      <div className="details-page">
        <motion.div
          className="details-layout"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.12,
              },
            },
          }}
        >
          <motion.div
            className="details-gallery"
            variants={{
              hidden: { opacity: 0, x: -45 },
              visible: { opacity: 1, x: 0 },
            }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            <ImageGallery images={attractionImages} />
          </motion.div>

          <motion.div
            className="details-info"
            variants={{
              hidden: { opacity: 0, x: 45 },
              visible: { opacity: 1, x: 0 },
            }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            <button className="back-details-btn" onClick={() => navigate(-1)}>
              ← Back
            </button>

            <span className="details-type">{attraction.type}</span>

            <h1>{attraction.name}</h1>

            <p className="details-location">{attraction.location}</p>

            <p className="details-description">{attraction.description}</p>

            <div className="details-price-box">
              <span>Entry price</span>
              <strong>{price} RON</strong>
            </div>

            {user?.isAdmin ? (
              <motion.button
                className="admin-manage-attraction-btn"
                onClick={() =>
                  navigate("/admin", {
                    state: { editAttractionId: Number(id) },
                  })
                }
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                Manage in Admin Panel
              </motion.button>
            ) : (
              <motion.button
                className="buy-ticket-btn"
                onClick={handleBuyTicket}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                Buy ticket
              </motion.button>
            )}
          </motion.div>
        </motion.div>

        {/* ====== REVIEWS SECTION ====== */}
        <motion.section
          className="reviews-section"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="reviews-header">
            <div>
              <span className="reviews-kicker">What people say</span>
              <h3>Reviews</h3>
            </div>
            {avgRating && (
              <div className="reviews-avg">
                <span className="reviews-avg-score">{avgRating}</span>
                <StarRating value={Math.round(avgRating)} readOnly size="sm" />
                <span className="reviews-count">
                  {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {isLoggedIn() && !user?.isAdmin && canReview && (
            <motion.div
              className="review-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <p className="review-form-label">Leave your review</p>
              <StarRating
                value={reviewRating}
                onChange={setReviewRating}
                size="lg"
              />
              <textarea
                className="review-textarea"
                placeholder="Share your experience..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
              />
              {reviewMessage.text && (
                <p
                  className={
                    reviewMessage.success
                      ? "review-msg-success"
                      : "review-msg-error"
                  }
                >
                  {reviewMessage.text}
                </p>
              )}
              <motion.button
                className="review-submit-btn"
                onClick={handleSubmitReview}
                disabled={submittingReview}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                {submittingReview ? "Submitting..." : "Submit review"}
              </motion.button>
            </motion.div>
          )}

          {isLoggedIn() && !user?.isAdmin && !canReview && (
            <p className="review-already-done">
              {reviews.some((r) => r.userId === user?.id)
                ? "✓ You have already reviewed this attraction."
                : "You can only review attractions you have visited."}
            </p>
          )}

          {reviews.length === 0 ? (
            <p className="reviews-empty">
              No reviews yet. Be the first to share your experience!
            </p>
          ) : (
            <div className="reviews-list">
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  className="review-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                >
                  <div className="review-card-header">
                    <div className="review-card-left">
                      <div className="review-avatar">
                        {review.userName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="review-author">{review.userName}</p>
                        <p className="review-date">{review.dateOfReview}</p>
                      </div>
                    </div>
                    <div className="review-card-right">
                      <StarRating value={review.rating} readOnly size="sm" />
                      {(user?.id === review.userId || user?.isAdmin) && (
                        <button
                          className="review-delete-btn"
                          onClick={() => handleDeleteReview(review.id)}
                          title="Delete review"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* ====== RELATED ATTRACTIONS ====== */}
        <motion.aside
          className="related-sidebar"
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="related-header">
            <span>Recommended</span>
            <h3>Related attractions</h3>
          </div>

          <div className="related-list">
            {related.map((item, index) => (
              <motion.div
                className="related-card"
                key={item.id}
                onClick={() => navigate(`/attraction/${item.id}`)}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                whileHover={{ y: -7, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <img src={item.image} alt={item.title} loading="lazy" />
                <p>{item.title}</p>
              </motion.div>
            ))}
          </div>
        </motion.aside>

        <AnimatePresence>
          {showModal && (
            <motion.div
              className="modal-overlay"
              onClick={() => setShowModal(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="modal"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, y: 35, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
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

                  <label>Entry date</label>
                  <AvailabilityCalendar
                    availableDates={availableDates}
                    selectedDate={formData.entryDate}
                    onSelectDate={handleDateSelect}
                  />

                  {!formData.entryDate && (
                    <p className="formHint">
                      Please select an entry date from the calendar.
                    </p>
                  )}

                  {formData.entryDate && (
                    <p className="selected-date">
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

                  {buyError && <p className="formHint">{buyError}</p>}

                  <motion.button
                    type="submit"
                    disabled={!formData.entryDate}
                    className="confirm-purchase-btn"
                    style={{
                      opacity: !formData.entryDate ? 0.5 : 1,
                      cursor: !formData.entryDate ? "not-allowed" : "pointer",
                    }}
                    whileHover={formData.entryDate ? { y: -2 } : {}}
                    whileTap={formData.entryDate ? { scale: 0.97 } : {}}
                  >
                    Confirm purchase
                  </motion.button>

                  <p className="paymentInfo">Card only payment</p>

                  <button
                    className="cancel-btn"
                    type="button"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSuccess && (
            <motion.div
              className="modal-overlay"
              onClick={() => setShowSuccess(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="modal success-modal"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, y: 35, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
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
                  className="cancel-btn"
                  onClick={() => setShowSuccess(false)}
                >
                  Stay on this page
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default AttractionDetails;
