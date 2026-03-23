import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const SiteSettingsContext = createContext({});

const SETTINGS_CACHE_KEY = 'site_settings_cache';

const DEFAULT_SETTINGS = {
  site_name: 'CareFD',
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

const getCachedSettings = () => {
  try {
    const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (cached) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(cached) };
    }
  } catch {
    // Ignore invalid cache
  }
  return DEFAULT_SETTINGS;
};

export const SiteSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(getCachedSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/settings/public');
        if (response.data) {
          const newSettings = { ...DEFAULT_SETTINGS, ...response.data };
          setSettings(newSettings);
          try {
            localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(response.data));
          } catch {
            // Ignore storage errors
          }

          // Update document title and meta from DB settings
          if (newSettings.site_name) {
            const tagline = newSettings.site_tagline;
            document.title = tagline
              ? `${newSettings.site_name} - ${tagline}`
              : newSettings.site_name;
          }
          if (newSettings.site_tagline) {
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', newSettings.site_tagline);
          }
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
