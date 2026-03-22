import React from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext';

const Logo = ({ size = 'default', variant, className = '' }) => {
  const { settings, siteName } = useSiteSettings();

  const sizeClasses = {
    small: 'h-6',
    default: 'h-[4rem]',
    large: 'h-12'
  };

  const textSizeClasses = {
    small: 'text-lg',
    default: 'text-3xl',
    large: 'text-4xl'
  };

  const textColorClass = variant === 'white' ? 'text-white' : 'text-carefd-navy';

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
    <span
      className={`${textSizeClasses[size] || textSizeClasses.default} font-bold ${textColorClass} ${className}`}
      data-testid="logo"
    >
      {siteName}
    </span>
  );
};

export default Logo;
