import React from "react";

const StepLine = ({ active }) => {
    return (
      <div className={`hidden sm:block flex-1 h-1 mx-4 ${active ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
    );
  };

export default StepLine;
