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

  //Input pentru BuyTicketForm -> functii handle -> implementare logica in backend; POST /api/Tickets; calc total Price=price+profit?
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    tickets: 1,
    entryDate: ""
  });

  useEffect(() => {
    const fetchAttraction = async () => {
      try {
        const response = await fetch(`${API_URL}/api/Search`);

        if (!response.ok) {
          throw new Error("API error");
        }

        const data = await response.json();
        const found = data.find((item) => item.id === Number(id));

        setAttraction(found);
      } catch (error) {
        console.error("Error loading attraction:", error);
      }
    };

    fetchAttraction();
  }, [id]);

  if (!attraction) return <p>Attraction not found.</p>;

  const price = Number(attraction.entryPrice) || 0;
  const totalPrice = price * Number(formData.tickets);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: name === "tickets" ? Number(value) : value
    });
  };

  const handleBuyTicket = () => {
    if (!isLoggedIn()) {
      navigate("/auth");
      return;
    }

    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Data prepared for backend
    const orderData = {
      fullName: formData.fullName,
      email: formData.email,
      attractionId: Number(id),
      tickets: formData.tickets,
      price: price,
      totalPrice: totalPrice,
      entryDate: formData.entryDate
    };

    console.log("ORDER DATA:", orderData);

    alert("Ticket reserved");
    setShowModal(false);

    // Use this later when backend endpoint is ready
    /*
    const response = await fetch(`${API_URL}/api/Tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(orderData)
    });

    if (response.ok) {
      alert("Ticket reserved successfully");
      setShowModal(false);
    } else {
      alert("Ticket reservation failed");
    }
    */
  };

  return (
    <div className="details-container">
      <button onClick={() => navigate(-1)}>Back</button>

      <h1>{attraction.name}</h1>
      <p>{attraction.location}</p>
      <p>{attraction.description}</p>
      <p>{price} RON</p>

      <button onClick={handleBuyTicket}>Buy ticket</button>

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

              <label>Entry date</label>
              <input
                type="date"
                name="entryDate"
                value={formData.entryDate}
                onChange={handleChange}
                required
              />

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

              <button type="submit">Confirm purchase</button>
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
    </div>
  );
}

export default AttractionDetails;