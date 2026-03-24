import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube, FaPhone, FaEnvelope, FaMapMarkerAlt, FaDownload, FaMobileAlt } from 'react-icons/fa';
import api from '../utils/api';
import { useSiteSettings } from '../context/SiteSettingsContext';
import usePWAInstall from '../hooks/usePWAInstall';

const Footer = () => {
  const { settings: siteSettings, siteName } = useSiteSettings();
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [settings, setSettings] = useState({
    contact_phone: '03-1234567',
    contact_email: '',
    contact_address: 'תל אביב, ישראל',
    footer_text: '',
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
      // Falls back to default links if admin endpoint is not accessible
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
    <footer className="bg-carefd-navy text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="md:col-span-1">
            <div className="bg-white px-4 py-2 rounded-lg inline-block mb-4">
              <Logo />
            </div>
            <p className="text-carefd-teal-light mb-4 text-sm">
              {siteSettings.site_tagline || 'Connecting Care Providers'}
            </p>
            <p className="text-carefd-light-gray text-sm">
              פלטפורמה משולבת המחברת בין מטופלים לספקי שירותי בריאות.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-carefd-teal">קישורים מהירים</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-carefd-light-gray hover:text-carefd-teal transition">בית</Link>
              </li>
              <li>
                <Link to="/providers" className="text-carefd-light-gray hover:text-carefd-teal transition">ספקים</Link>
              </li>
              <li>
                <Link to="/services" className="text-carefd-light-gray hover:text-carefd-teal transition">שירותים</Link>
              </li>
              {staticPages.filter(p => ['about'].includes(p.slug)).map(p => (
                <li key={p.slug}>
                  <Link to={getPageLink(p)} className="text-carefd-light-gray hover:text-carefd-teal transition">
                    {p.title}
                  </Link>
                </li>
              ))}
              {staticPages.filter(p => ['about'].includes(p.slug)).length === 0 && (
                <li>
                  <Link to="/about" className="text-carefd-light-gray hover:text-carefd-teal transition">אודות</Link>
                </li>
              )}
            </ul>
          </div>

          {/* Regions/Cities */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-carefd-teal">אזורים וערים</h3>
            <ul className="space-y-2">
              {regions.slice(0, 6).map((region, index) => (
                <li key={index}>
                  <Link 
                    to={`/providers?city=${encodeURIComponent(region.name || region)}`} 
                    className="text-carefd-light-gray hover:text-carefd-teal transition"
                  >
                    {region.name || region}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/providers" className="text-carefd-teal hover:text-carefd-teal-light transition text-sm">
                  כל האזורים
                </Link>
              </li>
            </ul>
          </div>

          {/* For Providers */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-carefd-teal">לספקים</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/register/provider" className="text-carefd-light-gray hover:text-carefd-teal transition">
                  הירשם כספק
                </Link>
              </li>
              <li>
                <Link to="/provider/dashboard" className="text-carefd-light-gray hover:text-carefd-teal transition">
                  דשבורד ספק
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-carefd-teal">צור קשר</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-carefd-light-gray">
                <FaPhone className="text-carefd-teal" />
                <span dir="ltr">{settings.contact_phone}</span>
              </li>
              <li className="flex items-center gap-2 text-carefd-light-gray">
                <FaEnvelope className="text-carefd-teal" />
                <span>{settings.contact_email}</span>
              </li>
              <li className="flex items-center gap-2 text-carefd-light-gray">
                <FaMapMarkerAlt className="text-carefd-teal" />
                <span>{settings.contact_address}</span>
              </li>
            </ul>

            <div className="flex gap-3 mt-4">
              {settings.social_facebook && (
                <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="bg-carefd-slate p-2 rounded-full hover:bg-carefd-teal transition">
                  <FaFacebook className="text-lg" />
                </a>
              )}
              {settings.social_twitter && (
                <a href={settings.social_twitter} target="_blank" rel="noopener noreferrer" className="bg-carefd-slate p-2 rounded-full hover:bg-carefd-teal transition">
                  <FaTwitter className="text-lg" />
                </a>
              )}
              {settings.social_instagram && (
                <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="bg-carefd-slate p-2 rounded-full hover:bg-carefd-teal transition">
                  <FaInstagram className="text-lg" />
                </a>
              )}
              {settings.social_linkedin && (
                <a href={settings.social_linkedin} target="_blank" rel="noopener noreferrer" className="bg-carefd-slate p-2 rounded-full hover:bg-carefd-teal transition">
                  <FaLinkedin className="text-lg" />
                </a>
              )}
              {settings.social_youtube && (
                <a href={settings.social_youtube} target="_blank" rel="noopener noreferrer" className="bg-carefd-slate p-2 rounded-full hover:bg-carefd-teal transition">
                  <FaYoutube className="text-lg" />
                </a>
              )}
              {!settings.social_facebook && !settings.social_twitter && !settings.social_instagram && !settings.social_linkedin && (
                <>
                  <span className="bg-carefd-slate p-2 rounded-full opacity-50"><FaFacebook className="text-lg" /></span>
                  <span className="bg-carefd-slate p-2 rounded-full opacity-50"><FaInstagram className="text-lg" /></span>
                  <span className="bg-carefd-slate p-2 rounded-full opacity-50"><FaLinkedin className="text-lg" /></span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Download App Banner */}
      {!isInstalled && (
        <div className="border-t border-carefd-slate">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-gradient-to-l from-carefd-teal/20 to-carefd-navy rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-carefd-teal/20 p-3 rounded-full">
                  <FaMobileAlt className="text-carefd-teal text-2xl" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">הורד את האפליקציה</h4>
                  <p className="text-carefd-light-gray text-sm">גישה מהירה מהמסך הראשי של הטלפון</p>
                </div>
              </div>
              {canInstall ? (
                <button
                  onClick={install}
                  className="bg-carefd-teal text-white px-6 py-3 rounded-lg hover:bg-carefd-teal-medium transition-colors font-bold flex items-center gap-2 whitespace-nowrap"
                >
                  <FaDownload />
                  התקן אפליקציה
                </button>
              ) : isIOS ? (
                <div className="relative">
                  <button
                    onClick={() => setShowIOSGuide(!showIOSGuide)}
                    className="bg-carefd-teal text-white px-6 py-3 rounded-lg hover:bg-carefd-teal-medium transition-colors font-bold flex items-center gap-2 whitespace-nowrap"
                  >
                    <FaDownload />
                    הוסף למסך הבית
                  </button>
                  {showIOSGuide && (
                    <div className="absolute bottom-full mb-3 left-0 right-0 bg-white text-carefd-navy p-4 rounded-xl shadow-xl text-sm w-72 z-50">
                      <p className="font-bold mb-2">להתקנה באייפון:</p>
                      <ol className="space-y-1 list-decimal list-inside text-carefd-slate">
                        <li>לחץ על כפתור השיתוף <span className="inline-block rotate-90">⤴</span></li>
                        <li>גלול למטה ובחר "הוסף למסך הבית"</li>
                        <li>לחץ "הוסף"</li>
                      </ol>
                      <button onClick={() => setShowIOSGuide(false)} className="mt-2 text-carefd-teal text-xs">סגור</button>
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-carefd-light-gray text-sm">
                  פתח ב-Chrome להתקנת האפליקציה
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar - synced with admin static pages */}
      <div className="border-t border-carefd-slate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-carefd-light-gray text-sm">
              {settings.footer_text}
            </p>
            <div className="flex gap-6 text-sm flex-wrap justify-center">
              {bottomLinks.map((link, i) => (
                <Link key={i} to={link.to} className="text-carefd-light-gray hover:text-carefd-teal transition">
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
