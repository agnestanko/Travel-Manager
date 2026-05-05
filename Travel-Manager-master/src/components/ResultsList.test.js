import { render, screen, fireEvent } from "@testing-library/react";
import ResultsList from "./ResultsList";

// mock pentru react-router-dom (useNavigate)
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// mock pentru ResultCard (nu testăm aici componenta copil)
jest.mock("./ResultCard", () => (props) => {
  return (
    <div
      data-testid={`card-${props.item.id}`}
      onClick={props.onClick}
    >
      {props.item.name}
    </div>
  );
});

describe("ResultsList component", () => {

  //nu există rezultate
  test("shows no results message when list is empty", () => {
    render(<ResultsList results={[]} />);

    expect(screen.getByText(/no events found/i)).toBeInTheDocument();
  });

  //afișează lista de rezultate
  test("renders results list correctly", () => {
    const results = [
      { id: 1, name: "Castelul Bran" },
      { id: 2, name: "Delta Dunarii" },
    ];

    render(<ResultsList results={results} />);

    expect(screen.getByText("Castelul Bran")).toBeInTheDocument();
    expect(screen.getByText("Delta Dunarii")).toBeInTheDocument();
  });

  //click pe card - navigare
  test("navigates to attraction page on click", () => {
    const results = [
      { id: 1, name: "Castelul Bran" },
    ];

    render(<ResultsList results={results} />);

    fireEvent.click(screen.getByTestId("card-1"));

    expect(mockNavigate).toHaveBeenCalledWith("/attraction/1");
  });

});