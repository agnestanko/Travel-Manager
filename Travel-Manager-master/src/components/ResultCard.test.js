import { render, screen, fireEvent } from "@testing-library/react";
import ResultCard from "./ResultCard";

describe("ResultCard component", () => {

  //date mock pentru test
  const item = {
    name: "Castelul Bran",
    location: "Brasov",
    entryPrice: 40,
  };

  //verificare
  test("renders item information correctly", () => {
    render(<ResultCard item={item} onClick={() => {}} />);

    // verificare nume
    expect(screen.getByText("Castelul Bran")).toBeInTheDocument();

    // verificare locatie
    expect(screen.getByText("Brasov")).toBeInTheDocument();

    // verificare pret
    expect(screen.getByText("40 RON")).toBeInTheDocument();
  });

  //verificare onClick
  test("calls onClick when card is clicked", () => {
    const handleClick = jest.fn();

    render(<ResultCard item={item} onClick={handleClick} />);

    //cimulare click pe card (pe textul principal)
    fireEvent.click(screen.getByText("Castelul Bran"));

    //verificare dacă funcția a fosst apelată
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

});