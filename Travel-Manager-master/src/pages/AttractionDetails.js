import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./AttractionDetails.css";
import { isLoggedIn, getCurrentUser } from "../services/authService";
import { API_URL } from "../services/api";

function AttractionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [attraction, setAttraction] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const user = getCurrentUser();

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phoneNumber: "",
    tickets: 1,
    paymentMethod: "",
    notes: ""
  });

  useEffect(() => {
    const fetchAttraction = async () => {
      try {
        const response = await fetch(`${API_URL}/api/Search`);

        if (!response.ok) {
          throw new Error("API error");
        }

        const data = await response.json();
        const found = data.find(item => item.id === Number(id));

        setAttraction(found);
      } catch (error) {
        console.error("Eroare la incarcarea atractiei:", error);
      }
    };

    fetchAttraction();
  }, [id]);

  if (!attraction) return <p>Attraction not found.</p>;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const orderData = {
    ...formData,
    attractionId: Number(id)
  };

  console.log("ORDER DATA:", orderData);

  alert("Ticket reserved");
  setShowModal(false);
};
// Daca este endpoint in partea backend
/* const response = await fetch(`${API_URL}/api/Tickets`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(orderData)
}); */

 const handleBuyTicket = () => {
  if (!isLoggedIn()) {
    navigate("/auth");
    return;
  }
  setShowModal(true);
};

  return (
    <div className="details-container">
      <button onClick={() => navigate(-1)}>
        Back
      </button>

      <h1>{attraction.name}</h1>
      <p>{attraction.location}</p>
      <p>{attraction.description}</p>
      <p>{attraction.entryPrice} RON</p>

      <button onClick={handleBuyTicket}>
        Buy ticket
      </button>

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

              <input
                name="phoneNumber"
                placeholder="Phone number"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />

              <input
                type="number"
                name="tickets"
                min="1"
                value={formData.tickets}
                onChange={handleChange}
                required
              />

              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                required
              >
                <option value="">Select payment method</option>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
              </select>

              <textarea
                name="notes"
                placeholder="Additional notes"
                value={formData.notes}
                onChange={handleChange}
              />

              <button type="submit">
                Confirm purchase
              </button>

              <button
                type="button"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttractionDetails;