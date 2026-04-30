import { useState } from "react";
import "./ImageGallery.css";

function ImageGallery({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="gallery-empty">
        No images available yet.
      </div>
    );
  }

  const goPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div className="image-gallery">
      <button className="gallery-arrow left" onClick={goPrevious}>
        &lt;
      </button>

      <img
        src={images[currentIndex]}
        alt={`Gallery item ${currentIndex + 1}`}
        className="gallery-main-image"
      />

      <button className="gallery-arrow right" onClick={goNext}>
        &gt;
      </button>

      <div className="gallery-dots">
        {images.map((_, index) => (
          <button
            key={index}
            className={index === currentIndex ? "dot active-dot" : "dot"}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}

export default ImageGallery;