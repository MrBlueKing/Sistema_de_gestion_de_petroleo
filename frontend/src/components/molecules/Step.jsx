import React from "react";
import StepIcon from "../atoms/Icons/IconStep";
import StepLabel from "../atoms/Typography/Label";

const Step = ({ icon, label, active }) => {
    return (
      <div className="flex flex-col sm:flex-row items-center text-center sm:text-left">
        <StepIcon active={active}>{icon}</StepIcon>
        <StepLabel label={label} active={active} />
      </div>
    );
  };

export default Step;
