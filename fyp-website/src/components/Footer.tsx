"use client";

import Link from "next/link";
import {
  Activity,
  Github,
  Twitter,
  Linkedin,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: "Features", href: "/features" },
      { name: "FAQ", href: "/faq" },
    ],
    company: [
      { name: "About Us", href: "/about" },
      { name: "Contact", href: "/contact" },
    ],
  };

  const socialLinks = [
    { name: "Twitter", icon: Twitter, href: "#" },
    { name: "GitHub", icon: Github, href: "#" },
    { name: "LinkedIn", icon: Linkedin, href: "#" },
  ];

  return (
    <footer className="relative bg-white pt-24 pb-12 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-4 flex flex-col space-y-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-slate-900"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-lg">
                <img src="/logo.png" alt="Trimed Al" className="h-full w-full object-cover" />
              </div>
              Trimed Al
            </Link>
            <p className="max-w-xs text-slate-500 leading-relaxed">
              Empowering individuals with AI-driven health insights and
              connecting patients with the right medical care instantly.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors border border-slate-100"
                >
                  <social.icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-4">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-6">
                Product
              </h4>
              <ul className="space-y-4">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-slate-500 hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-6">
                Company
              </h4>
              <ul className="space-y-4">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-slate-500 hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-6">
                Support
              </h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-500">
                  <Mail className="h-4 w-4 text-primary" />
                  support@trimedal.com
                </li>
                <li className="flex items-center gap-3 text-slate-500">
                  <Phone className="h-4 w-4 text-primary" />
                  +1 (555) 000-0000
                </li>
                <li className="flex items-start gap-3 text-slate-500">
                  <MapPin className="h-4 w-4 text-primary mt-1 shrink-0" />
                  <span>
                    123 Medical Plaza,
                    <br />
                    Health City, HC 12345
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-slate-400">
            © {currentYear} Trimed Al. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
