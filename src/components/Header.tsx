"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Menu, X, Mail, Lock, User, LogOut, ChevronDown } from "lucide-react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  
  // Auth Form State
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [roleInput, setRoleInput] = useState("Buyer");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Global Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const pathname = usePathname();

  // Load auth state from localStorage on client-side mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const user = localStorage.getItem("homespire_user");
      const email = localStorage.getItem("homespire_user_email");
      if (user && email) {
        setIsLoggedIn(true);
        setUserEmail(email);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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

  // Handle Authentication submit
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!emailInput || !passwordInput) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    if (authTab === "signup" && !agreeTerms) {
      setErrorMsg("You must agree to the Terms and Conditions.");
      return;
    }

    // Save mock user session
    localStorage.setItem("homespire_user", "true");
    localStorage.setItem("homespire_user_email", emailInput);
    setIsLoggedIn(true);
    setUserEmail(emailInput);
    
    setSuccessMsg(authTab === "signin" ? "Signed in successfully!" : "Account created successfully!");
    
    // Clear inputs and close modal after short delay
    setTimeout(() => {
      setIsAuthModalOpen(false);
      setEmailInput("");
      setPasswordInput("");
      setSuccessMsg("");
    }, 1500);
  };

  // Handle Sign Out
  const handleSignOut = () => {
    localStorage.removeItem("homespire_user");
    localStorage.removeItem("homespire_user_email");
    setIsLoggedIn(false);
    setUserEmail("");
    setIsDropdownOpen(false);
  };

  // Get user initial avatar letter
  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : "U";

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

          {/* User Account / Sign In section */}
          {isLoggedIn ? (
            <div className="hidden md:block relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 focus:outline-none"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md select-none cursor-pointer hover:bg-blue-700 transition-colors">
                  {userInitial}
                </div>
                <ChevronDown className="h-3 w-3 text-slate-500 hover:text-slate-700 dark:text-slate-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 py-3 z-55 flex flex-col space-y-1 animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-850 pb-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Logged in as</p>
                    <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate mt-1">{userEmail}</p>
                  </div>
                  <Link
                    href="/#estimator"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors"
                  >
                    <User className="h-4 w-4 text-slate-400" /> My Account
                  </Link>
                  <Link
                    href="/search"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors"
                  >
                    <Home className="h-4 w-4 text-slate-400" /> Saved Homes
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors text-left"
                  >
                    <LogOut className="h-4 w-4 text-red-500" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="hidden md:inline-block text-xs font-bold tracking-wide text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none"
            >
              Sign In
            </button>
          )}

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
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 justify-between">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                  {userInitial}
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate w-36">{userEmail}</p>
                  <button onClick={handleSignOut} className="text-[10px] font-bold text-red-500 mt-0.5 hover:underline block">Sign Out</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}

      {/* Zillow-style Sign In / Register Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-colors"
            >
              ✕
            </button>

            {/* Modal Title and Tabs */}
            <div className="text-center space-y-4">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Welcome to Homespire</h2>
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("signin");
                    setErrorMsg("");
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    authTab === "signin"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("signup");
                    setErrorMsg("");
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    authTab === "signup"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                  }`}
                >
                  New Account
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-650 dark:text-red-400 text-xs font-bold rounded-xl text-center">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 text-green-650 dark:text-green-400 text-xs font-bold rounded-xl text-center">
                  {successMsg}
                </div>
              )}

              {/* Email field */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Email Address</label>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850">
                  <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="bg-transparent border-none text-xs outline-none focus:ring-0 text-slate-800 dark:text-white placeholder-slate-400 w-full"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Password</label>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850">
                  <Lock className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="bg-transparent border-none text-xs outline-none focus:ring-0 text-slate-800 dark:text-white placeholder-slate-400 w-full"
                  />
                </div>
              </div>

              {/* Role Select field (Only for Register Tab) */}
              {authTab === "signup" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">User Role</label>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850">
                    <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <select
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value)}
                      className="bg-transparent border-none text-xs outline-none focus:ring-0 text-slate-800 dark:text-white w-full cursor-pointer"
                    >
                      <option value="Buyer">I am a Home Buyer / Renter</option>
                      <option value="Agent">I am a Real Estate Agent</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Terms checkbox (Only for Register Tab) */}
              {authTab === "signup" && (
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="rounded border-slate-350 dark:border-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                  <span>I agree to the Terms of Service & Privacy Policy</span>
                </label>
              )}

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/10"
              >
                {authTab === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>

            {/* Social logins */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-850 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Or continue with</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    localStorage.setItem("homespire_user", "true");
                    localStorage.setItem("homespire_user_email", "google.user@gmail.com");
                    setIsLoggedIn(true);
                    setUserEmail("google.user@gmail.com");
                    setSuccessMsg("Signed in with Google!");
                    setTimeout(() => {
                      setIsAuthModalOpen(false);
                      setSuccessMsg("");
                    }, 1000);
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors text-xs font-bold text-slate-650 dark:text-slate-300"
                >
                  <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="h-4 w-4" /> Google
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem("homespire_user", "true");
                    localStorage.setItem("homespire_user_email", "apple.user@icloud.com");
                    setIsLoggedIn(true);
                    setUserEmail("apple.user@icloud.com");
                    setSuccessMsg("Signed in with Apple!");
                    setTimeout(() => {
                      setIsAuthModalOpen(false);
                      setSuccessMsg("");
                    }, 1000);
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors text-xs font-bold text-slate-650 dark:text-slate-300"
                >
                  <img src="https://authjs.dev/img/providers/apple.svg" alt="Apple" className="h-4 w-4 dark:invert" /> Apple
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
