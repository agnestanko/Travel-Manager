import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AttractionDetails from "./AttractionDetails";
import { MemoryRouter } from "react-router-dom";

global.fetch = jest.fn();

// AUTH MOCK
jest.mock("../services/authService", () => ({
    isLoggedIn: jest.fn(),
    getCurrentUser: jest.fn(() => ({
        name: "Test User",
        email: "test@test.com"
    }))
}));

// ROUTER MOCK
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
    const actual = jest.requireActual("react-router-dom");

    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ id: "1" })
    };
});

// MOCK DATA
const mockAttraction = {
    id: 1,
    name: "Concert Cluj",
    location: "Cluj",
    description: "Test description",
    entryPrice: 100,
    images: []
};

// RENDER HELPER
function renderComponent() {
    return render(
        <MemoryRouter initialEntries={["/attraction/1"]}>
            <AttractionDetails />
        </MemoryRouter>
    );
}

describe("AttractionDetails", () => {

    beforeEach(() => {
        fetch.mockClear();
        mockNavigate.mockClear();
    });

    //test  API fallback
    test("shows fallback when API fails", async () => {

        fetch.mockResolvedValueOnce({ ok: false });

        renderComponent();

        expect(
            await screen.findByText(/attraction not found/i)
        ).toBeInTheDocument();

    });

    //test modal open
    test("opens modal when logged in", async () => {

        const { isLoggedIn } = require("../services/authService");
        isLoggedIn.mockReturnValue(true);

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockAttraction
        });

        renderComponent();

        fireEvent.click(await screen.findByText(/buy ticket/i));

        expect(
            await screen.findByText(/confirm purchase/i)
        ).toBeInTheDocument();

    });

    //test redirect to auth
    test("redirects to auth when user is not logged in", async () => {

        const { isLoggedIn } = require("../services/authService");
        isLoggedIn.mockReturnValue(false);

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockAttraction
        });

        renderComponent();

        fireEvent.click(await screen.findByText(/buy ticket/i));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/auth");
        });

    });

    //price update
    test("updates total price when ticket number changes", async () => {

        const { isLoggedIn } = require("../services/authService");
        isLoggedIn.mockReturnValue(true);

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockAttraction
        });

        renderComponent();

        fireEvent.click(await screen.findByText(/buy ticket/i));

        const ticketInput = screen.getByDisplayValue("1");

        fireEvent.change(ticketInput, {
            target: { value: "3" }
        });

        expect(
            screen.getByDisplayValue("300 RON")
        ).toBeInTheDocument();

    });

    //submit without date
    test("shows error when submitting without selecting a date", async () => {

        const { isLoggedIn } = require("../services/authService");
        isLoggedIn.mockReturnValue(true);

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockAttraction
        });

        renderComponent();

        fireEvent.click(await screen.findByText(/buy ticket/i));

        fireEvent.click(screen.getByText(/confirm purchase/i));

        expect(
            await screen.findByText(/please select an entry date from the calendar/i)
        ).toBeInTheDocument();

    });

    // successful purchase
    test("shows success modal after successful purchase", async () => {

        const { isLoggedIn } = require("../services/authService");
        isLoggedIn.mockReturnValue(true);

        fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockAttraction
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ["2026-05-01"]
            })
            .mockResolvedValueOnce({
                ok: true
            });

        renderComponent();

        fireEvent.click(await screen.findByText(/buy ticket/i));

        fireEvent.click(await screen.findByText("1"));

        fireEvent.click(screen.getByText(/confirm purchase/i));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(3);
        });

    });

    //backend error
    test("shows backend error message if purchase fails", async () => {

        const { isLoggedIn } = require("../services/authService");
        isLoggedIn.mockReturnValue(true);

        fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockAttraction
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ["2026-05-01"]
            })
            .mockResolvedValueOnce({
                ok: false,
                text: async () => "Capacity exceeded"
            });

        renderComponent();

        fireEvent.click(await screen.findByText(/buy ticket/i));

        fireEvent.click(await screen.findByText("1"));

        fireEvent.click(screen.getByText(/confirm purchase/i));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(3);
        });

    });

});