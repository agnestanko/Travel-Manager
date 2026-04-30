import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./AttractionDetails.css";
import { isLoggedIn, getCurrentUser } from "../services/authService";
import { API_URL } from "../services/api";
import ImageGallery from "../components/ImageGallery";

// Imagini temporale: Backend
import img1 from "../assets/gallery1.jpeg";
import img2 from "../assets/gallery2.jpeg";
import img3 from "../assets/gallery3.jpeg";

function AttractionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [attraction, setAttraction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  //const [availableDates, setAvailableDates] = useState([]);
  //const [unavailableDates, setUnavailableDates] = useState([]);
  //PAS 3 (viitor)-> calendar custom (highlight zile)

  const user = getCurrentUser();

  const attractionImages = [img1, img2, img3];

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

  /*
useEffect(() => {
  const fetchDates = async () => {
    const response = await fetch(`${API_URL}/api/Attractions/${id}/available-dates`);

    if (response.ok) {
      const data = await response.json();
      setAvailableDates(data.availableDates);
      setUnavailableDates(data.unavailableDates);
    }
  };

  fetchDates();
}, [id]);
*/

  const price = Number(attraction.entryPrice) || 0;
  const totalPrice = price * Number(formData.tickets);

  //const attractionImages = [img1, img2, img3];

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

  const relatedAttractions = [
    { id: 2, title: "Adventure Park", image: img2 },
    { id: 3, title: "City Experience", image: img3 },
    { id: 1, title: "Aquapark Nymphaea", image: img1 }
  ];

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
              {relatedAttractions.map((item) => (
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
              {!formData.entryDate && (
                <p className="formHint">
                  Please select an entry date.
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
  </div>
  );

}

export default AttractionDetails;