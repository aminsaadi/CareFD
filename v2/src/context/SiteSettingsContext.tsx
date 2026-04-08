"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api-client";

interface SiteSettings {
  site_name: string;
  site_tagline: string;
  logo_url: string;
  favicon_url: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  footer_text: string;
  social_facebook: string;
  social_instagram: string;
  social_twitter: string;
  social_linkedin: string;
  social_youtube: string;
  footer_links: any[];
  app_name: string;
  app_short_name: string;
  app_icon_url: string;
  app_theme_color: string;
  app_background_color: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  [key: string]: any;
}

interface SiteSettingsContextType {
  settings: SiteSettings;
  siteName: string;
  loaded: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  site_name: "CareFD",
  site_tagline: "שירותי בריאות פרמיום בישראל",
  logo_url: "",
  favicon_url: "",
  contact_email: "",
  contact_phone: "",
  contact_address: "",
  footer_text: "",
  social_facebook: "",
  social_instagram: "",
  social_twitter: "",
  social_linkedin: "",
  social_youtube: "",
  footer_links: [],
  app_name: "CareFD",
  app_short_name: "CareFD",
  app_icon_url: "",
  app_theme_color: "#19B8BA",
  app_background_color: "#ffffff",
  maintenance_mode: false,
  maintenance_message: "",
};

const CACHE_KEY = "carefd_site_settings";

const getCachedSettings = (): SiteSettings => {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return { ...DEFAULT_SETTINGS, ...JSON.parse(cached) };
  } catch {}
  return DEFAULT_SETTINGS;
};

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: DEFAULT_SETTINGS,
  siteName: DEFAULT_SETTINGS.site_name,
  loaded: false,
  maintenanceMode: false,
  maintenanceMessage: "",
});

export const SiteSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<SiteSettings>(getCachedSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get<any>("/settings/public")
      .then((data) => {
        if (data) {
          const newSettings = { ...DEFAULT_SETTINGS, ...data };
          setSettings(newSettings);
          try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}

          // Update meta tags dynamically
          const appName = newSettings.app_name || newSettings.site_name;
          if (appName) {
            document.title = newSettings.site_tagline
              ? `${appName} - ${newSettings.site_tagline}`
              : appName;
          }

          // Theme color
          if (newSettings.app_theme_color) {
            const meta = document.querySelector('meta[name="theme-color"]');
            if (meta) meta.setAttribute("content", newSettings.app_theme_color);
          }

          // Favicon
          if (newSettings.favicon_url) {
            const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
            if (link) link.href = newSettings.favicon_url;
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const value: SiteSettingsContextType = {
    settings,
    siteName: settings.site_name || DEFAULT_SETTINGS.site_name,
    loaded,
    maintenanceMode: settings.maintenance_mode || false,
    maintenanceMessage: settings.maintenance_message || "",
  };

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);
export default SiteSettingsContext;
