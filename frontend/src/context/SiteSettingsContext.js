import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const SiteSettingsContext = createContext({});

const DEFAULT_SETTINGS = {
  site_name: '',
  site_tagline: '',
  logo_url: '',
  favicon_url: '',
  contact_email: '',
  contact_phone: '',
  contact_address: '',
  footer_text: '',
  social_facebook: '',
  social_instagram: '',
  social_twitter: '',
  social_linkedin: '',
  social_youtube: '',
  footer_links: []
};

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/settings/public');
        if (response.data) {
          setSettings(prev => ({ ...prev, ...response.data }));
        }
      } catch {
        // Use defaults
      } finally {
        setLoaded(true);
      }
    };
    fetchSettings();
  }, []);

  const siteName = settings.site_name || DEFAULT_SETTINGS.site_name;

  return (
    <SiteSettingsContext.Provider value={{ settings, siteName, loaded }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);

export default SiteSettingsContext;
