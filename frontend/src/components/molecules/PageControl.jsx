// src/components/molecules/PageControl.jsx
import React from "react";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";
import IconButton from "../atoms/Button/IconButton";

const PageControl = ({ currentPage, totalPages, onPageChange }) => {
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-center space-x-4">
      <IconButton
        icon={<FaArrowLeft />}
        onClick={goToPreviousPage}
        disabled={currentPage === 1}
        className="text-black"
      />
      <span className="text-sm font-medium">{currentPage} / {totalPages}</span>
      <IconButton
        icon={<FaArrowRight />}
        onClick={goToNextPage}
        disabled={currentPage === totalPages}
        className="text-black"
      />
    </div>
  );
};

export default PageControl;
