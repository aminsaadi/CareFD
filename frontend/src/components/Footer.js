import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
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
  const [staticPages, setStaticPages] = useState([]);

  useEffect(() => {
    fetchSettings();
    fetchRegions();
    fetchStaticPages();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/public');
      if (response.data) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      // Use defaults
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await api.get('/regions');
      setRegions(response.data.regions || []);
    } catch (error) {
      setRegions([]);
    }
  };

  const fetchStaticPages = async () => {
    try {
      const response = await api.get('/admin/pages');
      const pages = (response.data.pages || []).filter(p => p.is_active !== false);
      setStaticPages(pages);
    } catch (error) {
      setStaticPages([]);
    }
  };

  const getPageLink = (page) => {
    const slugMap = {
      'about': '/about',
      'privacy': '/privacy',
      'terms': '/terms',
      'contact': '/contact'
    };
    return slugMap[page.slug] || `/page/${page.slug}`;
  };

  const defaultBottomLinks = [
    { label: 'אודות', to: '/about' },
    { label: 'מדיניות פרטיות', to: '/privacy' },
    { label: 'תנאי שימוש', to: '/terms' },
    { label: 'צור קשר', to: '/contact' }
  ];

  const bottomLinks = staticPages.length > 0
    ? staticPages.map(p => ({ label: p.title, to: getPageLink(p) }))
    : defaultBottomLinks;

  return (
    <footer className="bg-carelink-navy text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="md:col-span-1">
            <div className="bg-white px-4 py-2 rounded-lg inline-block mb-4">
              <Logo />
            </div>
            <p className="text-carelink-teal-light mb-4 text-sm">
              Connecting Care Providers
            </p>
            <p className="text-carelink-light-gray text-sm">
              פלטפורמה משולבת המחברת בין מטופלים לספקי שירותי בריאות.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-carelink-teal">קישורים מהירים</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-carelink-light-gray hover:text-carelink-teal transition">בית</Link>
              </li>
              <li>
                <Link to="/providers" className="text-carelink-light-gray hover:text-carelink-teal transition">ספקים</Link>
              </li>
              <li>
                <Link to="/services" className="text-carelink-light-gray hover:text-carelink-teal transition">שירותים</Link>
              </li>
              {staticPages.filter(p => ['about'].includes(p.slug)).map(p => (
                <li key={p.slug}>
                  <Link to={getPageLink(p)} className="text-carelink-light-gray hover:text-carelink-teal transition">
                    {p.title}
                  </Link>
                </li>
              ))}
              {staticPages.filter(p => ['about'].includes(p.slug)).length === 0 && (
                <li>
                  <Link to="/about" className="text-carelink-light-gray hover:text-carelink-teal transition">אודות</Link>
                </li>
              )}
            </ul>
          </div>

          {/* Regions/Cities */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-carelink-teal">אזורים וערים</h3>
            <ul className="space-y-2">
              {regions.slice(0, 6).map((region, index) => (
                <li key={index}>
                  <Link 
                    to={`/providers?city=${encodeURIComponent(region.name || region)}`} 
                    className="text-carelink-light-gray hover:text-carelink-teal transition"
                  >
                    {region.name || region}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/providers" className="text-carelink-teal hover:text-carelink-teal-light transition text-sm">
                  כל האזורים
                </Link>
              </li>
            </ul>
          </div>

          {/* For Providers */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-carelink-teal">לספקים</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/register/provider" className="text-carelink-light-gray hover:text-carelink-teal transition">
                  הירשם כספק
                </Link>
              </li>
              <li>
                <Link to="/provider/dashboard" className="text-carelink-light-gray hover:text-carelink-teal transition">
                  דשבורד ספק
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-carelink-teal">צור קשר</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-carelink-light-gray">
                <FaPhone className="text-carelink-teal" />
                <span dir="ltr">{settings.contact_phone}</span>
              </li>
              <li className="flex items-center gap-2 text-carelink-light-gray">
                <FaEnvelope className="text-carelink-teal" />
                <span>{settings.contact_email}</span>
              </li>
              <li className="flex items-center gap-2 text-carelink-light-gray">
                <FaMapMarkerAlt className="text-carelink-teal" />
                <span>{settings.contact_address}</span>
              </li>
            </ul>

            <div className="flex gap-3 mt-4">
              {settings.social_facebook && (
                <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="bg-carelink-slate p-2 rounded-full hover:bg-carelink-teal transition">
                  <FaFacebook className="text-lg" />
                </a>
              )}
              {settings.social_twitter && (
                <a href={settings.social_twitter} target="_blank" rel="noopener noreferrer" className="bg-carelink-slate p-2 rounded-full hover:bg-carelink-teal transition">
                  <FaTwitter className="text-lg" />
                </a>
              )}
              {settings.social_instagram && (
                <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="bg-carelink-slate p-2 rounded-full hover:bg-carelink-teal transition">
                  <FaInstagram className="text-lg" />
                </a>
              )}
              {settings.social_linkedin && (
                <a href={settings.social_linkedin} target="_blank" rel="noopener noreferrer" className="bg-carelink-slate p-2 rounded-full hover:bg-carelink-teal transition">
                  <FaLinkedin className="text-lg" />
                </a>
              )}
              {settings.social_youtube && (
                <a href={settings.social_youtube} target="_blank" rel="noopener noreferrer" className="bg-carelink-slate p-2 rounded-full hover:bg-carelink-teal transition">
                  <FaYoutube className="text-lg" />
                </a>
              )}
              {!settings.social_facebook && !settings.social_twitter && !settings.social_instagram && !settings.social_linkedin && (
                <>
                  <span className="bg-carelink-slate p-2 rounded-full opacity-50"><FaFacebook className="text-lg" /></span>
                  <span className="bg-carelink-slate p-2 rounded-full opacity-50"><FaInstagram className="text-lg" /></span>
                  <span className="bg-carelink-slate p-2 rounded-full opacity-50"><FaLinkedin className="text-lg" /></span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - synced with admin static pages */}
      <div className="border-t border-carelink-slate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-carelink-light-gray text-sm">
              {settings.footer_text}
            </p>
            <div className="flex gap-6 text-sm flex-wrap justify-center">
              {bottomLinks.map((link, i) => (
                <Link key={i} to={link.to} className="text-carelink-light-gray hover:text-carelink-teal transition">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
