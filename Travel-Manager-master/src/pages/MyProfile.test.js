import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import MyProfile from "../pages/MyProfile";
import { MemoryRouter } from "react-router-dom";
import * as auth from "../services/authService";

// =====================
// MOCK react-router-dom
// =====================
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// =====================
// MOCK auth service
// =====================
jest.mock("../services/authService", () => ({
  isLoggedIn: jest.fn(),
  getCurrentUser: jest.fn()
}));

// =====================
// GLOBAL FETCH MOCK
// =====================
global.fetch = jest.fn();

// =====================
// RENDER HELPER
// =====================
const renderComponent = () =>
  render(
    <MemoryRouter>
      <MyProfile />
    </MemoryRouter>
  );

// =====================
// TESTS
// =====================
describe("MyProfile component", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    localStorage.setItem("token", "fake-token");

    auth.getCurrentUser.mockReturnValue({
      name: "John",
      email: "john@test.com"
    });

    // FIX pentru jsdom
    global.URL.createObjectURL = jest.fn(() => "blob:url");
    global.URL.revokeObjectURL = jest.fn();
  });

  // ---------------------
  // 1. REDIRECT TEST
  // ---------------------
  test("redirects to auth if not logged in", async () => {
    auth.isLoggedIn.mockReturnValue(false);

    renderComponent();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/auth");
    });
  });

  // ---------------------
  // 2. USER DATA
  // ---------------------
  test("renders user data correctly", async () => {
    auth.isLoggedIn.mockReturnValue(true);

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    renderComponent();

    expect(await screen.findByText(/My Profile/i)).toBeInTheDocument();

    // verificăm label-urile, NU "John" direct
    expect(screen.getByText(/Name:/i)).toBeInTheDocument();
    expect(screen.getByText(/Email:/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/john@test\.com/i)).toBeInTheDocument();
    });
  });

  // ---------------------
  // 3. FETCH TICKETS
  // ---------------------
  test("fetches and displays tickets", async () => {
    auth.isLoggedIn.mockReturnValue(true);

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1,
            attractionName: "Castle",
            entryDate: "2099-01-01",
            dateOfPurchase: "2025-01-01",
            pricePerTicket: 100,
            firstImage: null
          }
        ]
      })
      .mockResolvedValue({
        ok: true,
        blob: async () => new Blob(["fake"])
      });

    renderComponent();

    expect(await screen.findByText(/Castle/i)).toBeInTheDocument();
  });

  // ---------------------
  // 4. ACTIVE / EXPIRED
  // ---------------------
  test("splits active and expired tickets", async () => {
    auth.isLoggedIn.mockReturnValue(true);

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1,
            attractionName: "Future Ticket",
            entryDate: "2099-01-01"
          },
          {
            id: 2,
            attractionName: "Past Ticket",
            entryDate: "2000-01-01"
          }
        ]
      })
      .mockResolvedValue({
        ok: true,
        blob: async () => new Blob(["fake"])
      });

    renderComponent();

    expect(await screen.findByText(/Active tickets/i)).toBeInTheDocument();
    expect(await screen.findByText(/Expired tickets/i)).toBeInTheDocument();
  });

  // ---------------------
  // 5. BACK BUTTON
  // ---------------------
  test("back button navigates home", async () => {
    auth.isLoggedIn.mockReturnValue(true);

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    renderComponent();

    const btn = await screen.findByText(/Back to Home/i);
    fireEvent.click(btn);

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});