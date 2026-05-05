import { render, screen, fireEvent } from "@testing-library/react";
import ImageGallery from "./ImageGallery";

const images = [
  "img1.jpg",
  "img2.jpg",
  "img3.jpg",
];

//mesaj cand nu exista imagini
test("shows empty message when no images", () => {
  render(<ImageGallery images={[]} />);

  expect(
    screen.getByText(/no images available yet/i)
  ).toBeInTheDocument();
});

//afisare prima imagine
test("renders first image", () => {
  render(<ImageGallery images={images} />);

  const img = screen.getByAltText(/gallery item 1/i);

  expect(img).toBeInTheDocument();
  expect(img).toHaveAttribute("src", "img1.jpg");
});

//testarea goNext
test("goes to next image", () => {
  render(<ImageGallery images={images} />);

  const nextButton = screen.getByText(">");

  fireEvent.click(nextButton);

  const img = screen.getByAltText(/gallery item 2/i);

  expect(img).toBeInTheDocument();
});

//testarea goPrevious 
test("goes to previous image from first", () => {
  render(<ImageGallery images={images} />);

  const prevButton = screen.getByText("<");

  fireEvent.click(prevButton);

  const img = screen.getByAltText(/gallery item 3/i);

  expect(img).toBeInTheDocument();
});

//apasare dot - schimba imaginea
test("changes image when dot is clicked", async () => {
  render(<ImageGallery images={images} />);

  const dots = screen
    .getAllByRole("button")
    .slice(2); // elimină săgețile

  fireEvent.click(dots[2]);

  const img = await screen.findByRole("img");

  expect(img).toHaveAttribute("src", "img3.jpg");
});