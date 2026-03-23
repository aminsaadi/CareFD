import React from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext';

const Logo = ({ size = 'default', variant, className = '' }) => {
  const { settings, siteName } = useSiteSettings();
  const [imgError, setImgError] = React.useState(false);

  const sizeClasses = {
    small: 'h-6',
    default: 'h-[6rem]',
    large: 'h-12'
  };

  const textSizeClasses = {
    small: 'text-lg',
    default: 'text-3xl',
    large: 'text-4xl'
  };

  const textColorClass = variant === 'white' ? 'text-white' : 'text-carefd-navy';

  if (settings.logo_url && !imgError) {
    return (
      <img
        src={settings.logo_url}
        alt={siteName || 'CareFD'}
        className={`${sizeClasses[size] || sizeClasses.default} w-auto ${className}`}
        data-testid="logo"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <span
      className={`${textSizeClasses[size] || textSizeClasses.default} font-bold ${textColorClass} ${className}`}
      data-testid="logo"
    >
      {siteName || 'CareFD'}
    </span>
  );
};

export default Logo;
