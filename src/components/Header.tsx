"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Menu, X } from "lucide-react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const leftNavItems = [
    { name: "Buy", href: "/search?type=buy" },
    { name: "Rent", href: "/search?type=rent" },
    { name: "Sell", href: "/#estimator" },
    { name: "Get a Mortgage", href: "/#mortgage-calculator" },
    { name: "Find an Agent", href: "/search" },
  ];

  const rightNavItems = [
    { name: "Manage Rentals", href: "/search?type=rent" },
    { name: "Advertise", href: "/#estimator" },
    { name: "Get Help", href: "/#help" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-850 py-3">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-3 items-center w-full">
        
        {/* Left Section: Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 justify-start">
          {leftNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-xs font-bold tracking-wide transition-colors ${
                pathname === item.href
                  ? "text-blue-600"
                  : "text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Center Section: Logo (Desktop and Mobile) */}
        <div className="flex md:justify-center justify-start items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Home className="h-4 w-4" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
              Home<span className="text-blue-600">spire</span>
            </span>
          </Link>
        </div>

        {/* Right Section: Actions & User Profile (Desktop) */}
        <div className="flex items-center gap-5 justify-end">
          <nav className="hidden md:flex items-center gap-6">
            {rightNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-xs font-bold tracking-wide text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Profile Avatar "M" */}
          <div className="hidden md:flex items-center">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md select-none cursor-pointer hover:bg-blue-700 transition-colors">
              M
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg md:hidden text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-[#090d16] border-b border-slate-200 dark:border-slate-850 p-6 flex flex-col gap-4 shadow-xl animate-in fade-in slide-in-from-top-5 duration-200">
          {[...leftNavItems, ...rightNavItems].map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 py-1 transition-colors"
            >
              {item.name}
            </Link>
          ))}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md">
              M
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">My Account</span>
          </div>
        </div>
      )}
    </header>
  );
}
