import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Auth from "./Auth";
import { MemoryRouter } from "react-router-dom";

global.fetch = jest.fn();

const mockNavigate = jest.fn();

// =====================
// MOCK ROUTER
// =====================
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams("")]
  };
});

// =====================
// MOCK API
// =====================
jest.mock("../services/api", () => ({
  API_URL: "http://localhost"
}));

function renderComponent() {
  return render(
    <MemoryRouter>
      <Auth />
    </MemoryRouter>
  );
}

beforeEach(() => {
  fetch.mockImplementation((url) => {
    if (url.includes("/register")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ message: "ok" })
      });
    }

    if (url.includes("/login")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          token: "fake-token",
          user: { name: "Test" }
        })
      });
    }
  });

  jest.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

// ===================== TESTS =====================

test("renders login form", () => {
  renderComponent();

  expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
});

test("switches to register form", () => {
  renderComponent();

  fireEvent.click(screen.getByRole("button", { name: /register/i }));

  expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Surname")).toBeInTheDocument();
});

test("successful register switches back to login", async () => {
  renderComponent();

  fireEvent.click(screen.getByRole("button", { name: /register/i }));

  fireEvent.change(screen.getByPlaceholderText("Name"), {
    target: { name: "name", value: "John" }
  });

  fireEvent.change(screen.getByPlaceholderText("Surname"), {
    target: { name: "surname", value: "Doe" }
  });

  fireEvent.change(screen.getByPlaceholderText("Email"), {
    target: { name: "email", value: "test@test.com" }
  });

  fireEvent.change(screen.getByPlaceholderText("Password"), {
    target: { name: "password", value: "123456" }
  });

  fireEvent.click(screen.getByRole("button", { name: /register/i }));

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith(
      "Account created successfully!"
    );
  });
});

test("failed register shows alert", async () => {
  fetch.mockResolvedValueOnce({ ok: false });

  renderComponent();

  fireEvent.click(screen.getByRole("button", { name: /register/i }));

  fireEvent.click(screen.getByRole("button", { name: /register/i }));

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith("Registration failed.");
  });
});

test("successful login stores token and navigates", async () => {
  renderComponent();

  fireEvent.change(screen.getByPlaceholderText("Email"), {
    target: { name: "email", value: "test@test.com" }
  });

  fireEvent.change(screen.getByPlaceholderText("Password"), {
    target: { name: "password", value: "123456" }
  });

  fireEvent.click(screen.getByRole("button", { name: /login/i }));

  await waitFor(() => {
    expect(localStorage.getItem("token")).toBe("fake-token");
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});

test("failed login shows alert", async () => {
  fetch.mockResolvedValueOnce({ ok: false });

  renderComponent();

  fireEvent.click(screen.getByRole("button", { name: /login/i }));

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith(
      "Invalid email or password."
    );
  });
});

test("back button navigates back", () => {
  renderComponent();

  fireEvent.click(screen.getByRole("button", { name: /back/i }));

  expect(mockNavigate).toHaveBeenCalledWith(-1);
});