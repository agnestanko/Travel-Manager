import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Home from "./Home";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = jest.fn();

// =====================
// MOCK ROUTER
// =====================
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// =====================
// MOCK API URL
// =====================
jest.mock("../services/api", () => ({
  API_URL: "http://localhost"
}));

// =====================
// MOCK CHILD COMPONENTS
// =====================
jest.mock("../components/SearchBar", () => () => (
  <div data-testid="searchbar" />
));

jest.mock("../components/ResultsList", () => () => (
  <div data-testid="resultslist" />
));

// =====================
// HELPER RENDER
// =====================
function renderComponent() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
}

// =====================
// SETUP FETCH
// =====================
beforeEach(() => {
  jest.clearAllMocks();

  global.fetch = jest.fn();

  jest.spyOn(console, "error").mockImplementation(() => {});
});

// =====================
// TESTS
// =====================

test("shows loading initially", () => {
  global.fetch.mockImplementation(
    () => new Promise(() => {})
  );

  renderComponent();

  expect(screen.getByText(/loading attractions/i)).toBeInTheDocument();
});

test("renders gallery after successful fetch", async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [
      { id: 1, name: "Paris", firstImage: "img1.jpg" },
      { id: 2, name: "Rome", firstImage: "img2.jpg" }
    ]
  });

  renderComponent();

  expect(await screen.findByText("Paris")).toBeInTheDocument();
  expect(screen.getByText("Rome")).toBeInTheDocument();
});

test("shows error when fetch fails", async () => {
  global.fetch.mockRejectedValueOnce(new Error("Network error"));

  renderComponent();

  expect(await screen.findByText("Network error")).toBeInTheDocument();
});

test("shows error when response is not ok", async () => {
  global.fetch.mockResolvedValueOnce({
    ok: false
  });

  renderComponent();

  expect(
    await screen.findByText("Failed to fetch attractions")
  ).toBeInTheDocument();
});

test("navigates on gallery click", async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [
      { id: 10, name: "Tokyo", firstImage: "img.jpg" }
    ]
  });

  renderComponent();

  const card = await screen.findByText("Tokyo");

  fireEvent.click(card);

  expect(mockNavigate).toHaveBeenCalledWith("/attraction/10");
});

test("renders fallback image when missing image", async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [
      { id: 1, name: "NoImage", firstImage: null }
    ]
  });

  renderComponent();

  const img = await screen.findByAltText("NoImage");

  expect(img.src).toContain("via.placeholder.com");
});

test("renders SearchBar and ResultsList", async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => []
  });

  renderComponent();

  expect(screen.getByTestId("searchbar")).toBeInTheDocument();
  expect(screen.getByTestId("resultslist")).toBeInTheDocument();
});