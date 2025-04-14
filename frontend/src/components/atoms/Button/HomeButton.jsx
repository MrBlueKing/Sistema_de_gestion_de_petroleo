
// src/components/atoms/Button/HomeButton.jsx
import React from "react";
import { FaHome } from "react-icons/fa";
import { Link } from "react-router-dom";

const HomeButton = () => {
  return (
    <Link to="/" className="text-black">
      <FaHome className="w-6 h-6" />
    </Link>
  );
};

export default HomeButton;

