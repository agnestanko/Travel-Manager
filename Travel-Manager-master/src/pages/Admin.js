import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "../services/api";
import { isLoggedIn, getCurrentUser } from "../services/authService";
import "./Admin.css";

const SUPABASE_URL = "https://jrxdiyjlvtydeccpeyxu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyeGRpeWpsdnR5ZGVjY3BleXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjI4MzEsImV4cCI6MjA5NDY5ODgzMX0.Ylkdx19TpKv26fF9NF6OjixaXT1zQuAFXP7eO_ZDK0M";
const BUCKET = "attractions";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Mo","Tu","We","Th","Fr","Sa","Su"];

function Calendar({ selectedDates, onToggleDate }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;

  const days = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);

  const fmt = (d) => {
    const dd = String(d).padStart(2, "0");
    const mm = String(viewMonth + 1).padStart(2, "0");
    return `${viewYear}-${mm}-${dd}`;
  };

  const isPast = (d) => {
    const date = new Date(viewYear, viewMonth, d);
    date.setHours(0,0,0,0);
    const t = new Date(); t.setHours(0,0,0,0);
    return date < t;
  };

  return (
    <div className="admin-calendar">
      <div className="admin-cal-header">
        <button type="button" onClick={() => {
          if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
          else setViewMonth(m => m - 1);
        }}>‹</button>
        <span>{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" onClick={() => {
          if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
          else setViewMonth(m => m + 1);
        }}>›</button>
      </div>
      <div className="admin-cal-days-header">
        {DAYS.map(d => <span key={d}>{d}</span>)}
      </div>
      <div className="admin-cal-grid">
        {days.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = fmt(day);
          const selected = selectedDates.includes(dateStr);
          const past = isPast(day);
          return (
            <button
              key={dateStr}
              type="button"
              className={`admin-cal-day ${selected ? "selected" : ""} ${past ? "past" : ""}`}
              onClick={() => !past && onToggleDate(dateStr)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const emptyForm = {
  name: "", type: "", description: "", location: "",
  capacity: "", entryPrice: "", imagePaths: [], availableDates: []
};

function Admin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: "", success: false });
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/auth"); return; }
    const user = getCurrentUser();
    if (!user?.isAdmin) { navigate("/"); return; }
    fetchAttractions();
  }, [navigate]);

  const fetchAttractions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/Admin/attractions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) setAttractions(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const urls = [];
    for (const file of files) {
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fileName}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": file.type,
          "x-upsert": "true"
        },
        body: file
      });
      if (res.ok) {
        urls.push(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fileName}`);
      }
    }
    setForm(f => ({ ...f, imagePaths: [...f.imagePaths, ...urls] }));
    setUploading(false);
  };

  const removeImage = (idx) => {
    setForm(f => ({ ...f, imagePaths: f.imagePaths.filter((_, i) => i !== idx) }));
  };

  const toggleDate = (dateStr) => {
    setForm(f => ({
      ...f,
      availableDates: f.availableDates.includes(dateStr)
        ? f.availableDates.filter(d => d !== dateStr)
        : [...f.availableDates, dateStr].sort()
    }));
  };

  const handleEdit = (attraction) => {
    setEditingId(attraction.id);
    setForm({
      name: attraction.name,
      type: attraction.type,
      description: attraction.description,
      location: attraction.location,
      capacity: attraction.capacity,
      entryPrice: attraction.entryPrice,
      imagePaths: attraction.images?.map(i => i.imagePath) || [],
      availableDates: attraction.availableDates?.map(d => d.date?.slice(0, 10)) || []
    });
    setShowForm(true);
    setMessage({ text: "", success: false });
  };

  useEffect(() => {
    const editAttractionId = location.state?.editAttractionId;

    if (!editAttractionId || attractions.length === 0) {
      return;
    }

    const attractionToEdit = attractions.find(
      (attraction) => attraction.id === Number(editAttractionId)
    );

    if (attractionToEdit) {
      handleEdit(attractionToEdit);

      // Curatam state-ul ca formularul sa nu se redeschida automat la refresh intern
      navigate("/admin", { replace: true, state: null });
    }
  }, [location.state, attractions, navigate]);

  const handleNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setMessage({ text: "", success: false });
  };

  const handleDelete = async () => {
    const res = await fetch(`${API_URL}/api/Admin/attractions/${deleteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    if (res.ok) {
      setAttractions(a => a.filter(x => x.id !== deleteId));
      setMessage({ text: "Attraction deleted successfully!", success: true });
    }
    setDeleteId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", success: false });

    const body = {
      name: form.name,
      type: form.type,
      description: form.description,
      location: form.location,
      capacity: Number(form.capacity),
      entryPrice: Number(form.entryPrice),
      imagePaths: form.imagePaths,
      availableDates: form.availableDates
    };

    const url = editingId
      ? `${API_URL}/api/Admin/attractions/${editingId}`
      : `${API_URL}/api/Admin/attractions`;
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      setMessage({ text: editingId ? "Attraction updated!" : "Attraction added!", success: true });
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      fetchAttractions();
    } else {
      const err = await res.text();
      setMessage({ text: err || "Something went wrong.", success: false });
    }
  };

  const filteredAttractions = attractions.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.location.toLowerCase().includes(search.toLowerCase()) ||
    a.type.toLowerCase().includes(search.toLowerCase())
  );

    const totalImages = attractions.reduce(
      (total, attraction) => total + (attraction.images?.length || 0),
      0
    );

    const totalAvailableDates = attractions.reduce(
      (total, attraction) => total + (attraction.availableDates?.length || 0),
      0
    );

    const averagePrice =
      attractions.length > 0
        ? Math.round(
            attractions.reduce(
              (total, attraction) => total + Number(attraction.entryPrice || 0),
              0
            ) / attractions.length
          )
        : 0;

    return (
    <div className="admin-page">
      <motion.div
        className="admin-hero"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div>
          <span className="admin-mode-badge">Administrator mode</span>
          <h1>Admin Dashboard</h1>
          <p>
            Manage attractions, images, prices and available dates from one clean workspace.
          </p>
        </div>

        <motion.button
          className="admin-btn-primary admin-hero-action"
          onClick={handleNew}
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          + Add Attraction
        </motion.button>
      </motion.div>

      <div className="admin-stats-grid">
        <motion.div className="admin-stat-card" whileHover={{ y: -6 }}>
          <span>Total attractions</span>
          <strong>{attractions.length}</strong>
          <p>Items available in the platform</p>
        </motion.div>

        <motion.div className="admin-stat-card" whileHover={{ y: -6 }}>
          <span>Uploaded images</span>
          <strong>{totalImages}</strong>
          <p>Photos connected to attractions</p>
        </motion.div>

        <motion.div className="admin-stat-card" whileHover={{ y: -6 }}>
          <span>Available dates</span>
          <strong>{totalAvailableDates}</strong>
          <p>Bookable dates configured</p>
        </motion.div>

        <motion.div className="admin-stat-card" whileHover={{ y: -6 }}>
          <span>Average price</span>
          <strong>{averagePrice} RON</strong>
          <p>Average entry price</p>
        </motion.div>
      </div>

      {message.text && (
        <div className={`admin-message ${message.success ? "success" : "error"}`}>
          {message.text}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="admin-form-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="admin-form-card"
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ duration: 0.3 }}
            >
              <div className="admin-form-header">
                <h2>{editingId ? "Edit Attraction" : "New Attraction"}</h2>
                <button className="admin-close-btn" onClick={() => setShowForm(false)}>✕</button>
              </div>

              <form onSubmit={handleSubmit} className="admin-form">
                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label>Name</label>
                    <input name="name" value={form.name} onChange={handleChange} required />
                  </div>
                  <div className="admin-field">
                    <label>Type</label>
                    <select name="type" value={form.type} onChange={handleChange} required>
                      <option value="">Select type</option>
                      <option value="Historical">Historical</option>
                      <option value="Nature">Nature</option>
                      <option value="Relaxation">Relaxation</option>
                      <option value="Entertainment">Entertainment</option>
                    </select>
                  </div>
                  <div className="admin-field admin-field-full">
                    <label>Description</label>
                    <textarea name="description" value={form.description} onChange={handleChange} rows={3} required />
                  </div>
                  <div className="admin-field">
                    <label>Location</label>
                    <input name="location" value={form.location} onChange={handleChange} required />
                  </div>
                  <div className="admin-field">
                    <label>Capacity</label>
                    <input name="capacity" type="number" value={form.capacity} onChange={handleChange} required />
                  </div>
                  <div className="admin-field">
                    <label>Entry Price (RON)</label>
                    <input name="entryPrice" type="number" value={form.entryPrice} onChange={handleChange} required />
                  </div>
                </div>

                {/* IMAGINI */}
                <div className="admin-section">
                  <label className="admin-section-label">Images</label>
                  <div className="admin-images-grid">
                    {form.imagePaths.map((url, idx) => (
                      <div key={idx} className="admin-image-preview">
                        <img src={url} alt={`img-${idx}`} />
                        <button type="button" className="admin-remove-img" onClick={() => removeImage(idx)}>✕</button>
                      </div>
                    ))}
                    <label className="admin-upload-btn">
                      {uploading ? "Uploading..." : "+ Add Photos"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        disabled={uploading}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>
                </div>

                {/* CALENDAR */}
                <div className="admin-section">
                  <label className="admin-section-label">Available Dates</label>
                  <Calendar selectedDates={form.availableDates} onToggleDate={toggleDate} />
                  {form.availableDates.length > 0 && (
                    <div className="admin-selected-dates">
                      {form.availableDates.map(d => (
                        <span key={d} className="admin-date-tag">
                          {d}
                          <button type="button" onClick={() => toggleDate(d)}>✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="admin-form-actions">
                  <button type="button" className="admin-btn-secondary" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    className="admin-btn-primary"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {editingId ? "Save Changes" : "Add Attraction"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEARCHBAR */}
            <section className="admin-management-card">
        <div className="admin-management-header">
          <div>
            <span>Management</span>
            <h2>Attractions list</h2>
          </div>

          <p>{filteredAttractions.length} results</p>
        </div>

        {/* SEARCHBAR */}
        <div className="admin-search">
          <input
            placeholder="Search attractions by name, location or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* LISTA ATRACTII */}
        {loading ? (
          <p className="admin-loading">Loading attractions...</p>
        ) : (
          <div className="admin-attractions-list">
          {filteredAttractions.length === 0 ? (
            <p className="admin-loading">No attractions found.</p>
          ) : (
            filteredAttractions.map(a => (
              <motion.div
                key={a.id}
                className="admin-attraction-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src={a.images?.[0]?.imagePath || "/placeholder.jpg"}
                  alt={a.name}
                  className="admin-card-img"
                />
                <div className="admin-card-info">
                  <h3>{a.name}</h3>
                  <p>{a.location} · {a.type}</p>

                  <div className="admin-card-meta">
                    <span>{a.entryPrice} RON</span>
                    <span>Capacity: {a.capacity}</span>
                    <span>{a.availableDates?.length || 0} dates</span>
                  </div>
                </div>
                <div className="admin-card-actions">
                  <button className="admin-btn-edit" onClick={() => handleEdit(a)}>Edit</button>
                  <button className="admin-btn-delete" onClick={() => setDeleteId(a.id)}>Delete</button>
                </div>
              </motion.div>
            ))
          )}
                  </div>
        )}
      </section>

      {/* MODAL CONFIRMARE STERGERE */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            className="admin-form-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="admin-confirm-card"
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ duration: 0.25 }}
            >
              <h2>Delete Attraction</h2>
              <p>Are you sure you want to delete this attraction? This action cannot be undone.</p>
              <div className="admin-confirm-actions">
                <button className="admin-btn-secondary" onClick={() => setDeleteId(null)}>
                  Cancel
                </button>
                <button className="admin-btn-delete-confirm" onClick={handleDelete}>
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Admin;