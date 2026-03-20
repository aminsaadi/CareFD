import React from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext';

const Logo = ({ size = 'default', className = '' }) => {
  const { settings, siteName } = useSiteSettings();

  const sizeClasses = {
    small: 'h-6',
    default: 'h-[4rem]',
    large: 'h-12'
  };

  if (settings.logo_url) {
    return (
      <img
        src={settings.logo_url}
        alt={siteName}
        className={`${sizeClasses[size] || sizeClasses.default} w-auto ${className}`}
        data-testid="logo"
      />
    );
  }

  return (
    <img
      src="/logo.svg"
      alt={siteName}
      className={`${sizeClasses[size] || sizeClasses.default} w-auto ${className}`}
      data-testid="logo"
    />
  );
};

export default Logo;
