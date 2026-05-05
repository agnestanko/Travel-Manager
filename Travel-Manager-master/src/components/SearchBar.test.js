import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SearchBar from "./SearchBar";
import { API_URL } from "../services/api";

//mock API URL
jest.mock("../services/api", () => ({
  API_URL: "http://mock-api",
}));

//mock fetch global
global.fetch = jest.fn();

describe("SearchBar component", () => {

  beforeEach(() => {
    fetch.mockClear();
  });

  //UI basic render
  test("renders input and buttons", () => {
    render(<SearchBar setResults={() => {}} />);

    expect(screen.getByPlaceholderText(/search events/i)).toBeInTheDocument();
    expect(screen.getByText(/filter/i)).toBeInTheDocument();
    expect(screen.getByText(/sort by price/i)).toBeInTheDocument();
  });

  //input update
  test("updates search input", () => {
    render(<SearchBar setResults={() => {}} />);

    const input = screen.getByPlaceholderText(/search events/i);

    fireEvent.change(input, { target: { value: "Paris" } });

    expect(input.value).toBe("Paris");
  });

  //sort toggle
  test("toggles sort order", () => {
    render(<SearchBar setResults={() => {}} />);

    const btn = screen.getByText(/sort by price/i);

    fireEvent.click(btn);
    expect(btn.textContent).toContain("↑");

    fireEvent.click(btn);
    expect(btn.textContent).toContain("↓");
  });

  //clear filters (IMPORTANT FIX: open dropdown)
  test("clears filters correctly", () => {
    render(<SearchBar setResults={() => {}} />);

    const input = screen.getByPlaceholderText(/search events/i);
    fireEvent.change(input, { target: { value: "test" } });

    // deschide dropdown
    fireEvent.mouseEnter(screen.getByText(/filter/i));

    fireEvent.click(screen.getByText(/clear all filters/i));

    expect(input.value).toBe("");
  });

  //API success
  test("fetches and sets results on success", async () => {
    const mockData = [{ id: 1, name: "Paris Event" }];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const setResults = jest.fn();

    render(<SearchBar setResults={setResults} />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
      expect(setResults).toHaveBeenCalledWith(mockData);
    });
  });

  //API error
  test("handles API error", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
    });

    const setResults = jest.fn();

    render(<SearchBar setResults={setResults} />);

    await waitFor(() => {
      expect(setResults).toHaveBeenCalledWith([]);
    });
  });

  //test mini price + max price
  test("applies price filters", async () => {
  render(<SearchBar setResults={jest.fn()} />);

  fireEvent.mouseEnter(screen.getByText(/filter/i));

  const min = await screen.findByPlaceholderText("Min");
  const max = await screen.findByPlaceholderText("Max");

  fireEvent.change(min, { target: { value: "10" } });
  fireEvent.change(max, { target: { value: "100" } });

  expect(min.value).toBe("10");
  expect(max.value).toBe("100");
});

  //test location filter
  test("selects location filter", async () => {
  render(<SearchBar setResults={jest.fn()} />);

  fireEvent.mouseEnter(screen.getByText(/filter/i));

  const select = await screen.findByRole("combobox");

  fireEvent.change(select, { target: { value: "Paris" } });

  expect(select.value).toBe("Paris");
});

  //test pt sort
  test("cycles sort states", () => {
    render(<SearchBar setResults={() => {}} />);

    const btn = screen.getByText(/sort by price/i);

    fireEvent.click(btn); // asc
    fireEvent.click(btn); // desc
    fireEvent.click(btn); // none cycle complete
  });

});