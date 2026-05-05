import { render, screen, fireEvent } from "@testing-library/react";
import Header from "./Header";
import { isLoggedIn, getCurrentUser, logout } from "../services/authService";

// mock pentru navigare (react-router)
const mockNavigate = jest.fn();

// mock pentru react-router-dom
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// mock pentru auth service (controlăm starea userului)
jest.mock("../services/authService", () => ({
  isLoggedIn: jest.fn(),
  getCurrentUser: jest.fn(),
  logout: jest.fn(),
}));


const renderHeader = () => {
  return render(<Header />);
};

//TESTE
describe("Header component", () => {

  //Test basic render (UI apare corect)
  test("renders header with menu button", () => {
    isLoggedIn.mockReturnValue(false);

    renderHeader();

    expect(screen.getByText(/menu/i)).toBeInTheDocument();
  });

  //Logo este afișat corect
  test("renders logo", () => {
    isLoggedIn.mockReturnValue(false);

    renderHeader();

    expect(screen.getByAltText(/logo/i)).toBeInTheDocument();
  });

  //Menu toggle (state useState)
  test("toggles menu on click", () => {
    isLoggedIn.mockReturnValue(false);

    renderHeader();

    fireEvent.click(screen.getByText(/menu/i));

    expect(screen.getByText(/home/i)).toBeInTheDocument();
  });

  //User NELOGAT → apare Login/Register
  test("shows login button when user is not logged in", () => {
    isLoggedIn.mockReturnValue(false);

    renderHeader();

    expect(screen.getByText(/login \/ register/i)).toBeInTheDocument();
  });

  //User LOGAT → apare nume + logout
  test("shows user info and logout when logged in", () => {
    isLoggedIn.mockReturnValue(true);
    getCurrentUser.mockReturnValue({ name: "Alex" });

    renderHeader();

    expect(screen.getByText(/alex/i)).toBeInTheDocument();
    expect(screen.getByText(/logout/i)).toBeInTheDocument();
  });

  //Logout funcționează corect (service + navigate)
  test("calls logout and redirects on logout click", () => {
    isLoggedIn.mockReturnValue(true);
    getCurrentUser.mockReturnValue({ name: "Alex" });

    renderHeader();

    fireEvent.click(screen.getByText(/logout/i));

    expect(logout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/auth");
  });


  //Navigare către profile (doar când user e logat)
  test("navigates to profile when clicking My Profile", () => {
    isLoggedIn.mockReturnValue(true);
    getCurrentUser.mockReturnValue({ name: "Alex" });

    renderHeader();

    fireEvent.click(screen.getByText(/menu/i));
    fireEvent.click(screen.getByText(/my profile/i));

    expect(mockNavigate).toHaveBeenCalledWith("/profile");
  });
});