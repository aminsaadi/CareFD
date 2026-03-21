import React from 'react';

const Logo = ({ size = 'default', className = '' }) => {
  const sizeClasses = {
    small: 'h-6',
    default: 'h-[4rem]',
    large: 'h-12'
  };

  return (
    <img 
      src="/logo.svg" 
      alt="CareFD" 
      className={`${sizeClasses[size] || sizeClasses.default} w-auto ${className}`}
      data-testid="logo"
    />
  );
};

export default Logo;
