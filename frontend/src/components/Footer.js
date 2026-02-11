import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-carelink-navy text-white mt-auto">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
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
                <Link to="/" className="text-carelink-light-gray hover:text-carelink-teal transition">
                  בית
                </Link>
              </li>
              <li>
                <Link to="/providers" className="text-carelink-light-gray hover:text-carelink-teal transition">
                  ספקים
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-carelink-light-gray hover:text-carelink-teal transition">
                  שירותים
                </Link>
              </li>
              <li>
                <Link to="/requests" className="text-carelink-light-gray hover:text-carelink-teal transition">
                  בקשות
                </Link>
              </li>
            </ul>
          </div>

          {/* For Providers */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-carelink-teal">לספקים</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/register" className="text-carelink-light-gray hover:text-carelink-teal transition">
                  הירשם כספק
                </Link>
              </li>
              <li>
                <Link to="/provider/dashboard" className="text-carelink-light-gray hover:text-carelink-teal transition">
                  דשבורד ספק
                </Link>
              </li>
              <li>
                <a href="#" className="text-carelink-light-gray hover:text-carelink-teal transition">
                  מחירונים
                </a>
              </li>
              <li>
                <a href="#" className="text-carelink-light-gray hover:text-carelink-teal transition">
                  מרכז עזרה
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-carelink-teal">צור קשר</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-carelink-light-gray">
                <FaPhone className="text-carelink-teal" />
                <span>03-1234567</span>
              </li>
              <li className="flex items-center gap-2 text-carelink-light-gray">
                <FaEnvelope className="text-carelink-teal" />
                <span>info@carelink.co.il</span>
              </li>
              <li className="flex items-center gap-2 text-carelink-light-gray">
                <FaMapMarkerAlt className="text-carelink-teal" />
                <span>תל אביב, ישראל</span>
              </li>
            </ul>

            {/* Social Media */}
            <div className="flex gap-3 mt-4">
              <a href="#" className="bg-carelink-slate p-2 rounded-full hover:bg-carelink-teal transition">
                <FaFacebook className="text-lg" />
              </a>
              <a href="#" className="bg-carelink-slate p-2 rounded-full hover:bg-carelink-teal transition">
                <FaTwitter className="text-lg" />
              </a>
              <a href="#" className="bg-carelink-slate p-2 rounded-full hover:bg-carelink-teal transition">
                <FaInstagram className="text-lg" />
              </a>
              <a href="#" className="bg-carelink-slate p-2 rounded-full hover:bg-carelink-teal transition">
                <FaLinkedin className="text-lg" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-carelink-slate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-carelink-light-gray text-sm">
              © 2025 CareLink. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-carelink-light-gray hover:text-carelink-teal transition">
                מדיניות פרטיות
              </a>
              <a href="#" className="text-carelink-light-gray hover:text-carelink-teal transition">
                תנאי שימוש
              </a>
              <a href="#" className="text-carelink-light-gray hover:text-carelink-teal transition">
                צור קשר
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;