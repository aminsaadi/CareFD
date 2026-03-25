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
  footer_links: [],
  app_name: '',
  app_short_name: '',
  app_icon_url: '',
  app_theme_color: '#19B8BA',
  app_background_color: '#ffffff',
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
          const appName = newSettings.app_name || newSettings.site_name;
          if (appName) {
            const tagline = newSettings.site_tagline;
            document.title = tagline
              ? `${appName} - ${tagline}`
              : appName;
          }
          if (newSettings.site_tagline) {
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', newSettings.site_tagline);
          }

          // Update theme-color meta tag
          if (newSettings.app_theme_color) {
            const metaTheme = document.querySelector('meta[name="theme-color"]');
            if (metaTheme) metaTheme.setAttribute('content', newSettings.app_theme_color);
          }

          // Update apple-mobile-web-app-title
          if (newSettings.app_short_name || newSettings.site_name) {
            const metaAppTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
            if (metaAppTitle) metaAppTitle.setAttribute('content', newSettings.app_short_name || newSettings.site_name);
          }

          // Update apple-touch-icon if app_icon_url is set
          if (newSettings.app_icon_url) {
            const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
            if (appleIcon) appleIcon.setAttribute('href', newSettings.app_icon_url);
          }

          // Point manifest to dynamic API endpoint
          const manifestLink = document.querySelector('link[rel="manifest"]');
          if (manifestLink) {
            const apiBase = process.env.REACT_APP_API_URL || '';
            const manifestUrl = apiBase ? `${apiBase}/manifest.json` : '/manifest.json';
            if (manifestLink.getAttribute('href') !== manifestUrl) {
              manifestLink.setAttribute('href', manifestUrl);
            }
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
