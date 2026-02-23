import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube, FaPhone, FaEnvelope, FaMapMarkerAlt, FaArrowUp } from 'react-icons/fa';
import api from '../utils/api';

const Footer = () => {
  const [settings, setSettings] = useState({
    contact_phone: '03-1234567',
    contact_email: 'info@carelink.co.il',
    contact_address: 'תל אביב, ישראל',
    footer_text: '© 2025 CareLink. All rights reserved.',
    social_facebook: '',
    social_instagram: '',
    social_twitter: '',
    social_linkedin: '',
    social_youtube: '',
    footer_links: []
  });
  const [regions, setRegions] = useState([]);

  useEffect(() => {
    fetchSettings();
    fetchRegions();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/public');
      if (response.data) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      // Use defaults silently
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await api.get('/regions');
      setRegions(response.data.regions || []);
    } catch (error) {
      setRegions([
        { name: 'תל אביב', cities: ['רמת גן', 'גבעתיים', 'הרצליה'] },
        { name: 'ירושלים', cities: ['בית שמש', 'מודיעין'] },
        { name: 'חיפה', cities: ['כרמיאל', 'עכו', 'נהריה'] },
        { name: 'באר שבע', cities: ['אשדוד', 'אשקלון'] }
      ]);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-carelink-deep text-white mt-auto">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="grid md:grid-cols-5 gap-12 lg:gap-16">
          {/* Company Info */}
          <div className="md:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm px-5 py-3 rounded-2xl inline-block mb-6">
              <Logo />
            </div>
            <p className="text-carelink-gold font-medium mb-4 tracking-wide text-sm">
              Connecting Care Providers
            </p>
            <p className="text-carelink-light-gray/70 leading-relaxed">
              פלטפורמה משולבת המחברת בין מטופלים לספקי שירותי בריאות איכותיים.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-serif font-bold mb-6 text-white">קישורים מהירים</h3>
            <ul className="space-y-4">
              {[
                { to: '/', label: 'בית' },
                { to: '/providers', label: 'ספקים' },
                { to: '/services', label: 'שירותים' },
                { to: '/about', label: 'אודות' },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-carelink-light-gray/70 hover:text-carelink-teal transition-all duration-300 link-underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Regions/Cities */}
          <div>
            <h3 className="text-lg font-serif font-bold mb-6 text-white">אזורים וערים</h3>
            <ul className="space-y-4">
              {regions.slice(0, 5).map((region, index) => (
                <li key={index}>
                  <Link 
                    to={`/providers?city=${encodeURIComponent(region.name || region)}`} 
                    className="text-carelink-light-gray/70 hover:text-carelink-teal transition-all duration-300 link-underline"
                  >
                    {region.name || region}
                  </Link>
                </li>
              ))}
              <li>
                <Link 
                  to="/providers" 
                  className="text-carelink-teal hover:text-carelink-teal-light transition-all duration-300 text-sm font-medium"
                >
                  כל האזורים ←
                </Link>
              </li>
            </ul>
          </div>

          {/* For Providers */}
          <div>
            <h3 className="text-lg font-serif font-bold mb-6 text-white">לספקים</h3>
            <ul className="space-y-4">
              {[
                { to: '/register/provider', label: 'הירשם כספק' },
                { to: '/provider/dashboard', label: 'דשבורד ספק' },
                { to: '/pricing', label: 'מחירונים' },
                { to: '/help', label: 'מרכז עזרה' },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-carelink-light-gray/70 hover:text-carelink-teal transition-all duration-300 link-underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-serif font-bold mb-6 text-white">צור קשר</h3>
            <ul className="space-y-5">
              <li className="flex items-center gap-4 text-carelink-light-gray/70">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                  <FaPhone className="text-carelink-teal" />
                </div>
                <span dir="ltr" className="font-medium">{settings.contact_phone}</span>
              </li>
              <li className="flex items-center gap-4 text-carelink-light-gray/70">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                  <FaEnvelope className="text-carelink-teal" />
                </div>
                <span>{settings.contact_email}</span>
              </li>
              <li className="flex items-center gap-4 text-carelink-light-gray/70">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                  <FaMapMarkerAlt className="text-carelink-teal" />
                </div>
                <span>{settings.contact_address}</span>
              </li>
            </ul>

            {/* Social Media */}
            <div className="flex gap-3 mt-8">
              {settings.social_facebook && (
                <a 
                  href={settings.social_facebook} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center hover:bg-carelink-teal transition-all duration-300"
                >
                  <FaFacebook className="text-lg" />
                </a>
              )}
              {settings.social_twitter && (
                <a 
                  href={settings.social_twitter} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center hover:bg-carelink-teal transition-all duration-300"
                >
                  <FaTwitter className="text-lg" />
                </a>
              )}
              {settings.social_instagram && (
                <a 
                  href={settings.social_instagram} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center hover:bg-carelink-teal transition-all duration-300"
                >
                  <FaInstagram className="text-lg" />
                </a>
              )}
              {settings.social_linkedin && (
                <a 
                  href={settings.social_linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center hover:bg-carelink-teal transition-all duration-300"
                >
                  <FaLinkedin className="text-lg" />
                </a>
              )}
              {settings.social_youtube && (
                <a 
                  href={settings.social_youtube} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center hover:bg-carelink-teal transition-all duration-300"
                >
                  <FaYoutube className="text-lg" />
                </a>
              )}
              {/* Show defaults if no social links */}
              {!settings.social_facebook && !settings.social_twitter && !settings.social_instagram && !settings.social_linkedin && (
                <>
                  <span className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center opacity-40">
                    <FaFacebook className="text-lg" />
                  </span>
                  <span className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center opacity-40">
                    <FaInstagram className="text-lg" />
                  </span>
                  <span className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center opacity-40">
                    <FaLinkedin className="text-lg" />
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-carelink-light-gray/60 text-sm">
              {settings.footer_text}
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-sm">
              {[
                { to: '/about', label: 'אודות' },
                { to: '/privacy', label: 'מדיניות פרטיות' },
                { to: '/terms', label: 'תנאי שימוש' },
                { to: '/contact', label: 'צור קשר' },
              ].map((link) => (
                <Link 
                  key={link.to}
                  to={link.to} 
                  className="text-carelink-light-gray/60 hover:text-carelink-teal transition-all duration-300"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            
            {/* Scroll to top button */}
            <button
              onClick={scrollToTop}
              className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center hover:bg-carelink-teal transition-all duration-300 text-carelink-light-gray hover:text-white"
              aria-label="חזרה למעלה"
            >
              <FaArrowUp />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
