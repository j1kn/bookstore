
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import Header from './components/Header';
import AIAssistant from './components/AIAssistant';
import BookCard from './components/BookCard';
import SubscriptionPage from './components/SubscriptionPage';
import PremiumBadge from './components/PremiumBadge';
import { Book, CartItem, UserRole, User } from './types';
import { dbService } from './services/dbService';
import { CATEGORIES } from './constants';
import { pdfStorage } from './services/pdfStorage';
import { getBookRecommendation, getAIBookInsight, getDetailedRecommendations, RecommendationAnswers } from './services/geminiService';
import { AdminDashboard } from './components/AdminDashboard';

// --- Toast Component ---
const Toast = ({ message, type = 'success', onClose }: { message: string, type?: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-4 ${
      type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
    }`}>
      {type === 'success' ? (
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

// --- Page Components ---

const Home = ({ books, onAddToCart, searchQuery, user, wishlist = [], onToggleWishlist, cart = [] }: {
  books: Book[],
  onAddToCart: (b: Book) => void,
  searchQuery: string,
  user: User | null,
  wishlist?: Book[],
  onToggleWishlist?: (b: Book) => void,
  cart?: CartItem[],
}) => {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loadingRec, setLoadingRec] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || book.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [books, searchQuery, selectedCategory]);

  const fetchRec = async () => {
    setLoadingRec(true);
    const rec = await getBookRecommendation("I'm looking for high-quality literary fiction or modern classics.");
    setRecommendation(rec || null);
    setLoadingRec(false);
  };

  const isPremium = user?.isPremium && user?.subscriptionEndDate
    ? new Date(user.subscriptionEndDate) > new Date()
    : false;

  const premiumBooks = books.filter(b => b.isPremiumOnly);
  const regularBooks = filteredBooks.filter(b => !b.isPremiumOnly);

  const latestBook = useMemo(() => books.length > 0 ? books[books.length - 1] : null, [books]);
  const mostSoldBook = useMemo(() => {
    const bestsellers = books.filter(b => b.isBestseller);
    if (bestsellers.length > 0) {
      return bestsellers.reduce((prev, current) => (prev.rating > current.rating) ? prev : current);
    }
    return books.length > 0 ? books[0] : null;
  }, [books]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden mb-16 min-h-[400px] h-auto py-12 md:py-0 md:h-[500px] flex items-center bg-slate-50 dark:bg-pink-950 border border-gray-150 dark:border-transparent shadow-xl dark:shadow-none">
        <div className="absolute inset-0 opacity-15 dark:opacity-40 select-none">
          <img src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover" alt="Hero" />
        </div>
        <div className="relative z-10 px-6 sm:px-12 max-w-2xl w-full">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-pink-700 dark:text-pink-400 mb-4 flex items-center gap-2">
            <span className="inline-block w-6 h-px bg-pink-600 dark:bg-pink-500"></span>
            Find Peace Between the Pages
          </p>
          <h1 className="text-4xl sm:text-6xl md:text-7xl serif font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Curate Your <span className="text-pink-700 dark:text-pink-400 italic">Soul's</span> Library.
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 font-light max-w-lg">
            Discover thousands of hand-picked titles with AI-powered insights tailored precisely to your taste.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/bestsellers" className="bg-pink-700 text-white px-8 py-4 rounded-full font-bold hover:bg-pink-800 transition-all shadow-xl hover:shadow-pink-500/20 w-full sm:w-auto text-center">
              Browse Best-Sellers
            </Link>
            {!isPremium && (
              <Link to="/premium" className="flex items-center justify-center gap-2 text-amber-900 px-8 py-4 rounded-full font-bold transition-all shadow-xl hover:scale-105 active:scale-95 w-full sm:w-auto text-center"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #fcd34d, #d97706)', boxShadow: '0 8px 24px rgba(251,191,36,0.4)' }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                Go Premium
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Premium Feature Teasers */}
      <section className="mb-16 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Recommendations */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-50 to-pink-50/60 dark:from-pink-950 dark:via-pink-900 dark:to-pink-950 p-8 flex flex-col justify-between min-h-[220px] shadow-lg dark:shadow-none hover:shadow-2xl transition-shadow duration-300 border border-pink-100/50 dark:border-transparent">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <svg className="w-32 h-32 text-pink-300" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-pink-700 dark:text-pink-300 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <span className="text-[10px] font-black uppercase tracking-widest text-pink-700 dark:text-pink-300">Gemini AI Engine</span>
            </div>
            <h2 className="text-2xl serif font-bold text-gray-900 dark:text-white mb-2">Find Your Perfect Next Read</h2>
            <p className="text-gray-600 dark:text-pink-200/80 text-sm font-medium max-w-sm">Answer a few questions and Lumina AI will curate 5 handpicked books just for you.</p>
          </div>
          <Link
            to="/recommendations"
            className="relative z-10 mt-6 bg-pink-700 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-pink-800 dark:hover:bg-gray-100 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 self-start shadow-md dark:shadow-none shadow-pink-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Get Recommendations
          </Link>
        </div>

        {/* E-Library Banner */}
        <div className="relative rounded-3xl overflow-hidden p-8 flex flex-col justify-between min-h-[220px] shadow-lg dark:shadow-none hover:shadow-2xl transition-shadow duration-300 bg-gradient-to-br from-amber-50/50 to-orange-50/40 dark:from-pink-950 dark:to-gray-950 border border-amber-100/50 dark:border-transparent">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <svg className="w-32 h-32 text-amber-500 dark:text-amber-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.75 19 7.5 19s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">✦ Premium Access</span>
            </div>
            <h2 className="text-2xl serif font-bold text-amber-950 dark:text-white mb-2">Lumina Digital E-Library</h2>
            <p className="text-gray-600 dark:text-white/80 text-sm font-medium max-w-sm">Read books online instantly. Browse all available PDFs with our advanced web reader.</p>
          </div>
          <Link
            to="/digital-library"
            className="relative z-10 mt-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:from-amber-600 hover:to-orange-600 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 self-start shadow-md shadow-amber-200 dark:shadow-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.75 19 7.5 19s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            Explore E-Library
          </Link>
        </div>
      </section>

      {/* Filtering */}
      <section className="mb-8 flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full border transition-all text-xs font-bold uppercase tracking-wider ${selectedCategory === cat ? 'bg-pink-700 border-pink-700 text-white shadow-md' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-pink-400 dark:hover:border-pink-500 hover:text-pink-700 dark:hover:text-pink-400'}`}
          >
            {cat}
          </button>
        ))}
      </section>

      {/* Premium Exclusive Books Section */}
      {premiumBooks.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white serif">Premium Exclusive Titles</h2>
              <PremiumBadge size="sm" animate={false} />
            </div>
            {!isPremium && (
              <Link to="/premium" className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex items-center gap-1">
                Unlock All →
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {premiumBooks.map(book => (
              <BookCard
                key={book.id}
                book={book}
                onAddToCart={onAddToCart}
                user={user}
                isInWishlist={wishlist.some(w => w.id === book.id)}
                onToggleWishlist={onToggleWishlist}
                cartItems={cart}
              />
            ))}
          </div>
        </section>
      )}

      {/* Regular Book Grid */}
      <section>
        <div className="flex items-center justify-between mb-8 border-b border-pink-50 dark:border-gray-800 pb-4">
           <div className="flex items-center gap-3">
             <div className="w-1.5 h-8 bg-gradient-to-b from-pink-400 to-pink-600 rounded-full"></div>
             <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-900 to-pink-600 dark:from-pink-300 dark:to-pink-500 serif drop-shadow-sm">
               {searchQuery ? `Results for "${searchQuery}"` : 'Hand-Picked For You'}
             </h2>
           </div>
          <span className="text-[11px] font-bold text-pink-700 dark:text-pink-400 uppercase tracking-widest bg-gray-100 dark:bg-pink-950/50 border border-transparent dark:border-pink-900/30 px-3 py-1 rounded-full shadow-sm">{regularBooks.length} titles</span>
        </div>

        {regularBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {regularBooks.map(book => (
              <BookCard
                key={book.id}
                book={book}
                onAddToCart={onAddToCart}
                user={user}
                isInWishlist={wishlist.some(w => w.id === book.id)}
                onToggleWishlist={onToggleWishlist}
                cartItems={cart}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-lg">No books matched your criteria. Try adjusting your search or category.</p>
          </div>
        )}
      </section>

      {/* Latest Launched Book */}
      {latestBook && (
        <section className="mt-24">
          <div className="mb-8 flex items-center justify-between border-b border-pink-50 dark:border-gray-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-gradient-to-b from-pink-400 to-pink-600 rounded-full"></div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-900 to-pink-600 dark:from-pink-300 dark:to-pink-500 serif drop-shadow-sm">Latest Launched Book</h2>
            </div>
            <span className="text-[11px] font-bold text-pink-700 dark:text-pink-400 uppercase tracking-widest bg-gray-100 dark:bg-pink-950/50 border border-transparent dark:border-pink-900/30 px-3 py-1 rounded-full shadow-sm">New Arrival</span>
          </div>
          <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl dark:shadow-none flex flex-col md:flex-row group transition-all duration-300 hover:shadow-2xl">
            <div className="md:w-1/3 bg-gray-50 dark:bg-gray-800/30 flex items-center justify-center p-8 relative overflow-hidden">
               <div className="absolute inset-0 bg-gray-100/50 dark:bg-pink-950/20"></div>
               <img src={latestBook.coverImage} className="w-48 h-auto object-cover rounded-md shadow-2xl relative z-10 group-hover:scale-105 transition-transform duration-500" alt={latestBook.title} />
            </div>
            <div className="p-8 md:p-12 md:w-2/3 flex flex-col justify-center">
               <div className="flex items-center gap-2 mb-4">
                 <span className="bg-gray-200 dark:bg-pink-950 text-gray-700 dark:text-pink-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Latest Launch</span>
                 <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">{latestBook.category}</span>
               </div>
               <h3 className="text-3xl serif font-bold text-gray-900 dark:text-white mb-2">{latestBook.title}</h3>
               <p className="text-lg text-gray-400 dark:text-gray-500 mb-6 font-medium">by {latestBook.author}</p>
               <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8 max-w-2xl line-clamp-3">{latestBook.description}</p>
               
               <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 mt-auto">
                 <span className="text-2xl font-bold text-gray-900 dark:text-pink-400">₹{latestBook.price.toFixed(2)}</span>
                 <button onClick={() => onAddToCart(latestBook)} className="bg-pink-700 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-pink-800 transition-all uppercase tracking-wider text-[10px] hover:-translate-y-0.5 text-center w-full sm:w-auto">
                    Add to Bag
                 </button>
                 <Link to={`/book/${latestBook.id}`} className="text-pink-700 dark:text-pink-400 font-bold hover:text-pink-800 dark:hover:text-pink-300 transition-colors uppercase tracking-wider text-[10px] text-center">
                    Read Preview
                 </Link>
               </div>
            </div>
          </div>
        </section>
      )}

      {/* Most Sold Book Ever */}
      {mostSoldBook && (
        <section className="mt-24 mb-12">
          <div className="mb-8 flex items-center justify-between border-b border-amber-50 dark:border-gray-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full"></div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-orange-500 dark:from-amber-400 dark:to-orange-400 serif drop-shadow-sm">Most Sold Book Ever</h2>
            </div>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-50 dark:bg-amber-950/40 border border-transparent dark:border-amber-900/30 px-3 py-1 rounded-full shadow-sm">All-Time Bestseller</span>
          </div>
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/15 dark:to-orange-950/15 border border-amber-100 dark:border-gray-800 shadow-xl dark:shadow-none flex flex-col md:flex-row-reverse group transition-all duration-300 hover:shadow-2xl">
            <div className="md:w-1/3 bg-amber-100/50 dark:bg-amber-950/25 flex items-center justify-center p-8 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-transparent to-amber-200/20 dark:to-amber-950/20"></div>
               <img src={mostSoldBook.coverImage} className="w-48 h-auto object-cover rounded-md shadow-2xl relative z-10 group-hover:scale-105 transition-transform duration-500" alt={mostSoldBook.title} />
            </div>
            <div className="p-8 md:p-12 md:w-2/3 flex flex-col justify-center">
               <div className="flex items-center gap-2 mb-4">
                 <span className="bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">All-Time Bestseller</span>
                 <span className="text-amber-800/60 dark:text-amber-450/80 text-sm font-medium">{mostSoldBook.category}</span>
               </div>
               <h3 className="text-3xl serif font-bold text-amber-950 dark:text-amber-100 mb-2">{mostSoldBook.title}</h3>
               <p className="text-lg text-amber-700/80 dark:text-amber-300/80 mb-6 font-medium">by {mostSoldBook.author}</p>
               <p className="text-sm text-amber-900/70 dark:text-amber-200/70 leading-relaxed mb-8 max-w-2xl line-clamp-3">{mostSoldBook.description}</p>
               
               <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 mt-auto">
                 <span className="text-2xl font-bold text-amber-900 dark:text-amber-400">₹{mostSoldBook.price.toFixed(2)}</span>
                 <button onClick={() => onAddToCart(mostSoldBook)} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-3 rounded-xl font-bold shadow-md shadow-amber-200 dark:shadow-none hover:shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all uppercase tracking-wider text-[10px] hover:-translate-y-0.5 text-center w-full sm:w-auto">
                    Add to Bag
                 </button>
                 <Link to={`/book/${mostSoldBook.id}`} className="text-amber-700 dark:text-amber-400 font-bold hover:text-amber-900 dark:hover:text-amber-300 transition-colors uppercase tracking-wider text-[10px] text-center">
                    Read Preview
                 </Link>
               </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

const BookDetails = ({
  onAddToCart,
  wishlist = [],
  onToggleWishlist,
  showToast
}: {
  onAddToCart: (b: Book) => void,
  wishlist?: Book[],
  onToggleWishlist?: (b: Book) => void,
  showToast: (msg: string, type?: 'success' | 'error') => void
}) => {
  const { id } = useParams();
  const [book, setBook] = useState<Book | null>(null);
  const isInWishlist = book ? wishlist.some(w => w.id === book.id) : false;
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [readingUrl, setReadingUrl] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBook = async () => {
      if (!id) return;
      const data = await dbService.getBookById(id);
      if (data) {
        setBook(data);
        setLoading(false);
        // Automatically fetch insight
        setLoadingInsight(true);
        const aiInsight = await getAIBookInsight(data.title);
        setInsight(aiInsight || null);
        setLoadingInsight(false);
      } else {
        navigate('/');
      }
    };
    fetchBook();
  }, [id, navigate]);

  useEffect(() => {
    return () => {
      if (readingUrl && readingUrl.startsWith('blob:')) {
        URL.revokeObjectURL(readingUrl);
      }
    };
  }, [readingUrl]);

  const handleReadOnline = async () => {
    if (!book) return;
    if (!book.pdfUrl) {
      showToast("Online PDF is not available for this book.", "error");
      return;
    }

    if (book.pdfUrl.startsWith('local://')) {
      const bookId = book.pdfUrl.replace('local://', '');
      try {
        const blob = await pdfStorage.getPDF(bookId);
        if (!blob) {
          showToast("PDF file not found in local storage.", "error");
          return;
        }
        const url = URL.createObjectURL(blob);
        setReadingUrl(url);
        setIsReading(true);
      } catch (err: any) {
        showToast("Error loading local PDF: " + err.message, "error");
      }
    } else {
      setReadingUrl(book.pdfUrl);
      setIsReading(true);
    }
  };

  if (loading || !book) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center">
        <div className="w-12 h-12 border-4 border-pink-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isReading && readingUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-950/98 backdrop-blur-md flex flex-col animate-in fade-in duration-300">
        {/* Reader Header */}
        <div className="bg-gray-900/80 border-b border-gray-800 px-6 py-4 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setIsReading(false);
                if (readingUrl.startsWith('blob:')) {
                  URL.revokeObjectURL(readingUrl);
                }
                setReadingUrl('');
              }}
              className="p-2.5 bg-gray-800 text-gray-300 hover:text-white rounded-xl hover:bg-gray-700 transition-all flex items-center gap-2 text-sm font-bold shadow"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Preview</span>
            </button>
            <h2 className="text-white serif text-lg md:text-xl font-bold truncate max-w-xs md:max-w-md">{book.title}</h2>
          </div>
          <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest bg-pink-950/60 border border-pink-900/30 px-3 py-1 rounded-full shadow-sm">
            Lumina Online Reader
          </span>
        </div>

        {/* Reader Frame */}
        <div className="flex-1 w-full h-full relative overflow-hidden bg-gray-900 flex items-center justify-center">
          <iframe
            src={readingUrl}
            className="w-full h-full border-none shadow-2xl"
            title={`Reading: ${book.title}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <button onClick={() => navigate(-1)} className="mb-8 flex items-center text-pink-700 dark:text-pink-400 font-bold hover:translate-x-[-4px] transition-transform">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Library
      </button>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,320px)_1fr] lg:grid-cols-[minmax(0,380px)_1fr] gap-12 lg:gap-16 items-start">
        <div className="relative group w-full max-w-[320px] lg:max-w-[380px] mx-auto md:mx-0">
          <div className="aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl dark:shadow-none">
            <img src={book.coverImage} className="w-full h-full object-cover" alt={book.title} />
          </div>
          {book.isBestseller && (
            <div className="absolute top-6 left-6 bg-pink-700 text-white px-4 py-2 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg dark:shadow-none">
              Bestseller
            </div>
          )}
          <button
            onClick={() => book && onToggleWishlist?.(book)}
            className="absolute top-6 right-6 z-20 w-11 h-11 rounded-full flex items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-md text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-all hover:scale-105 active:scale-95 border border-gray-100 dark:border-gray-800"
            title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${isInWishlist ? 'text-red-500 fill-current scale-110' : 'text-gray-400 dark:text-gray-550'}`}
              fill={isInWishlist ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-bold text-pink-700 dark:text-pink-400 uppercase tracking-widest mb-4">{book.category}</span>
          <h1 className="text-5xl serif font-bold text-gray-900 dark:text-white mb-4">{book.title}</h1>
          <p className="text-2xl text-gray-500 dark:text-gray-400 mb-8 font-medium">by {book.author}</p>

          <div className="flex items-center space-x-6 mb-4">
            <span className="text-4xl font-bold text-gray-900 dark:text-pink-300">₹{book.price.toFixed(2)}</span>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex items-center text-amber-500">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="ml-2 text-xl font-bold text-gray-800 dark:text-gray-200">{book.rating}</span>
            </div>
          </div>

          {/* Stock Status Badge */}
          <div className="mb-8">
            {book.stock === 0 ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Out of Stock
              </span>
            ) : book.stock < 5 ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 rounded-xl text-sm font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Only {book.stock} left — order soon!
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400 rounded-xl text-sm font-bold">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                In Stock ({book.stock} available)
              </span>
            )}
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-10">
            {book.description}
          </p>

          {/* AI Insight Box */}
          <div className="mb-10 bg-gradient-to-br from-gray-100 to-white dark:from-pink-950/30 dark:to-gray-900/50 p-6 rounded-3xl border border-gray-200 dark:border-pink-900/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-16 h-16 text-gray-900 dark:text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="text-pink-700 dark:text-pink-300 font-bold mb-3 flex items-center uppercase tracking-widest text-xs">
              Lumina AI Insight
            </h4>
            {loadingInsight ? (
              <p className="text-gray-400 dark:text-gray-550 italic animate-pulse">Scanning literary historical archives...</p>
            ) : (
              <p className="text-gray-900 dark:text-pink-200 font-medium italic leading-relaxed">
                "{insight || 'This book is widely considered a pivotal work in its genre.'}"
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3.5 mt-8 max-w-md w-full">
            {book.stock === 0 ? (
              <button disabled className="w-full bg-gray-150 dark:bg-gray-800 text-gray-400 dark:text-gray-500 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider cursor-not-allowed border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                Out of Stock
              </button>
            ) : (
              <button
                onClick={() => onAddToCart(book)}
                className="w-full bg-pink-700 hover:bg-pink-800 text-white py-3.5 px-6 rounded-xl font-bold text-sm uppercase tracking-wider transition-all shadow-md hover:shadow-lg shadow-pink-100 dark:shadow-none flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Add to Cart
              </button>
            )}

            <button
              onClick={handleReadOnline}
              className="w-full border-2 border-pink-700 dark:border-pink-500 text-pink-700 dark:text-pink-400 py-3 px-6 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-pink-950/30 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.75 19 7.5 19s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Read Book Online
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Auth = ({ onLogin }: { onLogin: (u: User) => void }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (mode === 'forgot') {
        await dbService.resetPassword(email);
        setSuccess("Password reset email sent! Check your inbox.");
      } else if (mode === 'register') {
        const user = await dbService.register(name, email, password);
        onLogin(user);
        navigate('/');
      } else {
        const user = await dbService.login(email, password);
        if (user) {
          onLogin(user);
          navigate('/');
        } else {
          setError("Invalid email or password.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
  };

  const headings = {
    login: 'Welcome Back',
    register: 'Create Lumina Account',
    forgot: 'Reset Password',
  };
  const subheadings = {
    login: 'Sign in to your account to continue reading.',
    register: 'Join the community of sophisticated readers.',
    forgot: 'Enter your email and we\'ll send you a reset link.',
  };

  return (
    <div className="max-w-md mx-auto my-20 px-4">
      <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800">
        <div className="text-center mb-10">
          <h2 className="text-3xl serif font-bold text-gray-900 dark:text-white mb-2">
            {headings[mode]}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {subheadings[mode]}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/50 flex items-center">
            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-pink-50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-400 rounded-xl text-sm font-medium border border-pink-100 dark:border-pink-900/50 flex items-center">
            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Full Name</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-pink-500 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" placeholder="Jane Doe" />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Email</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-pink-500 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" placeholder="jane@example.com" />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs text-pink-700 dark:text-pink-400 font-semibold hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-pink-500 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" placeholder="••••••••" />
            </div>
          )}

          <button disabled={loading} className="w-full bg-pink-700 text-white py-4 rounded-xl font-bold hover:bg-pink-800 transition-all shadow-lg dark:shadow-none flex justify-center items-center">
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              : mode === 'register' ? 'Create Account' : mode === 'forgot' ? 'Send Reset Link' : 'Sign In'
            }
          </button>
        </form>

        <div className="mt-8 text-center text-sm space-y-3">
          {mode === 'forgot' ? (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Remembered it?</span>
              <button onClick={() => switchMode('login')} className="ml-2 text-pink-700 dark:text-pink-400 font-bold hover:underline">
                Back to Sign In
              </button>
            </div>
          ) : (
            <div>
              <span className="text-gray-500 dark:text-gray-400">{mode === 'register' ? 'Existing user?' : "New to Lumina?"}</span>
              <button onClick={() => switchMode(mode === 'register' ? 'login' : 'register')} className="ml-2 text-pink-700 dark:text-pink-400 font-bold hover:underline">
                {mode === 'register' ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Checkout = ({ cart, user, onOrderComplete }: { cart: CartItem[], user: User | null, onOrderComplete: () => void }) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'upi'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const navigate = useNavigate();

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setPayError(null);
    try {
      await dbService.createOrder({ userId: user?.id, items: cart, total });
      setShowSuccess(true);
      onOrderComplete(); // clears cart + triggers book refresh in App
    } catch (err: any) {
      setPayError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-32 text-center animate-in zoom-in duration-500 px-4">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-8">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-5xl serif font-bold text-gray-900 dark:text-white mb-6">Payment Successful!</h2>
        <p className="text-gray-500 dark:text-gray-400 text-xl mb-12">Your order has been confirmed. You will receive an email shortly with your digital receipt and tracking details.</p>
        <button onClick={() => navigate('/')} className="bg-pink-700 text-white px-12 py-5 rounded-2xl font-bold text-lg hover:bg-pink-800 transition-all shadow-xl dark:shadow-none">
          Return to Library
        </button>
      </div>
    );
  }

  if (cart.length === 0) return <Navigate to="/" />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl serif font-bold mb-10 text-gray-900 dark:text-white">Finalize Purchase</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-xl dark:shadow-none mb-10">
            <h3 className="text-xl font-bold mb-8 flex items-center text-gray-900 dark:text-white">
              <span className="w-8 h-8 rounded-full bg-pink-900 dark:bg-pink-700 text-white flex items-center justify-center mr-4 text-xs font-bold">1</span>
              Payment Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              {[
                { id: 'card', name: 'Credit Card', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
                { id: 'paypal', name: 'PayPal', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
                { id: 'upi', name: 'UPI', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              ].map(method => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center space-y-3 ${paymentMethod === method.id ? 'border-pink-700 bg-gray-100 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300' : 'border-gray-50 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-pink-700'}`}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={method.icon} />
                  </svg>
                  <span className="text-xs font-bold uppercase tracking-widest">{method.name}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handlePay} className="space-y-6">
              {paymentMethod === 'card' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 tracking-widest">Card Holder Name</label>
                    <input required className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" placeholder="e.g. HARSHA SWAIN" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 tracking-widest">Card Details</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input required className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" placeholder="Card Number" />
                      <div className="grid grid-cols-2 gap-4">
                        <input required className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" placeholder="MM/YY" />
                        <input required className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" placeholder="CVC" />
                      </div>
                    </div>
                  </div>
                </>
              )}
              {paymentMethod === 'paypal' && (
                <div className="p-12 bg-gray-50 dark:bg-gray-800 rounded-3xl text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400 mb-6">Redirecting to external provider...</p>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-8 mx-auto grayscale opacity-50 dark:invert dark:opacity-75" alt="PayPal" />
                </div>
              )}
              {paymentMethod === 'upi' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 tracking-widest">Virtual Payment Address</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-gray-500 dark:text-gray-400 font-bold text-lg select-none pointer-events-none">$</span>
                    <input required className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 pl-9 outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" placeholder="yourname@bank" />
                  </div>
                </div>
              )}

              {payError && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">{payError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-pink-900 dark:bg-pink-700 text-white py-5 rounded-2xl font-bold text-xl hover:bg-black dark:hover:bg-pink-800 transition-all shadow-2xl dark:shadow-none flex justify-center items-center mt-8"
              >
                {isProcessing ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  `Authorize Payment: ₹${total.toFixed(2)}`
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-2xl dark:shadow-none sticky top-24">
            <h3 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">Summary</h3>
            <div className="space-y-6 max-h-60 overflow-y-auto mb-8 pr-2">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{item.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.quantity} x ₹{item.price.toFixed(2)}</p>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-gray-100 ml-4">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-3">
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 font-medium">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 font-medium">
                <span>GST/Taxes (8%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-3xl text-gray-900 dark:text-white pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- AI Recommendations Page ---
const MOODS = ['Escapist & Adventurous', 'Thoughtful & Reflective', 'Dark & Intense', 'Light & Uplifting', 'Romantic & Emotional', 'Curious & Educational', 'Thrilling & Suspenseful', 'Funny & Witty'];
const GENRES_LIST = ['Literary Fiction', 'Science Fiction', 'Fantasy', 'Mystery & Thriller', 'Historical Fiction', 'Romance', 'Non-Fiction', 'Biography', 'Self-Help', 'Horror', 'Poetry', 'Graphic Novel'];
const THEMES_LIST = ['Identity & Self-Discovery', 'Love & Loss', 'Power & Corruption', 'War & Survival', 'Social Justice', 'Family & Relationships', 'Nature & Environment', 'Philosophy & Meaning', 'Technology & Future', 'Coming of Age'];
const FORMATS = ['Short reads (< 250 pages)', 'Medium (250–400 pages)', 'Long & immersive (400+ pages)', 'No preference'];
const PACES = ['Fast-paced, can\'t put it down', 'Steady and balanced', 'Slow-burn, deeply atmospheric'];

const RecommendationsPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<RecommendationAnswers>({
    mood: '', genres: [], themes: [], format: '', recentBook: '', disliked: '', pacePreference: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const totalSteps = 4;

  const toggle = (field: 'genres' | 'themes', value: string) => {
    setAnswers(prev => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter(v => v !== value) : [...prev[field], value],
    }));
  };

  const canProceed = () => {
    if (step === 0) return answers.mood !== '';
    if (step === 1) return answers.genres.length > 0;
    if (step === 2) return answers.format !== '' && answers.pacePreference !== '';
    return true;
  };

  const handleGenerate = async () => {
    setLoading(true);
    const text = await getDetailedRecommendations(answers);
    setResult(text);
    setLoading(false);
  };

  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void; key?: string }) => (
    <button
      onClick={onClick}
      className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all duration-200 text-left ${active ? 'bg-pink-700 border-pink-700 text-white shadow-md dark:shadow-none' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-pink-400 dark:hover:border-pink-500 hover:text-pink-700 dark:hover:text-pink-400'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-bold text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 mb-8 transition-colors uppercase tracking-wider">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          <span className="text-xs font-bold uppercase tracking-widest text-pink-600 dark:text-pink-400">Gemini AI · Personalized Picks</span>
        </div>
        <h1 className="text-3xl serif font-bold text-gray-900 dark:text-white mb-1">Find Your Next Book</h1>
        <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">Answer a few questions and Lumina AI will curate 5 books just for you.</p>
      </div>

      {result ? (
        /* Results Panel */
        <div>
          <div className="bg-gradient-to-br from-pink-950 to-pink-900 rounded-2xl p-6 mb-6 flex items-center justify-between">
            <div>
              <p className="text-pink-300 text-xs font-bold uppercase tracking-widest mb-1">Your Personalized Picks</p>
              <h2 className="text-white text-xl font-bold serif">5 Books Curated For You</h2>
            </div>
            <svg className="w-10 h-10 text-pink-400 opacity-60" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-lg dark:shadow-none mb-6">
            <div className="prose prose-pink max-w-none">
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">{result}</div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setResult(null); setStep(0); setAnswers({ mood: '', genres: [], themes: [], format: '', recentBook: '', disliked: '', pacePreference: '' }); }} className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
              Start Over
            </button>
            <button onClick={() => { setResult(null); setLoading(true); handleGenerate(); }} className="flex-1 bg-pink-700 text-white py-3 rounded-xl font-bold text-sm hover:bg-pink-800 transition-all shadow-lg dark:shadow-none">
              Regenerate
            </button>
          </div>
        </div>
      ) : loading ? (
        /* Loading State */
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-16 shadow-lg dark:shadow-none text-center">
          <div className="w-14 h-14 border-4 border-pink-200 dark:border-pink-950/80 border-t-pink-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-pink-300 mb-2 serif">Lumina is Curating…</h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Searching through thousands of titles to find your perfect matches.</p>
        </div>
      ) : (
        /* Step Form */
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-lg dark:shadow-none overflow-hidden">
          {/* Progress Bar */}
          <div className="h-1.5 bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full bg-pink-700 transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>

          <div className="p-7">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-5">Step {step + 1} of {totalSteps}</p>

            {/* Step 0 — Mood */}
            {step === 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 serif">What's your reading mood?</h2>
                <p className="text-gray-400 dark:text-gray-500 text-sm mb-5">Choose the vibe you're looking for right now.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MOODS.map(m => (
                    <Chip key={m} label={m} active={answers.mood === m} onClick={() => setAnswers(prev => ({ ...prev, mood: m }))} />
                  ))}
                </div>
              </div>
            )}

            {/* Step 1 — Genres & Themes */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 serif">Genres & Themes</h2>
                <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">Select all that interest you.</p>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Genres</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {GENRES_LIST.map(g => (<Chip key={g} label={g} active={answers.genres.includes(g)} onClick={() => toggle('genres', g)} />))}
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Themes</p>
                <div className="flex flex-wrap gap-2">
                  {THEMES_LIST.map(t => (<Chip key={t} label={t} active={answers.themes.includes(t)} onClick={() => toggle('themes', t)} />))}
                </div>
              </div>
            )}

            {/* Step 2 — Format & Pace */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 serif">Format & Reading Pace</h2>
                <p className="text-gray-400 dark:text-gray-500 text-sm mb-5">How do you like to read?</p>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Book Length</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                  {FORMATS.map(f => (<Chip key={f} label={f} active={answers.format === f} onClick={() => setAnswers(prev => ({ ...prev, format: f }))} />))}
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Preferred Pace</p>
                <div className="flex flex-col gap-2">
                  {PACES.map(p => (<Chip key={p} label={p} active={answers.pacePreference === p} onClick={() => setAnswers(prev => ({ ...prev, pacePreference: p }))} />))}
                </div>
              </div>
            )}

            {/* Step 3 — Recent reads */}
            {step === 3 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 serif">Your recent reads</h2>
                <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">Help Lumina calibrate. Both fields are optional.</p>
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Last book you loved</label>
                    <input
                      type="text"
                      value={answers.recentBook}
                      onChange={e => setAnswers(prev => ({ ...prev, recentBook: e.target.value }))}
                      placeholder="e.g. The Midnight Library by Matt Haig"
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Something you didn't enjoy recently</label>
                    <input
                      type="text"
                      value={answers.disliked}
                      onChange={e => setAnswers(prev => ({ ...prev, disliked: e.target.value }))}
                      placeholder="e.g. Overly complex plot, slow start…"
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-5 border-t border-gray-50 dark:border-gray-800">
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 transition-all"
              >
                ← Back
              </button>
              {step < totalSteps - 1 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canProceed()}
                  className="px-6 py-2.5 rounded-xl bg-pink-700 text-white text-xs font-bold hover:bg-pink-800 disabled:opacity-40 transition-all shadow-md dark:shadow-none"
                >
                  Continue →
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-pink-700 text-white text-xs font-bold hover:bg-pink-800 transition-all shadow-md dark:shadow-none"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Generate My Picks
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Bestsellers Page ---
const BestsellersPage = ({
  books,
  onAddToCart,
  wishlist = [],
  onToggleWishlist,
  cart = [],
}: {
  books: Book[],
  onAddToCart: (b: Book) => void,
  wishlist?: Book[],
  onToggleWishlist?: (b: Book) => void,
  cart?: CartItem[],
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const navigate = useNavigate();

  const bestsellers = useMemo(() => {
    return books
      .filter(b => b.isBestseller)
      .filter(b => selectedCategory === 'All' || b.category === selectedCategory)
      .sort((a, b) => b.rating - a.rating);
  }, [books, selectedCategory]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(books.filter(b => b.isBestseller).map(b => b.category)));
    return ['All', ...cats.sort()];
  }, [books]);

  const medalColor = (i: number) => {
    if (i === 0) return 'text-yellow-500';
    if (i === 1) return 'text-gray-400 dark:text-gray-500';
    if (i === 2) return 'text-amber-600 dark:text-amber-500';
    return 'text-pink-200 dark:text-pink-700';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="mb-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-bold text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 mb-6 transition-colors uppercase tracking-wider">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-pink-600 dark:text-pink-400 mb-2">Curated Collection</p>
            <h1 className="text-4xl serif font-bold text-gray-900 dark:text-white">Bestsellers</h1>
            <p className="text-gray-400 dark:text-gray-500 mt-2 text-sm font-medium max-w-md">
              Our most-loved titles, ranked by reader ratings. Every book here is a proven favourite.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-gray-100 dark:bg-pink-950/50 border border-transparent dark:border-gray-800 rounded-2xl px-5 py-3 self-start sm:self-auto">
            <svg className="w-5 h-5 text-pink-700 dark:text-pink-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-pink-300">{books.filter(b => b.isBestseller).length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-pink-400 dark:text-pink-500">Bestsellers</p>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-all ${selectedCategory === cat ? 'bg-pink-700 border-pink-700 text-white shadow-md' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-pink-400 dark:hover:border-pink-500 hover:text-pink-700 dark:hover:text-pink-400'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Ranked List */}
      {bestsellers.length === 0 ? (
        <div className="py-20 text-center text-gray-400 dark:text-gray-550 text-sm">No bestsellers in this category yet.</div>
      ) : (
        <div className="space-y-3">
          {bestsellers.map((book, i) => {
            const isInCart = cart.some(c => c.id === book.id);
            return (
            <div key={book.id} className={`group flex items-center gap-5 bg-white dark:bg-gray-900 border rounded-2xl px-5 py-4 hover:border-pink-100 dark:hover:border-pink-900/50 hover:shadow-lg dark:hover:shadow-none transition-all duration-300 ${book.stock === 0 ? 'opacity-60' : ''} ${i < 3 ? 'border-pink-100 dark:border-pink-950/50 bg-gradient-to-r from-pink-50/40 to-white dark:from-pink-950/20 dark:to-gray-900' : 'border-gray-100 dark:border-gray-800'}`}>
              {/* Rank */}
              <div className={`w-8 text-center flex-shrink-0 font-black text-lg ${medalColor(i)}`}>
                {i < 3 ? (
                  <svg className="w-6 h-6 mx-auto fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ) : (
                  <span className="text-sm font-bold text-gray-300 dark:text-gray-600">#{i + 1}</span>
                )}
              </div>

              {/* Cover */}
              <Link to={`/book/${book.id}`} className="flex-shrink-0 w-12 h-[68px] rounded-lg overflow-hidden shadow-md dark:shadow-none group-hover:scale-105 transition-transform duration-300">
                <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[9px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">{book.category}</span>
                  {isInCart && <span className="text-[9px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider flex items-center gap-0.5">✓ In Cart</span>}
                  {book.stock === 0 && <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Sold Out</span>}
                  {book.stock > 0 && book.stock < 5 && <span className="text-[9px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider">Only {book.stock} left</span>}
                </div>
                <Link to={`/book/${book.id}`}>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-pink-700 dark:group-hover:text-pink-400 transition-colors">{book.title}</h3>
                </Link>
                <p className="text-xs text-gray-400 dark:text-gray-500">by {book.author}</p>
                {/* Mobile price and rating */}
                <div className="flex items-center gap-2 mt-1 sm:hidden">
                  <span className="font-bold text-xs text-gray-900 dark:text-pink-300">₹{book.price.toFixed(2)}</span>
                  <div className="flex items-center gap-0.5 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-md">
                    <svg className="w-2.5 h-2.5 text-amber-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400">{book.rating}</span>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="hidden sm:flex flex-col items-center gap-0.5 flex-shrink-0">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, si) => (
                    <svg key={si} className={`w-3 h-3 ${si < Math.round(book.rating) ? 'text-amber-400 fill-current' : 'text-gray-200 dark:text-gray-800 fill-current'}`} viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">{book.rating}</span>
              </div>

              {/* Price */}
              <p className="hidden sm:block font-bold text-sm text-gray-900 dark:text-pink-300 flex-shrink-0 w-20 text-right">₹{book.price.toFixed(2)}</p>

              {/* CTA */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {onToggleWishlist && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onToggleWishlist(book);
                    }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                      wishlist.some(w => w.id === book.id)
                        ? 'border-red-100 dark:border-red-950 bg-red-50 dark:bg-red-950/30 text-red-500'
                        : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-red-500'
                    }`}
                    title={wishlist.some(w => w.id === book.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                  >
                    <svg
                      className={`w-4 h-4 ${wishlist.some(w => w.id === book.id) ? 'fill-current text-red-500 scale-110' : ''} transition-transform`}
                      fill={wishlist.some(w => w.id === book.id) ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2.2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                )}

                {book.stock === 0 ? (
                  <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-wider px-3 py-2 bg-gray-50 dark:bg-gray-800/40 rounded-xl">Unavailable</span>
                ) : isInCart ? (
                  <button
                    onClick={() => onAddToCart(book)}
                    className="flex items-center gap-1.5 bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-400 border border-pink-200 dark:border-pink-800 text-[11px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl hover:bg-pink-100 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    In Cart
                  </button>
                ) : (
                  <button
                    onClick={() => onAddToCart(book)}
                    className="flex items-center gap-1.5 bg-pink-700 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl hover:bg-pink-800 transition-all hover:shadow-md dark:hover:shadow-none hover:shadow-pink-100"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Add
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- Digital Library Page ---
const DigitalLibraryPage = ({ books, showToast }: { books: Book[], showToast: (msg: string, type?: 'success' | 'error') => void }) => {
  const [search, setSearch] = useState('');
  const [isReading, setIsReading] = useState(false);
  const [readingUrl, setReadingUrl] = useState('');
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const navigate = useNavigate();

  const booksWithPdf = useMemo(() => {
    return books.filter(b => b.pdfUrl && (
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase())
    ));
  }, [books, search]);

  useEffect(() => {
    return () => {
      if (readingUrl && readingUrl.startsWith('blob:')) {
        URL.revokeObjectURL(readingUrl);
      }
    };
  }, [readingUrl]);

  const handleRead = async (book: Book) => {
    if (!book.pdfUrl) return;

    if (book.pdfUrl.startsWith('local://')) {
      const bookId = book.pdfUrl.replace('local://', '');
      try {
        const blob = await pdfStorage.getPDF(bookId);
        if (!blob) {
          showToast("PDF file not found in local storage.", "error");
          return;
        }
        const url = URL.createObjectURL(blob);
        setReadingUrl(url);
        setCurrentBook(book);
        setIsReading(true);
      } catch (err: any) {
        showToast("Error loading local PDF: " + err.message, "error");
      }
    } else {
      setReadingUrl(book.pdfUrl);
      setCurrentBook(book);
      setIsReading(true);
    }
  };

  if (isReading && readingUrl && currentBook) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-950/98 backdrop-blur-md flex flex-col animate-in fade-in duration-300">
        <div className="bg-gray-900/80 border-b border-gray-800 px-6 py-4 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setIsReading(false);
                if (readingUrl.startsWith('blob:')) {
                  URL.revokeObjectURL(readingUrl);
                }
                setReadingUrl('');
                setCurrentBook(null);
              }}
              className="p-2.5 bg-gray-800 text-gray-300 hover:text-white rounded-xl hover:bg-gray-700 transition-all flex items-center gap-2 text-sm font-bold shadow"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Exit Reader</span>
            </button>
            <h2 className="text-white serif text-lg md:text-xl font-bold truncate max-w-xs md:max-w-md">{currentBook.title}</h2>
          </div>
          <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest bg-pink-950/60 border border-pink-900/30 px-3 py-1 rounded-full shadow-sm">
            Lumina Online Reader
          </span>
        </div>

        <div className="flex-1 w-full h-full relative overflow-hidden bg-gray-900 flex items-center justify-center">
          <iframe
            src={readingUrl}
            className="w-full h-full border-none shadow-2xl"
            title={`Reading: ${currentBook.title}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-bold text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 mb-6 transition-colors uppercase tracking-wider">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-pink-600 dark:text-pink-400 mb-2">Digital Collection</p>
            <h1 className="text-4xl serif font-bold text-gray-900 dark:text-white">Lumina E-Library</h1>
            <p className="text-gray-400 dark:text-gray-550 mt-2 text-sm font-medium max-w-md">
              Browse all books available for instant online reading in our premium integrated PDF viewer.
            </p>
          </div>
          <div className="flex gap-3 self-start sm:self-auto w-full sm:w-auto">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search e-books..."
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-300 dark:focus:ring-pink-700 text-gray-950 dark:text-gray-100 shadow-sm w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {booksWithPdf.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-gray-400 dark:text-gray-555 text-lg">No digital e-books found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {booksWithPdf.map(book => (
            <div key={book.id} className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="relative aspect-[2/3] overflow-hidden bg-gray-50 dark:bg-gray-950">
                <img src={book.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={book.title} />
                {book.isBestseller && (
                  <span className="absolute top-2 left-2 bg-pink-700 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                    Bestseller
                  </span>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <span className="text-[9px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider mb-1">{book.category}</span>
                <h3 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1 truncate mb-0.5 leading-snug group-hover:text-pink-700 transition-colors">{book.title}</h3>
                <p className="text-[10px] text-gray-450 dark:text-gray-500 font-medium mb-4">by {book.author}</p>
                <button
                  onClick={() => handleRead(book)}
                  className="mt-auto w-full py-2 bg-gray-100 hover:bg-pink-700 text-gray-700 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 border border-gray-200 dark:border-pink-900 dark:bg-pink-950/20 dark:text-pink-400 dark:hover:bg-pink-900 dark:hover:text-white"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.75 19 7.5 19s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Read Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Wishlist Page ---
const WishlistPage = ({
  wishlist,
  onToggleWishlist,
  onAddToCart,
  user
}: {
  wishlist: Book[],
  onToggleWishlist: (b: Book) => void,
  onAddToCart: (b: Book) => void,
  user: User | null
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();

  const getStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
  };

  const isPremiumUser = user?.isPremium && user?.subscriptionEndDate
    ? new Date(user.subscriptionEndDate) > new Date()
    : false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-500">
      {/* Back Button & Header */}
      <div className="mb-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-bold text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 mb-6 transition-colors uppercase tracking-wider">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-pink-600 dark:text-pink-400 mb-2">Personal Collection</p>
            <h1 className="text-4xl serif font-bold text-gray-900 dark:text-white">My Wishlist</h1>
            <p className="text-gray-400 dark:text-gray-500 mt-2 text-sm font-medium">
              Keep track of books you love and want to read next.
            </p>
          </div>
          
          {wishlist.length > 0 && (
            <div className="flex items-center gap-4 self-start sm:self-auto">
              {/* View Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200/50 dark:border-gray-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 text-pink-700 dark:text-pink-400 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'}`}
                  title="Grid View"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-pink-700 dark:text-pink-400 shadow-sm' : 'text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-400'}`}
                  title="List View"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center gap-3 bg-gray-100 dark:bg-pink-950/50 border border-transparent dark:border-gray-800 rounded-2xl px-5 py-3">
                <svg className="w-5 h-5 text-pink-700 dark:text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-pink-300">{wishlist.length}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-pink-400 dark:text-pink-600">Saved</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {wishlist.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center max-w-md mx-auto">
          <div className="w-24 h-24 bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-100 dark:shadow-none animate-bounce">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-2xl serif font-bold text-gray-900 dark:text-white mb-2">Your wishlist is empty</h2>
          <p className="text-gray-400 dark:text-gray-400 mb-8 font-medium text-sm">
            Explore our curated catalog of AI-insight books and save your favorites here.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-pink-700 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-pink-800 transition-all shadow-xl hover:shadow-pink-500/20"
          >
            Discover Books
          </Link>
        </div>
      ) : (
        <div>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {wishlist.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  onAddToCart={onAddToCart}
                  user={user}
                  isInWishlist={true}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {wishlist.map(book => {
                const isOutOfStock = book.stock === 0;
                const isLowStock = book.stock > 0 && book.stock < 5;
                const discountRate = isPremiumUser ? (book.isPremiumOnly ? 0.15 : 0.10) : 0;
                const discountedPrice = book.price * (1 - discountRate);

                return (
                  <div
                    key={book.id}
                    className="group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 hover:border-pink-100 dark:hover:border-pink-900/50 hover:shadow-lg dark:hover:shadow-none transition-all duration-300"
                  >
                    {/* Cover */}
                    <div className="flex-shrink-0 w-20 h-[120px] sm:w-16 sm:h-[96px] rounded-xl overflow-hidden shadow-md dark:shadow-none relative self-center sm:self-auto bg-gray-50 dark:bg-gray-950">
                      <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      {book.isPremiumOnly && (
                        <div className="absolute top-1 left-1 bg-amber-500 text-[8px] font-black uppercase text-amber-900 px-1 rounded-sm">✦</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">{book.category}</span>
                        {isOutOfStock && <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Sold Out</span>}
                        {isLowStock && <span className="text-[9px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider">Only {book.stock} left</span>}
                      </div>
                      <Link to={`/book/${book.id}`}>
                        <h3 className="font-bold text-base text-gray-900 dark:text-white truncate group-hover:text-pink-700 dark:group-hover:text-pink-400 transition-colors leading-snug">{book.title}</h3>
                      </Link>
                      <p className="text-xs text-gray-400 dark:text-gray-400 mt-0.5">by {book.author}</p>
                      
                      {/* Rating (small layout) */}
                      <div className="flex items-center gap-1 mt-1.5">
                        <div className="flex gap-0.5">
                          {getStars(book.rating).map((filled, si) => (
                            <svg key={si} className={`w-2.5 h-2.5 ${filled ? 'text-amber-400 fill-current' : 'text-gray-200 dark:text-gray-800 fill-current'}`} viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-400">{book.rating}</span>
                      </div>
                    </div>

                    {/* Price Info */}
                    <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 flex-shrink-0">
                      {isPremiumUser && discountRate > 0 ? (
                        <div className="flex sm:flex-col items-center sm:items-end gap-1 sm:gap-0 leading-tight">
                          <span className="text-xs text-gray-400 dark:text-gray-400 line-through">₹{book.price.toFixed(2)}</span>
                          <span className="font-bold text-sm text-pink-600 dark:text-pink-400">₹{discountedPrice.toFixed(2)}</span>
                        </div>
                      ) : (
                        <p className="font-bold text-sm text-gray-900 dark:text-pink-300">₹{book.price.toFixed(2)}</p>
                      )}
                      <p className="text-[10px] text-gray-400 dark:text-gray-400 hidden sm:block uppercase tracking-wider font-semibold">Excl. Shipping</p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 dark:border-gray-800">
                      {/* Remove from Wishlist button */}
                      <button
                        onClick={() => onToggleWishlist(book)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-red-50 hover:text-red-500 dark:bg-gray-800 dark:hover:bg-red-950/20 dark:hover:text-red-400 text-gray-400 dark:text-gray-500 transition-all"
                        title="Remove from Wishlist"
                      >
                        <svg className="w-5 h-5 fill-current text-red-500" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>

                      {/* Add to Cart button */}
                      {isOutOfStock ? (
                        <span className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-widest px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl">Unavailable</span>
                      ) : (
                        <button
                          onClick={() => onAddToCart(book)}
                          className="flex items-center justify-center gap-2 bg-pink-700 text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl hover:bg-pink-800 transition-all shadow-md hover:shadow-lg dark:hover:shadow-none hover:shadow-pink-100 flex-1 sm:flex-none"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          Add to Bag
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Storefront Layout Component ---
const StorefrontLayout = ({
  cart,
  user,
  books,
  searchQuery,
  setSearchQuery,
  handleLogout,
  handleAddToCart,
  handleUpdateQty,
  handleRemoveFromCart,
  handleOrderComplete,
  handleLogin,
  handleSubscriptionUpdate,
  showToast,
  theme,
  toggleTheme,
}: {
  cart: CartItem[],
  user: User | null,
  books: Book[],
  searchQuery: string,
  setSearchQuery: (q: string) => void,
  handleLogout: () => void,
  handleAddToCart: (b: Book) => void,
  handleUpdateQty: (id: string, q: number) => void,
  handleRemoveFromCart: (id: string) => void,
  handleOrderComplete: () => void,
  handleLogin: (u: User) => void,
  handleSubscriptionUpdate: (u: User) => void,
  showToast: (msg: string, type?: 'success' | 'error') => void,
  theme: 'light' | 'dark',
  toggleTheme: () => void,
}) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const getWishlistKey = (u: User | null) => {
    return u ? `lumina_wishlist_${u.id}` : 'lumina_wishlist_guest';
  };

  const [wishlist, setWishlist] = useState<Book[]>(() => {
    const key = getWishlistKey(user);
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const key = getWishlistKey(user);
    const saved = localStorage.getItem(key);
    setWishlist(saved ? JSON.parse(saved) : []);
  }, [user]);

  useEffect(() => {
    const key = getWishlistKey(user);
    localStorage.setItem(key, JSON.stringify(wishlist));
  }, [wishlist, user]);

  const handleToggleWishlist = (book: Book) => {
    const exists = wishlist.some(b => b.id === book.id);
    if (exists) {
      setWishlist(prev => prev.filter(b => b.id !== book.id));
      showToast(`Removed "${book.title}" from wishlist`);
    } else {
      setWishlist(prev => [...prev, book]);
      showToast(`Added "${book.title}" to wishlist`);
    }
  };

  const [readingList, setReadingList] = useState<Book[]>(() => {
    if (user) {
      const saved = localStorage.getItem(`lumina_reading_list_${user.id}`);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [rlSearchQuery, setRlSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`lumina_reading_list_${user.id}`);
      setReadingList(saved ? JSON.parse(saved) : []);
    } else {
      setReadingList([]);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`lumina_reading_list_${user.id}`, JSON.stringify(readingList));
    }
  }, [readingList, user]);

  const handleAddToRL = (book: Book) => {
    if (!readingList.find(b => b.id === book.id)) {
      setReadingList(prev => [...prev, book]);
      showToast(`${book.title} added to Reading List`);
    } else {
      showToast(`${book.title} is already in your Reading List`, 'error');
    }
  };

  const handleRemoveFromRL = (id: string) => {
    setReadingList(prev => prev.filter(b => b.id !== id));
  };

  const renderModalContent = () => {
    switch (activeModal) {
      case 'Order Status':
        return <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Track your recent orders here. If you have an account, you can see your history in your dashboard. You can also contact our premium support with your order number.</p>;
      case 'Return Policy':
        return <p className="text-gray-600 dark:text-gray-300 leading-relaxed">We offer a 30-day hassle-free return policy. Items must be unread and in original condition. Premium members enjoy free return shipping and priority processing.</p>;
      case 'Shipping Guide':
        return <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Enjoy free shipping on all orders over ₹500. Standard delivery typically takes 2-5 business days. Expedited options are available at checkout.</p>;
      case 'Privacy & Terms':
        return <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Your privacy is our priority. We only use your data to improve your curated recommendations and process your transactions securely. We never sell your personal information.</p>;
      case 'Digital Library':
        return <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium">Buy any book to read its softcopy online.</p>;
      case 'Signed Editions':
        return <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium">There are no currently signed editions, Will be available soon.</p>;
      case 'My Reading List':
        if (!user) {
          return <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Please log in to create your reading list.</p>;
        }
        const rlSearchResults = rlSearchQuery.trim() ? books.filter(b => b.title.toLowerCase().includes(rlSearchQuery.toLowerCase()) || b.author.toLowerCase().includes(rlSearchQuery.toLowerCase())).slice(0, 4) : [];

        return (
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Save books here to read them later.</p>
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search books to add..."
                value={rlSearchQuery}
                onChange={e => setRlSearchQuery(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all font-semibold"
              />
              {rlSearchResults.length > 0 && (
                <div className="absolute top-12 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-[150] overflow-hidden max-h-48 overflow-y-auto">
                  {rlSearchResults.map(b => (
                    <div key={`search-${b.id}`} className="flex items-center justify-between p-3 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <img src={b.coverImage} className="w-6 h-8 object-cover rounded shadow-sm shrink-0" alt="" />
                        <div className="min-w-0 pointer-events-none">
                          <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{b.title}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-450 truncate">{b.author}</p>
                        </div>
                      </div>
                      <button onClick={() => { handleAddToRL(b); setRlSearchQuery(''); }} className="shrink-0 text-xs bg-gray-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-400 font-bold px-3 py-1.5 rounded-lg hover:bg-pink-700 dark:hover:bg-pink-700 hover:text-white transition-colors">Add</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* List */}
            <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl p-4 max-h-52 overflow-y-auto">
              <h5 className="font-bold text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Saved Books ({readingList.length})</h5>
              {readingList.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">Your reading list is empty.</p>
              ) : (
                <div className="space-y-2">
                  {readingList.map(b => (
                    <div key={`list-${b.id}`} className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-2.5 rounded-xl shadow-sm dark:shadow-none group hover:shadow-md dark:hover:shadow-none transition-all">
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <img src={b.coverImage} className="w-8 h-12 object-cover rounded shadow-sm shrink-0" alt="" />
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-gray-850 dark:text-white truncate">{b.title}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{b.author}</p>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveFromRL(b.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0" title="Remove">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header
        cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
        user={user}
        onLogout={handleLogout}
        onSearch={(q) => setSearchQuery(q)}
        theme={theme}
        toggleTheme={toggleTheme}
        wishlistCount={wishlist.length}
        books={books}
      />

      <main className="flex-1 pt-28">
        <Routes>
          <Route path="/" element={<Home books={books} onAddToCart={handleAddToCart} searchQuery={searchQuery} user={user} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} cart={cart} />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/bestsellers" element={<BestsellersPage books={books} onAddToCart={handleAddToCart} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} cart={cart} />} />
          <Route path="/book/:id" element={<BookDetails onAddToCart={handleAddToCart} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} showToast={showToast} />} />
          <Route path="/digital-library" element={<DigitalLibraryPage books={books} showToast={showToast} />} />
          <Route path="/wishlist" element={<WishlistPage wishlist={wishlist} onToggleWishlist={handleToggleWishlist} onAddToCart={handleAddToCart} user={user} />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <Auth onLogin={handleLogin} />} />
          <Route path="/cart" element={<CartPage cart={cart} user={user} onUpdateQty={handleUpdateQty} onRemove={handleRemoveFromCart} />} />
          <Route path="/checkout" element={<Checkout cart={cart} user={user} onOrderComplete={handleOrderComplete} />} />
          <Route path="/premium" element={<SubscriptionPage user={user} onSubscriptionUpdate={handleSubscriptionUpdate} showToast={showToast} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-24 px-4 mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-20">
            <div className="col-span-1">
              <span className="text-3xl serif font-bold text-gray-900 dark:text-white mb-8 block">LuminaBooks</span>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm mb-8 font-medium">
                The ultimate literary sanctuary powered by Gemini AI. Connecting you to stories that matter with intelligence and elegance.
              </p>
              <div className="flex space-x-5">
                {['twitter', 'facebook', 'instagram'].map(platform => (
                  <div key={platform} className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-850 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-pink-700 dark:hover:text-pink-400 hover:bg-gray-100 dark:hover:bg-pink-950/50 cursor-pointer transition-all duration-300">
                    <div className="w-5 h-5 bg-current rounded-sm"></div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-gray-900 dark:text-white font-bold mb-8 uppercase tracking-widest text-[11px]">Explore</h4>
              <ul className="space-y-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
                <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveModal('Digital Library'); }} className="hover:text-pink-700 dark:hover:text-pink-400 transition-colors">Digital Library</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveModal('My Reading List'); }} className="hover:text-pink-700 dark:hover:text-pink-400 transition-colors">My Reading List</a></li>
                <li><Link to="/recommendations" className="hover:text-pink-700 dark:hover:text-pink-400 transition-colors">AI Recommendations</Link></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveModal('Signed Editions'); }} className="hover:text-pink-700 dark:hover:text-pink-400 transition-colors">Signed Editions</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 dark:text-white font-bold mb-8 uppercase tracking-widest text-[11px]">Support</h4>
              <ul className="space-y-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
                <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveModal('Order Status'); }} className="hover:text-pink-700 dark:hover:text-pink-400 transition-colors">Order Status</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveModal('Return Policy'); }} className="hover:text-pink-700 dark:hover:text-pink-400 transition-colors">Return Policy</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveModal('Shipping Guide'); }} className="hover:text-pink-700 dark:hover:text-pink-400 transition-colors">Shipping Guide</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveModal('Privacy & Terms'); }} className="hover:text-pink-700 dark:hover:text-pink-400 transition-colors">Privacy & Terms</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 dark:text-white font-bold mb-8 uppercase tracking-widest text-[11px]">Newsletter</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 font-medium">Join 50,000+ readers getting our monthly literary digests.</p>
              <div className="flex bg-gray-50 dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 focus-within:ring-2 focus-within:ring-pink-200 dark:focus-within:ring-pink-900 transition-all">
                <input type="email" placeholder="Email" className="bg-transparent border-none px-4 py-3 text-sm w-full outline-none font-medium text-gray-900 dark:text-gray-100" />
                <button className="bg-pink-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg dark:shadow-none hover:bg-pink-800 transition-all">Join</button>
              </div>
            </div>
          </div>
          <div className="pt-12 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-550">
            <p className="w-full text-center md:text-left">&copy; {new Date().getFullYear()} LuminaBooks Global. All Rights Reserved.</p>
          </div>
        </div>
      </footer>

      <AIAssistant user={user} />

      {/* Support Modal */}
      {activeModal && (
        <div className="fixed inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setActiveModal(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white serif">{activeModal}</h2>
              <button onClick={() => setActiveModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="mb-8 text-gray-605 dark:text-gray-300">
              {renderModalContent()}
            </div>
            <button onClick={() => setActiveModal(null)} className="w-full bg-pink-700 text-white rounded-xl py-3 font-bold text-sm shadow-lg dark:shadow-none hover:bg-pink-800 transition-all active:scale-[0.98]">
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
};


// --- Main App Entry ---

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('lumina_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('lumina_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const [books, setBooks] = useState<Book[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('lumina_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchBooks = async () => {
    try {
      // Hard 5-second timeout — prevents infinite loading if Supabase hangs
      const timeout = new Promise<Book[]>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), 5000)
      );
      const data = await Promise.race([dbService.getBooks(), timeout]);
      setBooks(data);
    } catch (err) {
      console.error('Failed to load books:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        // Seed a demo PDF for "The Midnight Library" if no local PDFs are found
        const localPDFsKey = 'LuminaBooks_LocalPDFs';
        const saved = localStorage.getItem(localPDFsKey);
        if (!saved || saved === '{}') {
          const bookId = '1';
          const demoBase64 = 'JVBERi0xLjQKMSAwIG9iaik8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PmVuZG9iagoyIDAgb2JqPDwvVHlwZS9QYWdlcy9LaWRzWzMgMCBSXS9Db3VudCAxPj5lbmRvYmoKMyAwIG9iajw8L1R5cGUvUGFnZS9QYXJlbnQgMiAwIFIvTWVkaWFCb3hbMCAwIDU5NSA4NDJdL1Jlc291cmNlczw8L0ZvbnQ8PC9GMSA0IDAgUj4+Pj4vQ29udGVudHMgNSAwIFI+PmVuZG9iago0IDAgb2JqPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhPj5lbmRvYmoKNSAwIG9iajw8L0xlbmd0aCA3Nj4+c3RyZWFtCkJUKi9GMSAyNCBUZioxMDAgNjAwIFRkKihXZWxjb21lIHRvIEx1bWluYSBFLUxpYnJhcnkhKSBUaiowIC00MCBUZCgoc2FtcGxlIGUtYm9vayByZWFkZXIgcGFnZSkpIFRqRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTYgMDAwMDAgbiAKMDAwMDAwMDExMSAwMDAwMCBuIAowMDAwMDAwMjEyIDAwMDAwIG4gCjAwMDAwMDAyNzggMDAwMDAgbiAKdHJhaWxlcjw8L1NpemUgNi9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCjQwNQolJUVPRg==';
          try {
            const binary = atob(demoBase64);
            const array = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              array[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([array], { type: 'application/pdf' });
            const file = new File([blob], 'the_midnight_library_sample.pdf', { type: 'application/pdf' });
            await pdfStorage.savePDF(bookId, file);
            
            const localPDFs = { [bookId]: `local://the_midnight_library_sample.pdf` };
            localStorage.setItem(localPDFsKey, JSON.stringify(localPDFs));
            console.log('Seeded demo PDF successfully.');
          } catch (err) {
            console.error('Failed to seed demo PDF:', err);
          }
        }
        await fetchBooks();
      } finally {
        setIsLoading(false); // Always exit the splash screen
      }
    };
    init();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const handleAddToCart = (book: Book) => {
    if (book.stock === 0) {
      showToast(`"${book.title}" is out of stock.`, 'error');
      return;
    }
    // Block premium-only books for non-premium users
    const isPremium = user?.isPremium && user?.subscriptionEndDate
      ? new Date(user.subscriptionEndDate) > new Date()
      : false;
    if (book.isPremiumOnly && !isPremium) {
      showToast('Upgrade to Premium to purchase this exclusive title.', 'error');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === book.id);
      if (existing) {
        if (existing.quantity >= book.stock) {
          showToast(`Only ${book.stock} unit${book.stock > 1 ? 's' : ''} of "${book.title}" available.`, 'error');
          return prev;
        }
        return prev.map(item => item.id === book.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...book, quantity: 1 }];
    });
    showToast(`"${book.title}" added to your collection!`);
  };

  const handleUpdateQty = (id: string, qty: number) => {
    if (qty < 1) return;
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item));
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleOrderComplete = () => {
    setCart([]);
    fetchBooks(); // Refresh book stock counts after purchase
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('lumina_user', JSON.stringify(newUser));
  };

  const handleSubscriptionUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('lumina_user', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('lumina_user');
    setCart([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-pink-950 text-white">
        <div className="w-16 h-16 border-4 border-pink-400 border-t-transparent rounded-full animate-spin mb-6 shadow-2xl"></div>
        <h2 className="text-3xl serif font-bold animate-pulse tracking-widest uppercase">Lumina</h2>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col selection:bg-gray-200 selection:text-gray-900 scroll-smooth bg-[#FAFAFA] dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Routes>
          {/* Protected Admin Route - Independent Layout */}
          <Route
            path="/admin/*"
            element={
              user?.role === UserRole.ADMIN
                ? <AdminDashboard books={books} onRefresh={fetchBooks} user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
                : <Navigate to="/login" />
            }
          />

          {/* Main Storefront Layer – redirect admins away from storefront */}
          <Route path="/*" element={
            user?.role === UserRole.ADMIN
              ? <Navigate to="/admin" replace />
              : <StorefrontLayout
                cart={cart}
                user={user}
                books={books}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleLogout={handleLogout}
                handleAddToCart={handleAddToCart}
                handleUpdateQty={handleUpdateQty}
                handleRemoveFromCart={handleRemoveFromCart}
                handleOrderComplete={handleOrderComplete}
                handleLogin={handleLogin}
                handleSubscriptionUpdate={handleSubscriptionUpdate}
                showToast={showToast}
                theme={theme}
                toggleTheme={toggleTheme}
              />
          } />
        </Routes>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </Router>
  );
};

// --- Re-using the CartPage logic ---
const CartPage = ({ cart, onUpdateQty, onRemove, user }: { cart: CartItem[], onUpdateQty: (id: string, q: number) => void, onRemove: (id: string) => void, user: User | null }) => {
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="w-32 h-32 bg-gray-100 dark:bg-pink-950/50 text-gray-400 dark:text-pink-700 rounded-full flex items-center justify-center mx-auto mb-10">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-4xl serif font-bold mb-6 text-gray-900 dark:text-white">Your bag is empty</h2>
        <p className="text-gray-400 dark:text-gray-500 mb-12 max-w-sm mx-auto text-lg">Every great story starts with a single page. Start your journey by browsing our hand-picked collection.</p>
        <Link to="/" className="inline-block bg-pink-700 text-white px-12 py-5 rounded-2xl font-bold text-lg shadow-2xl dark:shadow-none hover:bg-pink-800 transition-all hover:scale-105 active:scale-95">Start Browsing</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">My Bag</h1>
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{cart.length} item{cart.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 space-y-2.5">
          {cart.map(item => (
            <div key={item.id} className="group flex flex-col sm:flex-row sm:items-center gap-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 hover:border-pink-100 dark:hover:border-pink-900/50 hover:shadow-md dark:hover:shadow-none transition-all duration-300">
              {/* Cover & Info & Mobile Remove */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {/* Cover */}
                <Link to={`/book/${item.id}`} className="flex-shrink-0 w-12 h-[68px] rounded-lg overflow-hidden shadow-md dark:shadow-none group-hover:scale-105 transition-transform duration-300">
                  <img src={item.coverImage} className="w-full h-full object-cover" alt={item.title} />
                </Link>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link to={`/book/${item.id}`}>
                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-pink-700 dark:group-hover:text-pink-400 transition-colors">{item.title}</p>
                  </Link>
                  <p className="text-xs text-gray-400 dark:text-gray-550 truncate">by {item.author}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">₹{item.price.toFixed(2)} each</p>
                </div>
                {/* Mobile Remove */}
                <button onClick={() => onRemove(item.id)} className="sm:hidden flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-xl text-gray-300 dark:text-gray-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all" title="Remove item">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              {/* Stepper & Total & Desktop Remove */}
              <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-gray-100 dark:border-gray-800/40 pt-2.5 sm:pt-0 sm:border-0 w-full sm:w-auto">
                {/* Quantity stepper */}
                <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-1 py-1 flex-shrink-0">
                  <button onClick={() => onUpdateQty(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-pink-700 dark:hover:text-pink-400 disabled:opacity-30 transition-all">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" /></svg>
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-gray-800 dark:text-gray-250">{item.quantity}</span>
                  <button onClick={() => onUpdateQty(item.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-pink-700 dark:hover:text-pink-400 transition-all">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>
                {/* Line total */}
                <p className="w-20 text-right font-bold text-sm text-gray-900 dark:text-pink-300 flex-shrink-0">₹{(item.price * item.quantity).toFixed(2)}</p>
                {/* Desktop Remove */}
                <button onClick={() => onRemove(item.id)} className="hidden sm:flex flex-shrink-0 w-7 h-7 items-center justify-center rounded-xl text-gray-300 dark:text-gray-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all" title="Remove item">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          ))}
          <Link to="/" className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Continue Shopping
          </Link>
        </div>

        {/* Order Summary */}
        <div className="lg:w-[280px] w-full flex-shrink-0 sticky top-24">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-lg dark:shadow-none">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-550 mb-4">Order Summary</h3>
            <div className="space-y-2.5 text-sm mb-4">
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-800 dark:text-gray-250">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Shipping</span>
                <span className="font-semibold text-green-600 dark:text-green-400">Free</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>GST (8%)</span>
                <span className="font-semibold text-gray-800 dark:text-gray-250">₹{tax.toFixed(2)}</span>
              </div>
            </div>
            <div className="border-t border-dashed border-gray-100 dark:border-gray-800 pt-4 mb-5 flex justify-between items-center">
              <span className="font-bold text-gray-900 dark:text-white">Total</span>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900 dark:text-pink-400">₹{total.toFixed(2)}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">incl. all fees</p>
              </div>
            </div>
            <Link
              to={user ? "/checkout" : "/login"}
              className="block w-full bg-pink-700 text-white py-3 rounded-xl text-center font-bold text-sm hover:bg-pink-800 transition-all shadow-lg dark:shadow-none shadow-pink-100 hover:scale-[1.02] active:scale-[0.98]"
            >
              {user ? 'Proceed to Checkout →' : 'Login to Purchase'}
            </Link>
            <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                Secure
              </span>
              <span className="text-gray-200 dark:text-gray-700">|</span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                Free Returns
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
