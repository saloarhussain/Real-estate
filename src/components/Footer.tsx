"use client";

import React from "react";
import Link from "next/link";
import { Home, Mail, Phone, MapPin, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        {/* Brand */}
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Home className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              Home<span className="text-blue-500">spire</span>
            </span>
          </Link>
          <p className="text-xs leading-relaxed text-slate-500">
            Homespire is a premier digital real estate matching platform, offering cutting-edge property valuation analytics, mortgage calculations, and verified local agent directories.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Properties</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/search?type=buy" className="hover:text-blue-400 transition-colors">Buy Property</Link>
            </li>
            <li>
              <Link href="/search?type=rent" className="hover:text-blue-400 transition-colors">Rent Property</Link>
            </li>
            <li>
              <Link href="/#estimator" className="hover:text-blue-400 transition-colors">Zestimate Valuation</Link>
            </li>
            <li>
              <Link href="/#mortgage-calculator" className="hover:text-blue-400 transition-colors">Mortgage Estimator</Link>
            </li>
          </ul>
        </div>

        {/* Cities */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Key Markets</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/search?city=Mumbai" className="hover:text-blue-400 transition-colors">Mumbai, Maharashtra</Link></li>
            <li><Link href="/search?city=Bangalore" className="hover:text-blue-400 transition-colors">Bangalore, Karnataka</Link></li>
            <li><Link href="/search?city=Delhi" className="hover:text-blue-400 transition-colors">Delhi NCR</Link></li>
            <li><Link href="/search?city=Goa" className="hover:text-blue-400 transition-colors">Goa Beaches</Link></li>
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Contact Agent</h4>
          <ul className="space-y-3 text-xs">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span>+91 98200 12345</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span>support@homespire.in</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">
                12th Main Road, Indiranagar, Bangalore, Karnataka 560038
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
        <p>© {new Date().getFullYear()} Homespire Inc. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-400 transition-colors">Terms of Use</a>
        </div>
      </div>
    </footer>
  );
}
