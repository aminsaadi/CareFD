"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube, FaPhone, FaEnvelope, FaMapMarkerAlt, FaDownload, FaMobileAlt } from 'react-icons/fa';
import api from '@/lib/api-client';

interface FooterSettings {
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  footer_text: string;
  social_facebook: string;
  social_instagram: string;
  social_twitter: string;
  social_linkedin: string;
  social_youtube: string;
  site_tagline: string;
}

interface Region {
  name: string;
}

const Footer = () => {
  const [settings, setSettings] = useState<FooterSettings>({
    contact_phone: '03-1234567',
    contact_email: '',
    contact_address: 'תל אביב, ישראל',
    footer_text: '',
    social_facebook: '',
    social_instagram: '',
    social_twitter: '',
    social_linkedin: '',
    social_youtube: '',
    site_tagline: 'Connecting Care Providers',
  });
  const [regions, setRegions] = useState<Region[]>([]);

  useEffect(() => {
    api.get<FooterSettings>('/settings/public').then(data => {
      if (data) setSettings(prev => ({ ...prev, ...data }));
    }).catch(() => {});

    api.get<{ regions: Region[] }>('/regions').then(data => {
      setRegions(data.regions || []);
    }).catch(() => {});
  }, []);

  const defaultBottomLinks = [
    { label: 'אודות', to: '/about' },
    { label: 'מדיניות פרטיות', to: '/privacy' },
    { label: 'תנאי שימוש', to: '/terms' },
    { label: 'צור קשר', to: '/contact' },
  ];

  return (
    <footer className="bg-carefd-navy text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="md:col-span-1">
            <div className="bg-white px-4 py-2 rounded-lg inline-block mb-4">
              <span className="text-xl font-bold text-carefd-navy">CareFD</span>
            </div>
            <p className="text-carefd-teal-light mb-4 text-sm">
              {settings.site_tagline}
            </p>
            <p className="text-carefd-light-gray text-sm">
              פלטפורמה משולבת המחברת בין מטופלים לספקי שירותי בריאות.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-carefd-teal">קישורים מהירים</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-carefd-light-gray hover:text-carefd-teal transition">בית</Link></li>
              <li><Link href="/providers" className="text-carefd-light-gray hover:text-carefd-teal transition">ספקים</Link></li>
              <li><Link href="/services" className="text-carefd-light-gray hover:text-carefd-teal transition">שירותים</Link></li>
              <li><Link href="/about" className="text-carefd-light-gray hover:text-carefd-teal transition">אודות</Link></li>
            </ul>
          </div>

          {/* Regions/Cities */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-carefd-teal">אזורים וערים</h3>
            <ul className="space-y-2">
              {regions.slice(0, 6).map((region, index) => (
                <li key={index}>
                  <Link href={`/providers?city=${encodeURIComponent(region.name)}`} className="text-carefd-light-gray hover:text-carefd-teal transition">
                    {region.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/providers" className="text-carefd-teal hover:text-carefd-teal-light transition text-sm">
                  כל האזורים
                </Link>
              </li>
            </ul>
          </div>

          {/* For Providers */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-carefd-teal">לספקים</h3>
            <ul className="space-y-2">
              <li><Link href="/register?role=provider" className="text-carefd-light-gray hover:text-carefd-teal transition">הירשם כספק</Link></li>
              <li><Link href="/provider/dashboard" className="text-carefd-light-gray hover:text-carefd-teal transition">דשבורד ספק</Link></li>
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

      {/* Bottom Bar */}
      <div className="border-t border-carefd-slate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-carefd-light-gray text-sm">
              {settings.footer_text || `© ${new Date().getFullYear()} CareFD. כל הזכויות שמורות.`}
            </p>
            <div className="flex gap-6 text-sm flex-wrap justify-center">
              {defaultBottomLinks.map((link, i) => (
                <Link key={i} href={link.to} className="text-carefd-light-gray hover:text-carefd-teal transition">
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
