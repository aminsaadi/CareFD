import React from 'react';

const Logo = ({ className = "", size = "default" }) => {
  const sizes = {
    small: "text-xl",
    default: "text-2xl",
    large: "text-4xl"
  };

  return (
    <div className={`flex items-center ${className}`}>
      <span className={`${sizes[size]} font-bold font-heading`}>
        <span className="text-carelink-teal">Care</span>
        <span className="text-carelink-navy">Link</span>
      </span>
    </div>
  );
};

export default Logo;
