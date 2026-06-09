import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserRole, User, Book } from '../types';
import PremiumBadge from './PremiumBadge';

interface HeaderProps {
  cartCount: number;
  user: User | null;
  onLogout: () => void;
  onSearch: (query: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  wishlistCount?: number;
  books?: Book[];
}

const Header: React.FC<HeaderProps> = ({
  cartCount,
  user,
  onLogout,
  onSearch,
  theme,
  toggleTheme,
  wishlistCount = 0,
  books = [],
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const searchResults = searchValue.trim().length > 0
    ? books.filter(b =>
        b.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        b.author.toLowerCase().includes(searchValue.toLowerCase()) ||
        (b.category && b.category.toLowerCase().includes(searchValue.toLowerCase()))
      ).slice(0, 6)
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    onSearch(val);
    setShowDropdown(val.trim().length > 0);
    if (val && location.pathname !== '/') {
      navigate('/');
    }
  };

  const handleResultClick = (bookId: string) => {
    setShowDropdown(false);
    setSearchValue('');
    onSearch('');
    navigate(`/book/${bookId}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setShowDropdown(false);
  };

  const startListening = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice search.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchValue(transcript);
      onSearch(transcript);
      if (location.pathname !== '/') navigate('/');
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const isPremium = user?.isPremium && user?.subscriptionEndDate
    ? new Date(user.subscriptionEndDate) > new Date()
    : false;

  const handleLogoutClick = () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    onLogout();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-3 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Glassmorphic Navbar Card */}
        <div className="bg-white/70 dark:bg-gray-950/75 backdrop-blur-2xl border border-white/30 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-[28px] px-6 py-2.5 transition-all duration-300 ring-1 ring-black/5 dark:ring-white/5">
          <div className="flex justify-between items-center h-14 sm:h-16">

            {/* Logo Section */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2.5 group">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-700 via-pink-600 to-rose-700 dark:from-pink-600 dark:via-pink-500 dark:to-rose-600 rounded-xl flex items-center justify-center transform group-hover:rotate-6 group-hover:scale-105 transition-all duration-300 shadow-md shadow-pink-200/50 dark:shadow-none relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.75 19 7.5 19s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl serif font-extrabold text-gray-900 dark:text-white tracking-tight hover:text-pink-700 dark:hover:text-pink-400 transition-colors leading-none">
                    Lumina
                  </span>
                  <span className="text-[9px] font-semibold text-pink-700 dark:text-pink-400 tracking-wider uppercase hidden lg:block leading-tight mt-0.5">
                    Find Peace Between the Pages
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation Links */}
              <div className="hidden lg:flex items-center space-x-1 ml-6 border-l border-gray-200/50 dark:border-gray-800/50 pl-6">
                <Link to="/" className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-pink-700 dark:hover:text-pink-400 hover:bg-pink-50/60 dark:hover:bg-pink-950/30 px-3.5 py-2 rounded-full transition-all duration-200">
                  Home
                </Link>
                <Link to="/bestsellers" className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-pink-700 dark:hover:text-pink-400 hover:bg-pink-50/60 dark:hover:bg-pink-950/30 px-3.5 py-2 rounded-full transition-all duration-200">
                  Bestsellers
                </Link>
                <Link to="/digital-library" className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-pink-700 dark:hover:text-pink-400 hover:bg-pink-50/60 dark:hover:bg-pink-950/30 px-3.5 py-2 rounded-full transition-all duration-200 flex items-center gap-1.5">
                  <span>E-Library</span>
                  <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded-md tracking-wider">PDF</span>
                </Link>
              </div>
            </div>

            {/* Search Bar - Center (Desktop) */}
            <div className="hidden md:flex flex-1 max-w-md mx-6 transition-all duration-300">
              <div className="relative w-full group" ref={searchRef}>
                <input
                  type="text"
                  value={searchValue}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => searchValue.trim().length > 0 && setShowDropdown(true)}
                  placeholder="Find titles, authors, or genres..."
                  className="w-full bg-gray-50/60 dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-800/60 rounded-full py-2 pl-9 pr-9 focus:ring-4 focus:ring-pink-500/10 dark:focus:ring-pink-500/5 focus:bg-white dark:focus:bg-gray-900 focus:border-pink-500 dark:focus:border-pink-600 transition-all duration-200 outline-none text-[12px] font-medium text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 group-focus-within:text-pink-600 dark:group-focus-within:text-pink-400 transition-colors pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <button
                  onClick={startListening}
                  className={`absolute right-3 top-2.5 h-5 w-5 transition-colors duration-200 ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-pink-700 dark:hover:text-pink-400'}`}
                  title="Voice Search"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 10v2a7 7 0 01-14 0v-2m7 4a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z" />
                  </svg>
                </button>

                {/* Search Dropdown */}
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {searchResults.length > 0 ? (
                      <>
                        <div className="px-4 pt-3 pb-1.5 border-b border-gray-50 dark:border-gray-800/80">
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchValue}"
                          </p>
                        </div>
                        <ul>
                          {searchResults.map((book) => (
                            <li key={book.id}>
                              <button
                                onMouseDown={() => handleResultClick(book.id)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-pink-50 dark:hover:bg-pink-950/20 transition-colors text-left group/item"
                              >
                                {book.coverUrl ? (
                                  <img src={book.coverUrl} alt={book.title} className="w-9 h-12 object-cover rounded-lg flex-shrink-0 shadow-sm" />
                                ) : (
                                  <div className="w-9 h-12 bg-pink-100 dark:bg-pink-950/50 rounded-lg flex-shrink-0 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.75 19 7.5 19s3.332.477 4.5 1.253" />
                                    </svg>
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-[12px] font-bold text-gray-900 dark:text-white truncate group-hover/item:text-pink-700 dark:group-hover/item:text-pink-400 transition-colors">{book.title}</p>
                                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">by {book.author}</p>
                                  {book.category && (
                                    <span className="inline-block mt-0.5 text-[8px] font-bold uppercase tracking-wider text-pink-700 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 px-1.5 py-0.5 rounded-full">{book.category}</span>
                                  )}
                                </div>
                                {book.price !== undefined && (
                                  <span className="text-[11px] font-black text-pink-700 dark:text-pink-400 flex-shrink-0">${book.price}</span>
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                        <div className="px-4 py-2.5 border-t border-gray-50 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-900/50">
                          <button
                            onMouseDown={() => { setShowDropdown(false); if (location.pathname !== '/') navigate('/'); }}
                            className="text-[10px] font-bold text-pink-700 dark:text-pink-400 hover:underline uppercase tracking-wider"
                          >
                            See all results for "{searchValue}" →
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">No books found for "{searchValue}"</p>
                        <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">Try a different title or author name</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Controls - Right */}
            <nav className="flex items-center space-x-2">

              {/* Go Premium banner (for non-premium logged-in users) */}
              {user && user.role !== UserRole.ADMIN && !isPremium && (
                <Link
                  to="/premium"
                  id="go-premium-btn"
                  className="hidden sm:flex items-center gap-1 text-amber-900 dark:text-amber-100 text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-2 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm shadow-amber-500/10 hover:shadow-md hover:shadow-amber-500/20"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #fcd34d 50%, #d97706 100%)',
                  }}
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="hidden md:inline">Go Premium</span>
                </Link>
              )}

              {/* Icon buttons container */}
              <div className="flex items-center space-x-1.5 bg-gray-50/60 dark:bg-gray-900/50 p-1 rounded-full border border-gray-100/80 dark:border-gray-800/40 backdrop-blur-sm">
                {/* Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-pink-700 dark:hover:text-pink-400 hover:bg-white dark:hover:bg-gray-800 rounded-full flex items-center justify-center transition-all duration-200"
                  title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {theme === 'dark' ? (
                    <svg className="w-5 h-5 transform hover:rotate-45 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 transform hover:-rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646" />
                    </svg>
                  )}
                </button>

                {/* Wishlist Button */}
                <Link
                  to="/wishlist"
                  className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-pink-700 dark:hover:text-pink-400 hover:bg-white dark:hover:bg-gray-800 rounded-full flex items-center justify-center transition-all duration-200"
                  title="My Wishlist"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-white dark:ring-gray-950 animate-bounce">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                {/* Cart Button */}
                <Link
                  to="/cart"
                  className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-pink-700 dark:hover:text-pink-400 hover:bg-white dark:hover:bg-gray-800 rounded-full flex items-center justify-center transition-all duration-200"
                  title="Shopping Cart"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-[8px] font-black rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-white dark:ring-gray-950 animate-bounce">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Profile Dropdown or Login Controls */}
              {user ? (
                <div className="relative pl-1">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="w-9 h-9 rounded-full overflow-hidden hover:ring-3 hover:ring-pink-500/20 active:scale-95 transition-all flex-shrink-0 relative border border-gray-200 dark:border-gray-800 shadow-sm"
                    style={isPremium ? {
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      padding: '2px'
                    } : undefined}
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover rounded-full bg-white"
                    />
                  </button>

                  {/* Dropdown Menu Overlay */}
                  {isProfileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                      <div className="absolute right-0 mt-3.5 w-60 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-xl py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">

                        {/* User Header */}
                        <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-900 flex items-center gap-3">
                          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 object-cover shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{user.name}</p>
                            <div className="flex items-center gap-1 mt-1">
                              {isPremium ? (
                                <PremiumBadge size="sm" animate={true} />
                              ) : (
                                <span className="text-[9px] bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider">
                                  {user.role}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Dropdown Actions */}
                        <div className="p-1.5 space-y-0.5">
                          {user.role === UserRole.ADMIN && (
                            <Link
                              to="/admin"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/60 rounded-xl transition-all"
                            >
                              <svg className="w-4 h-4 text-pink-700 dark:text-pink-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>Admin Dashboard</span>
                            </Link>
                          )}

                          <Link
                            to="/digital-library"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-gray-650 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/60 rounded-xl transition-all"
                          >
                            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.75 19 7.5 19s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span>E-Library Downloads</span>
                          </Link>

                          <Link
                            to="/premium"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-gray-650 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/60 rounded-xl transition-all"
                          >
                            <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                            <span>{isPremium ? 'Manage Subscription' : 'Explore Premium'}</span>
                          </Link>
                        </div>

                        {/* Dropdown Logout */}
                        <div className="border-t border-gray-200 dark:border-gray-900 mt-1.5 pt-1.5 px-1.5">
                          <button
                            onClick={handleLogoutClick}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                          >
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Log Out</span>
                          </button>
                        </div>

                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center space-x-1 pl-2 border-l border-gray-200/50 dark:border-gray-800/50 shrink-0">
                  <Link to="/login" className="text-[11px] font-bold uppercase tracking-wider text-pink-900 dark:text-pink-300 px-3.5 py-2 hover:bg-gray-100/50 dark:hover:bg-gray-900/50 rounded-full transition-all">
                    Sign In
                  </Link>
                  <Link to="/login" className="bg-pink-800 dark:bg-pink-700 text-white px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider hover:bg-pink-900 dark:hover:bg-pink-800 transition-all shadow-sm shadow-pink-500/20">
                    Join Free
                  </Link>
                </div>
              )}

              {/* Mobile Menu Hamburger Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-pink-700 dark:hover:text-pink-400 hover:bg-gray-50/50 dark:hover:bg-gray-900/60 rounded-full transition-all shrink-0"
                title="Open Navigation Menu"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                )}
              </button>

            </nav>
          </div>

          {/* Mobile Expanding Drawer Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-3 pt-3 border-t border-gray-200 dark:border-gray-800/80 pb-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">

              {/* Search Input for Mobile */}
              <div className="relative w-full group px-1">
                <input
                  type="text"
                  value={searchValue}
                  onChange={handleSearchChange}
                  placeholder="Find titles, authors, or genres..."
                  className="w-full bg-gray-50/70 dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800 rounded-full py-2.5 pl-9 pr-9 focus:ring-4 focus:ring-pink-500/10 focus:bg-white dark:focus:bg-gray-950 focus:border-pink-500 transition-all outline-none text-xs font-semibold text-gray-800 dark:text-gray-100 placeholder-gray-400"
                />
                <svg className="absolute left-4 top-3 h-5 w-5 text-gray-400 group-focus-within:text-pink-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <button
                  onClick={startListening}
                  className={`absolute right-4 top-3 h-5 w-5 transition-colors duration-200 ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-pink-700 dark:hover:text-pink-400'}`}
                  title="Voice Search"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 10v2a7 7 0 01-14 0v-2m7 4a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z"></path>
                  </svg>
                </button>
              </div>

              {/* Mobile Navigation Links */}
              <div className="flex flex-col space-y-1.5 px-1">
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 hover:text-pink-700 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/20 py-2.5 px-4 rounded-xl transition-all"
                >
                  Home
                </Link>
                <Link
                  to="/bestsellers"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 hover:text-pink-700 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/20 py-2.5 px-4 rounded-xl transition-all"
                >
                  Bestsellers
                </Link>
                <Link
                  to="/digital-library"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 hover:text-pink-700 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/20 py-2.5 px-4 rounded-xl transition-all flex items-center justify-between"
                >
                  <span>E-Library (PDFs)</span>
                  <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded-md tracking-wider">PDF</span>
                </Link>
              </div>

              {/* Guest / User Profile Menu in Mobile Drawer */}
              <div className="px-1 pt-2 border-t border-gray-200 dark:border-gray-800/80">
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50/50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800/60">
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <p className="text-xs font-bold text-gray-800 dark:text-white leading-tight">{user.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {isPremium ? (
                            <PremiumBadge size="sm" animate={true} />
                          ) : (
                            <span className="text-[9px] text-gray-500 dark:text-gray-500 font-extrabold uppercase tracking-wide">{user.role}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {user.role === UserRole.ADMIN && (
                        <Link
                          to="/admin"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-gray-50 dark:bg-gray-900 text-xs font-bold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent hover:border-pink-200 transition-all text-center"
                        >
                          <span>Console</span>
                        </Link>
                      )}
                      <Link
                        to="/premium"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-amber-500/10 dark:bg-amber-500/20 text-xs font-bold text-amber-700 dark:text-amber-300 rounded-xl hover:bg-amber-500/20 transition-all text-center"
                      >
                        <span>{isPremium ? 'My Premium' : 'Go Premium'}</span>
                      </Link>
                    </div>

                    <button
                      onClick={handleLogoutClick}
                      className="w-full flex items-center justify-center space-x-2 py-2.5 bg-red-50 dark:bg-red-950/15 text-red-600 hover:bg-red-100/60 rounded-xl text-xs font-bold transition-all text-center"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Log Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full text-center text-xs font-extrabold uppercase tracking-wider text-pink-900 dark:text-pink-300 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 transition-all"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full text-center text-xs font-extrabold uppercase tracking-wider text-white py-3 bg-pink-800 dark:bg-pink-700 rounded-xl hover:bg-pink-900 dark:hover:bg-pink-800 transition-all shadow-md"
                    >
                      Join Free
                    </Link>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </header>
  );
};

export default Header;
