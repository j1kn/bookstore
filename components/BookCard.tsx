
import React from 'react';
import { Link } from 'react-router-dom';
import { Book, User, CartItem } from '../types';

interface BookCardProps {
  book: Book;
  onAddToCart: (book: Book) => void;
  user?: User | null;
  isInWishlist?: boolean;
  onToggleWishlist?: (book: Book) => void;
  cartItems?: CartItem[];
}

const BookCard: React.FC<BookCardProps> = ({ book, onAddToCart, user, isInWishlist = false, onToggleWishlist, cartItems = [] }) => {
  const isOutOfStock = book.stock === 0;
  const isLowStock = book.stock > 0 && book.stock < 5;
  const isInCart = cartItems.some(item => item.id === book.id);

  const isPremiumUser = user?.isPremium && user?.subscriptionEndDate
    ? new Date(user.subscriptionEndDate) > new Date()
    : false;

  const isPremiumLocked = book.isPremiumOnly && !isPremiumUser;

  const discountRate = isPremiumUser ? (book.isPremiumOnly ? 0.15 : 0.10) : 0;
  const discountedPrice = book.price * (1 - discountRate);

  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(book.rating));

  return (
    <div
      className={`group relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col
        ${isOutOfStock ? 'opacity-70' : ''}
        ${isPremiumLocked
          ? 'border-amber-200 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-xl hover:shadow-amber-100/60 dark:hover:shadow-none'
          : isInCart
            ? 'border-pink-200 dark:border-pink-800/60 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-xl hover:shadow-pink-100/50 dark:hover:shadow-none'
            : 'border-gray-100 dark:border-gray-800 hover:border-pink-100 dark:hover:border-pink-900/50 hover:shadow-xl dark:hover:shadow-none'
        }`}
    >
      {/* Cover */}
      <div className="relative aspect-[2/3] overflow-hidden bg-gray-50 dark:bg-gray-950">
        <img
          src={book.coverImage}
          alt={book.title}
          className={`w-full h-full object-cover transition-transform duration-500
            ${isPremiumLocked ? 'blur-[2px] brightness-75' : ''}
            ${isOutOfStock ? 'grayscale' : 'group-hover:scale-105'}`}
        />

        {/* Premium lock overlay on image */}
        {isPremiumLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-pink-950/50 dark:bg-pink-950/70">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #fcd34d, #d97706)', boxShadow: '0 0 16px rgba(251,191,36,0.5)' }}
            >
              <svg className="w-5 h-5 text-amber-900" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 1a5 5 0 00-5 5v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2h-1V6a5 5 0 00-5 5zm3 7V6a3 3 0 10-6 0v2h6zm-3 4a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>
            <Link
              to="/premium"
              className="text-[9px] font-black uppercase tracking-widest text-amber-900 px-2.5 py-1 rounded-full"
              style={{ background: 'linear-gradient(90deg, #f59e0b, #fcd34d)' }}
            >
              Unlock
            </Link>
          </div>
        )}

        {/* Badges — top left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {/* In Cart badge */}
          {isInCart && !isPremiumLocked && (
            <span className="bg-pink-600/95 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full self-start flex items-center gap-0.5">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
              In Cart
            </span>
          )}
          {/* Premium exclusive ribbon */}
          {book.isPremiumOnly && (
            <span
              className="text-amber-900 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ background: 'linear-gradient(90deg, #f59e0b, #fcd34d)', boxShadow: '0 2px 8px rgba(251,191,36,0.4)' }}
            >
              ✦ Premium
            </span>
          )}
          {/* Premium discount badge */}
          {isPremiumUser && discountRate > 0 && (
            <span className="bg-pink-500/90 dark:bg-pink-600/80 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full self-start">
              -{Math.round(discountRate * 100)}% OFF
            </span>
          )}
          {isOutOfStock && !book.isPremiumOnly && (
            <span className="bg-gray-800/90 dark:bg-gray-950/90 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full self-start">
              Sold Out
            </span>
          )}
          {!isOutOfStock && book.isBestseller && !book.isPremiumOnly && !isInCart && (
            <span className="bg-pink-700/90 dark:bg-pink-700/80 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full self-start">
              Bestseller
            </span>
          )}
          {isLowStock && !book.isPremiumOnly && (
            <span className="bg-amber-500/90 dark:bg-amber-600/80 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full self-start">
              Only {book.stock} left
            </span>
          )}
        </div>

        {/* Wishlist Heart Button — top right */}
        {onToggleWishlist && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleWishlist(book);
            }}
            className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-md text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-all hover:scale-105 active:scale-95"
            title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <svg
              className={`w-4.5 h-4.5 transition-transform duration-300 ${isInWishlist ? 'text-red-500 fill-current scale-110' : 'text-gray-400 dark:text-gray-500'}`}
              fill={isInWishlist ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}

        {/* Quick-action overlay — only for non-locked books */}
        {!isOutOfStock && !isPremiumLocked && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3">
            <Link
              to={`/book/${book.id}`}
              className="flex items-center gap-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-pink-900 dark:text-pink-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </Link>
            <button
              onClick={() => onAddToCart(book)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors shadow-sm ${isInCart ? 'bg-pink-500 text-white hover:bg-pink-600' : 'bg-pink-700 text-white hover:bg-pink-800'}`}
              title={isInCart ? "Already in cart" : "Add to cart"}
            >
              {isInCart ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col gap-1.5">
        {/* Category & rating row */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-pink-700 dark:text-pink-400 uppercase tracking-wider">{book.category}</span>
          <div className="flex items-center gap-0.5">
            {stars.map((filled, i) => (
              <svg key={i} className={`w-2.5 h-2.5 ${filled ? 'text-amber-400 fill-current' : 'text-gray-200 dark:text-gray-700 fill-current'}`} viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-1 text-[9px] font-bold text-gray-400 dark:text-gray-500">{book.rating}</span>
          </div>
        </div>

        {/* Title */}
        <Link to={`/book/${book.id}`}>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug group-hover:text-pink-700 dark:group-hover:text-pink-400 transition-colors">
            {book.title}
          </h3>
        </Link>

        {/* Author */}
        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium truncate">by {book.author}</p>

        {/* Description snippet */}
        {book.description && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 line-clamp-2 leading-relaxed hidden sm:block">{book.description}</p>
        )}

        {/* Price + CTA */}
        <div className="mt-auto pt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-gray-50 dark:border-gray-800">
          <div>
            {isPremiumUser && discountRate > 0 ? (
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 line-through leading-none">₹{book.price.toFixed(2)}</span>
                <span className="text-sm font-bold text-pink-600 dark:text-pink-400">₹{discountedPrice.toFixed(2)}</span>
              </div>
            ) : (
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">₹{book.price.toFixed(2)}</span>
            )}
          </div>

          {isPremiumLocked ? (
            <Link
              to="/premium"
              className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-900 px-2.5 py-1.5 rounded-lg transition-all hover:scale-105 w-full sm:w-auto text-center"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #fcd34d)' }}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Unlock
            </Link>
          ) : isOutOfStock ? (
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center py-1.5 w-full sm:w-auto">Unavailable</span>
          ) : isInCart ? (
            <button
              onClick={() => onAddToCart(book)}
              className="text-[10px] font-bold uppercase tracking-wider bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-400 border border-pink-200 dark:border-pink-800 px-2.5 py-1.5 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-all w-full sm:w-auto text-center flex items-center justify-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              In Cart
            </button>
          ) : (
            <button
              onClick={() => onAddToCart(book)}
              className="text-[10px] font-bold uppercase tracking-wider bg-pink-700 text-white px-2.5 py-1.5 rounded-lg hover:bg-pink-800 transition-all hover:shadow-md hover:shadow-pink-100 dark:hover:shadow-none w-full sm:w-auto text-center"
            >
              Add to Bag
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookCard;
