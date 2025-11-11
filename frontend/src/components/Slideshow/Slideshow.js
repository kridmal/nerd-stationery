import React from "react";
import Slider from "react-slick";
import { Box } from "@mui/material";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Slideshow = () => {
  const images = [
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f",
    "https://images.unsplash.com/photo-1503602642458-232111445657",
  ];

  const settings = {
    dots: true,
    infinite: true,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3500,
    arrows: true,
  };

  return (
    <Box sx={{ width: "90%", margin: "auto", mt: 4 }}>
      <Slider {...settings}>
        {images.map((img, index) => (
          <Box key={index}>
            <img
              src={img}
              alt={`Slide ${index + 1}`}
              style={{
                width: "100%",
                height: "420px",
                objectFit: "cover",
                borderRadius: "12px",
              }}
            />
          </Box>
        ))}
      </Slider>
    </Box>
  );
};

export default Slideshow;
