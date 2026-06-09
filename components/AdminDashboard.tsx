import React, { useState, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Book, Order, User, UserRole } from '../types';
import { dbService } from '../services/dbService';
import { CATEGORIES } from '../constants';
import { pdfStorage } from '../services/pdfStorage';

// ─────────────────────────────────────────────────────────
// SVG Icon helpers
// ─────────────────────────────────────────────────────────
const Icon = ({ path, className = 'w-5 h-5' }: { path: string; className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

const ICONS = {
    overview: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    inventory: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    orders: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    users: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
    chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    plus: 'M12 4v16m8-8H4',
    edit: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
    trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    alert: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.75 19 7.5 19s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
};

type AdminTab = 'overview' | 'inventory' | 'orders' | 'users' | 'settings';

// ─────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, iconPath, accent }: { label: string; value: string | number; sub?: string; iconPath: string; accent: string }) => {
    const isIndigo = accent.includes('text-indigo-900');
    const isRed = accent.includes('text-red-500');
    const isGreen = accent.includes('text-green-600');
    
    let bgClasses = 'bg-amber-50 dark:bg-amber-950/30';
    if (isIndigo) bgClasses = 'bg-gray-100 dark:bg-indigo-950/30';
    else if (isRed) bgClasses = 'bg-red-50 dark:bg-red-950/30';
    else if (isGreen) bgClasses = 'bg-green-50 dark:bg-green-950/30';

    return (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-7 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between gap-4">
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-2">{label}</p>
                <p className={`text-4xl font-bold ${accent}`}>{value}</p>
                {sub && <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-1">{sub}</p>}
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${bgClasses}`}>
                <Icon path={iconPath} className={`w-7 h-7 ${accent}`} />
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────
// Overview Panel
// ─────────────────────────────────────────────────────────
const OverviewPanel = ({ books, orders, users }: { books: Book[]; orders: Order[]; users: User[] }) => {
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
    const lowStock = books.filter(b => b.stock < 10).length;
    const recentOrders = [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

    const statusColor: Record<string, string> = {
        pending: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
        processing: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
        completed: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50',
        cancelled: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50',
    };

    return (
        <div className="animate-in fade-in duration-300 space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-indigo-950 dark:text-indigo-100 mb-1 tracking-tight">Store Overview</h2>
                <p className="text-gray-400 dark:text-gray-500 font-medium text-sm">Real-time snapshot of your platform</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} sub="All time" iconPath={ICONS.chart} accent="text-indigo-900 dark:text-indigo-400" />
                <StatCard label="Total Books" value={books.length} sub={`${books.filter(b => b.isBestseller).length} bestsellers`} iconPath={ICONS.book} accent="text-indigo-900 dark:text-indigo-400" />
                <StatCard label="Active Orders" value={pendingOrders} sub="Needs attention" iconPath={ICONS.orders} accent="text-amber-600 dark:text-amber-400" />
                <StatCard label="Low Stock" value={lowStock} sub="< 10 units" iconPath={ICONS.alert} accent="text-red-500 dark:text-red-400" />
            </div>

            {/* Secondary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <StatCard label="Total Orders" value={orders.length} sub="Lifetime" iconPath={ICONS.check} accent="text-green-600 dark:text-green-400" />
                <StatCard label="Registered Users" value={users.length} sub="Total accounts" iconPath={ICONS.users} accent="text-indigo-900 dark:text-indigo-400" />
                <StatCard label="Out of Stock" value={books.filter(b => b.stock === 0).length} sub="Needs restocking" iconPath={ICONS.alert} accent="text-red-500 dark:text-red-400" />
            </div>

            {/* Recent Orders */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-850 flex items-center justify-between">
                    <h3 className="font-bold text-indigo-950 dark:text-indigo-100 text-lg">Recent Orders</h3>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Last 6</span>
                </div>
                {recentOrders.length === 0
                    ? <p className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">No orders yet.</p>
                    : recentOrders.map(order => (
                        <div key={order.id} className="px-8 py-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                            <div>
                                <p className="font-bold text-indigo-900 dark:text-indigo-400 text-sm font-mono">{order.id.slice(0, 16)}…</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{order.items.length} item{order.items.length > 1 ? 's' : ''} · {new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-indigo-900 dark:text-indigo-300">₹{order.total.toLocaleString()}</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${statusColor[order.status] || 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}>{order.status}</span>
                            </div>
                        </div>
                    ))
                }
            </div>

            {/* Category breakdown */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-800">
                    <h3 className="font-bold text-indigo-950 dark:text-indigo-100 text-lg">Inventory by Category</h3>
                </div>
                <div className="p-8 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                    {CATEGORIES.filter(c => c !== 'All').map(cat => {
                        const count = books.filter(b => b.category === cat).length;
                        const pct = books.length ? Math.round((count / books.length) * 100) : 0;
                        return (
                            <div key={cat} className="bg-gray-100/85 dark:bg-indigo-950/40 border border-transparent dark:border-gray-800 rounded-2xl p-4">
                                <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">{cat}</p>
                                <p className="text-2xl font-bold text-indigo-950 dark:text-indigo-100">{count}</p>
                                <div className="mt-2 h-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 overflow-hidden">
                                    <div className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500" style={{ width: `${pct}%` }} />
                                </div>
                                <p className="text-[10px] text-indigo-400 dark:text-indigo-500 font-bold mt-1">{pct}% of catalogue</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────
// Book Row (virtualised)
// ─────────────────────────────────────────────────────────
const BookRow = ({ index, style, data }: { index: number; style: React.CSSProperties; data: { books: Book[]; onDelete: (id: string) => void; onEdit: (b: Book) => void } }) => {
    const book = data.books[index];
    return (
        <div style={style} className="flex items-center border-b border-gray-50 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-indigo-950/20 transition-colors group px-8">
            <div className="flex-[2] flex items-center space-x-4 min-w-0 pr-4">
                <img src={book.coverImage} className="w-10 h-14 object-cover rounded-lg shadow-md flex-shrink-0" alt="" />
                <div className="truncate">
                    <p className="font-bold text-indigo-950 dark:text-indigo-100 text-sm truncate">{book.title}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest truncate">{book.author}</p>
                </div>
            </div>
            <div className="flex-1 px-4 hidden sm:block">
                <span className="text-xs text-gray-400 dark:text-gray-550 font-semibold">{book.category}</span>
            </div>
            <div className="flex-1 px-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${book.stock === 0 ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400' : book.stock < 10 ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400' : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'}`}>
                    {book.stock === 0 ? 'OUT' : `${book.stock} units`}
                </span>
            </div>
            <div className="flex-1 px-4 font-bold text-indigo-900 dark:text-indigo-300 text-base hidden sm:block">
                ₹{book.price.toFixed(2)}
            </div>
            <div className="flex-shrink-0 px-4 flex justify-end">
                <div className="flex space-x-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => data.onEdit(book)} className="p-2.5 bg-gray-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white transition-all">
                        <Icon path={ICONS.edit} className="w-4 h-4" />
                    </button>
                    <button onClick={() => data.onDelete(book.id)} className="p-2.5 bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-500 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-all">
                        <Icon path={ICONS.trash} className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────
// Inventory Panel
// ─────────────────────────────────────────────────────────
const InventoryPanel = ({ books, onRefresh }: { books: Book[]; onRefresh: () => void }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [search, setSearch] = useState('');
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfFileName, setPdfFileName] = useState<string>('');
    const [form, setForm] = useState<Omit<Book, 'id'>>({
        title: '', author: '', price: 0, category: 'Fiction', description: '', coverImage: 'https://picsum.photos/seed/newbook/400/600', rating: 4.5, stock: 10, isBestseller: false, pdfUrl: '',
    });

    const filtered = books.filter(b =>
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase())
    );

    const openAdd = () => {
        setForm({ title: '', author: '', price: 0, category: 'Fiction', description: '', coverImage: 'https://picsum.photos/seed/newbook/400/600', rating: 4.5, stock: 10, isBestseller: false, pdfUrl: '' });
        setPdfFile(null);
        setPdfFileName('');
        setEditingBook(null);
        setIsAdding(true);
    };
    
    const openEdit = (book: Book) => { 
        setForm({ ...book, pdfUrl: book.pdfUrl || '' }); 
        setPdfFile(null);
        setPdfFileName(book.pdfUrl ? (book.pdfUrl.startsWith('local://') ? 'Uploaded Local PDF' : book.pdfUrl) : '');
        setEditingBook(book); 
        setIsAdding(true); 
    };

    const handleCancel = () => { 
        setIsAdding(false); 
        setEditingBook(null); 
        setPdfFile(null);
        setPdfFileName('');
    };

    const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                alert('Please select a valid PDF file.');
                return;
            }
            setPdfFile(file);
            setPdfFileName(file.name);
            setForm(prev => ({ ...prev, pdfUrl: `local://${file.name}` }));
        }
    };

    const handleRemovePdf = async () => {
        setForm(prev => ({ ...prev, pdfUrl: '' }));
        setPdfFile(null);
        setPdfFileName('');
        if (editingBook) {
            try {
                await pdfStorage.deletePDF(editingBook.id);
            } catch (err) {
                console.warn("Failed to delete local PDF:", err);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let savedBook: Book;
            if (editingBook) {
                savedBook = await dbService.updateBook(editingBook.id, form);
            } else {
                savedBook = await dbService.addBook(form);
            }

            if (pdfFile) {
                const localPdfUrl = await pdfStorage.savePDF(savedBook.id, pdfFile);
                await dbService.updateBook(savedBook.id, { pdfUrl: localPdfUrl });
            }
        } catch (err: any) {
            alert("Error saving book: " + err.message);
        }
        handleCancel();
        onRefresh();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Remove this title from the catalogue?')) {
            await dbService.deleteBook(id);
            onRefresh();
        }
    };

    return (
        <div className="animate-in fade-in duration-300 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-indigo-950 dark:text-indigo-100 mb-1 tracking-tight">Book Catalogue</h2>
                    <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">{books.length} titles · ₹{books.reduce((a, b) => a + b.price * b.stock, 0).toLocaleString()} inventory value</p>
                </div>
                <div className="flex gap-3">
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search titles or authors…"
                        className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-800 text-gray-900 dark:text-gray-100 shadow-sm w-56"
                    />
                    <button onClick={openAdd} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 whitespace-nowrap">
                        <Icon path={ICONS.plus} className="w-4 h-4" /> New Title
                    </button>
                </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Total Titles', val: books.length, color: 'text-indigo-900 dark:text-indigo-400' },
                    { label: 'Low Stock', val: books.filter(b => b.stock > 0 && b.stock < 10).length, color: 'text-amber-600 dark:text-amber-400' },
                    { label: 'Out of Stock', val: books.filter(b => b.stock === 0).length, color: 'text-red-500 dark:text-red-400' },
                ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                        <p className={`text-3xl font-bold ${s.color}`}>{s.val}</p>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-550 uppercase tracking-widest mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Form */}
{isAdding && (
    <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border-2 border-indigo-100 dark:border-indigo-900/50 shadow-2xl animate-in slide-in-from-top-4">
        <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-400 mb-6">{editingBook ? 'Edit Catalogue Entry' : 'Add New Title'}</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <input required className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-800 text-sm text-gray-900 dark:text-gray-100 border border-transparent dark:border-gray-700/50" placeholder="Book Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                <input required className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-800 text-sm text-gray-900 dark:text-gray-100 border border-transparent dark:border-gray-700/50" placeholder="Author" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
                <select className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-800 text-sm text-gray-900 dark:text-gray-100 border border-transparent dark:border-gray-700/50" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">{c}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-4">
                    <input required type="number" step="0.01" min="0" className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-800 text-sm text-gray-900 dark:text-gray-100 border border-transparent dark:border-gray-700/50" placeholder="Price (₹)" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })} />
                    <input required type="number" min="0" className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-800 text-sm text-gray-900 dark:text-gray-100 border border-transparent dark:border-gray-700/50" placeholder="Stock" value={form.stock} onChange={e => setForm({ ...form, stock: parseInt(e.target.value) })} />
                </div>
                <label className="flex items-center gap-3 text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                    <input type="checkbox" checked={form.isBestseller} onChange={e => setForm({ ...form, isBestseller: e.target.checked })} className="w-4 h-4 rounded accent-indigo-600" />
                    Mark as Bestseller
                </label>
            </div>
            <div className="space-y-4">
                <textarea required className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-800 text-sm text-gray-900 dark:text-gray-100 border border-transparent dark:border-gray-700/50 h-28 resize-none" placeholder="Description / Summary" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <input className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-800 text-sm text-gray-900 dark:text-gray-100 border border-transparent dark:border-gray-700/50" placeholder="Cover Image URL" value={form.coverImage} onChange={e => setForm({ ...form, coverImage: e.target.value })} />
                {form.coverImage && <img src={form.coverImage} alt="preview" className="h-28 rounded-xl object-cover shadow" />}
                
                {/* PDF File Upload Input */}
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-550 block">Book PDF (Optional)</label>
                    <div className="flex items-center gap-3">
                        <label className="flex-1 flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-indigo-950/20 transition-all text-sm text-gray-600 dark:text-gray-300">
                            <svg className="w-5 h-5 text-indigo-500 flex-shrink-0 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span className="truncate">{pdfFileName || "Choose PDF File"}</span>
                            <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfFileChange} />
                        </label>
                        {(pdfFileName || form.pdfUrl) && (
                            <button type="button" onClick={handleRemovePdf} className="p-4 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all text-sm font-bold flex items-center gap-1.5 flex-shrink-0" title="Remove PDF">
                                <Icon path={ICONS.trash} className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {(pdfFileName || form.pdfUrl) && (
                        <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-1">
                            {pdfFileName ? `Selected: ${pdfFileName}` : "PDF is uploaded and available"}
                        </p>
                    )}
                </div>

                <div className="flex gap-3 pt-2">
                    <button type="submit" className="flex-1 bg-indigo-900 dark:bg-indigo-700 text-white py-4 rounded-xl font-bold hover:bg-black dark:hover:bg-indigo-600 transition-all">
                        {editingBook ? 'Save Changes' : 'Add to Catalogue'}
                    </button>
                    <button type="button" onClick={handleCancel} className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-4 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                        Cancel
                    </button>
                </div>
            </div>
        </form>
    </div>
)}

{/* Table */}
<div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
    <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800 flex items-center px-8 py-4">
        <div className="flex-[2] text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Title / Author</div>
        <div className="flex-1 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-550 hidden sm:block">Category</div>
        <div className="flex-1 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-550">Stock</div>
        <div className="flex-1 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-550 hidden sm:block">Price</div>
        <div className="flex-shrink-0 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-555 text-right w-24">Actions</div>
    </div>
    <div className="h-[540px]">
        <List
            height={540} itemCount={filtered.length} itemSize={88} width="100%"
            itemData={{ books: filtered, onDelete: handleDelete, onEdit: openEdit }}
        >
            {BookRow}
        </List>
    </div>
</div>
</div>
);
};

// ─────────────────────────────────────────────────────────
// Orders Panel
// ─────────────────────────────────────────────────────────
const OrdersPanel = () => {
const [orders, setOrders] = useState<Order[]>([]);
const [loading, setLoading] = useState(true);
const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'cancelled'>('all');

useEffect(() => { fetchOrders(); }, []);

const fetchOrders = async () => {
setLoading(true);
try { setOrders(await dbService.getOrders()); } catch (e: any) { alert(e.message); }
setLoading(false);
};

const handleStatus = async (id: string, status: 'pending' | 'processing' | 'completed' | 'cancelled') => {
await dbService.updateOrderStatus(id, status);
fetchOrders();
};

const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
const counts = { all: orders.length, pending: orders.filter(o => o.status === 'pending').length, processing: orders.filter(o => o.status === 'processing').length, completed: orders.filter(o => o.status === 'completed').length, cancelled: orders.filter(o => o.status === 'cancelled').length };
const statusColor: Record<string, string> = {
pending: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
processing: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
completed: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50',
cancelled: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50',
};

return (
<div className="animate-in fade-in duration-300 space-y-6">
<div>
    <h2 className="text-3xl font-bold text-indigo-950 dark:text-indigo-100 mb-1 tracking-tight">Orders</h2>
    <p className="text-gray-400 dark:text-gray-550 text-sm font-medium">{orders.length} total orders · ₹{orders.reduce((a, o) => a + o.total, 0).toLocaleString()} revenue</p>
</div>

{/* Filter tabs */}
<div className="flex flex-wrap gap-2">
    {(['all', 'pending', 'processing', 'completed', 'cancelled'] as const).map(f => (
        <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-indigo-200 dark:hover:border-indigo-800'}`}
        >
            {f} <span className="ml-1 opacity-70">({counts[f]})</span>
        </button>
    ))}
</div>

{loading
    ? <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>
    : (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* Header */}
                    <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800 grid grid-cols-12 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-555">
                        <div className="col-span-4">Order ID</div>
                        <div className="col-span-2">Items</div>
                        <div className="col-span-2">Date</div>
                        <div className="col-span-2">Total</div>
                        <div className="col-span-2 text-right">Status</div>
                    </div>
                    {filtered.length === 0 && <p className="p-12 text-center text-gray-400 dark:text-gray-550 text-sm">No orders for this filter.</p>}
                    {filtered.map(order => (
                        <div key={order.id} className="grid grid-cols-12 px-8 py-5 items-center border-b border-gray-50 dark:border-gray-800 last:border-none hover:bg-gray-50 dark:hover:bg-indigo-950/20 transition-colors">
                            <div className="col-span-4">
                                <p className="font-bold text-indigo-900 dark:text-indigo-400 text-xs font-mono tracking-tight">{order.id.slice(0, 20)}…</p>
                            </div>
                            <div className="col-span-2">
                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{order.items.length} book{order.items.length > 1 ? 's' : ''}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="font-bold text-indigo-900 dark:text-indigo-300 text-sm">₹{order.total.toLocaleString()}</span>
                            </div>
                            <div className="col-span-2 flex justify-end">
                                <select
                                    value={order.status}
                                    onChange={e => handleStatus(order.id, e.target.value as any)}
                                    className={`text-[10px] font-black px-3 py-2 rounded-xl outline-none border cursor-pointer uppercase tracking-widest ${statusColor[order.status] || 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
                                >
                                    <option value="pending" className="bg-white dark:bg-gray-800">Pending</option>
                                    <option value="processing" className="bg-white dark:bg-gray-800">Processing</option>
                                    <option value="completed" className="bg-white dark:bg-gray-800">Completed</option>
                                    <option value="cancelled" className="bg-white dark:bg-gray-800">Cancelled</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
</div>
);
};

// ─────────────────────────────────────────────────────────
// Users Panel
// ─────────────────────────────────────────────────────────
const UsersPanel = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            setUsers(await dbService.getUsers());
        } catch (e: any) {
            alert(e.message);
        }
        setLoading(false);
    };

    const handleRoleToggle = async (targetUser: User) => {
        const nextRole = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
        if (confirm(`Change ${targetUser.name}'s role to ${nextRole}?`)) {
            try {
                await dbService.updateUserRole(targetUser.id, nextRole);
                fetchUsers();
            } catch (e: any) {
                alert(e.message);
            }
        }
    };

    return (
        <div className="animate-in fade-in duration-300 space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-indigo-950 dark:text-indigo-100 mb-1 tracking-tight">Registered Users</h2>
                <p className="text-gray-400 dark:text-gray-550 text-sm font-medium">{users.length} registered accounts</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Total Users', val: users.length, color: 'text-indigo-900 dark:text-indigo-400' },
                    { label: 'Admins', val: users.filter(u => u.role === 'ADMIN').length, color: 'text-indigo-900 dark:text-indigo-400' },
                    { label: 'Customers', val: users.filter(u => u.role !== 'ADMIN').length, color: 'text-green-600 dark:text-green-400' },
                ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                        <p className={`text-3xl font-bold ${s.color}`}>{s.val}</p>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-550 uppercase tracking-widest mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {loading
                ? <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>
                : (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <div className="min-w-[800px]">
                                {/* Header */}
                                <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800 grid grid-cols-12 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-555">
                                    <div className="col-span-1">Avatar</div>
                                    <div className="col-span-4">Name</div>
                                    <div className="col-span-3">Email</div>
                                    <div className="col-span-2">Role</div>
                                    <div className="col-span-2 text-right">Actions</div>
                                </div>
                                {users.length === 0 && <p className="p-12 text-center text-gray-400 dark:text-gray-550 text-sm">No registered users found.</p>}
                                {users.map(u => (
                                    <div key={u.id} className="grid grid-cols-12 px-8 py-5 items-center border-b border-gray-50 dark:border-gray-800 last:border-none hover:bg-gray-50 dark:hover:bg-indigo-950/20 transition-colors group">
                                        <div className="col-span-1">
                                            <img
                                                src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=6366f1&color=fff&size=80`}
                                                className="w-9 h-9 rounded-full ring-2 ring-white dark:ring-gray-800 shadow"
                                                alt=""
                                            />
                                        </div>
                                        <div className="col-span-4">
                                            <p className="font-bold text-indigo-950 dark:text-indigo-100 text-sm">{u.name}</p>
                                        </div>
                                        <div className="col-span-3">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={u.email}>{u.email && u.email !== 'N/A' ? u.email : <span className="text-gray-400 dark:text-gray-600 italic">No email on file</span>}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${u.role === 'ADMIN' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                                                {u.role}
                                            </span>
                                        </div>
                                        <div className="col-span-2 flex justify-end">
                                            <button
                                                onClick={() => handleRoleToggle(u)}
                                                className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all ${u.role === 'ADMIN' ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-600 dark:hover:bg-red-500 hover:text-white' : 'bg-gray-100 dark:bg-indigo-950/30 border-gray-250 dark:border-indigo-850 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white'}`}
                                            >
                                                {u.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

// ─────────────────────────────────────────────────────────
// Settings Panel
// ─────────────────────────────────────────────────────────
const SettingsPanel = ({ adminUser }: { adminUser: User }) => {
    const [saved, setSaved] = useState(false);
    const [storeName, setStoreName] = useState('LuminaBooks');
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [newOrderEmails, setNewOrderEmails] = useState(true);
    const [lowStockAlerts, setLowStockAlerts] = useState(true);
    const [lowStockThreshold, setLowStockThreshold] = useState(10);
    const [taxRate, setTaxRate] = useState(8);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const Toggle = ({ value, onChange, label, desc }: { value: boolean; onChange: () => void; label: string; desc?: string }) => (
        <div className="flex items-center justify-between py-5 border-b border-gray-50 dark:border-gray-800 last:border-none">
            <div>
                <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{label}</p>
                {desc && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>}
            </div>
            <button
                type="button"
                onClick={onChange}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${value ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-gray-950 rounded-full shadow transform transition-transform duration-200 ${value ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
        </div>
    );

    return (
        <div className="animate-in fade-in duration-300 space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-indigo-950 dark:text-indigo-100 mb-1 tracking-tight">Settings</h2>
                <p className="text-gray-400 dark:text-gray-550 font-medium text-sm">Platform configuration &amp; preferences</p>
            </div>

            {saved && (
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400 rounded-2xl px-6 py-4 text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top-2">
                    <Icon path={ICONS.check} className="w-5 h-5 text-green-600 dark:text-green-450" />
                    Settings saved successfully!
                </div>
            )}

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Store Settings */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-8 space-y-6">
                    <h3 className="font-bold text-indigo-950 dark:text-indigo-100 text-lg border-b border-gray-50 dark:border-gray-800 pb-4">Store Configuration</h3>
                    <div>
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-550 mb-2 block">Store Name</label>
                        <input className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-800 text-sm font-semibold text-gray-900 dark:text-gray-100 border border-transparent dark:border-gray-750" value={storeName} onChange={e => setStoreName(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-550 mb-2 block">Tax Rate (%)</label>
                        <input type="number" min="0" max="100" className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-800 text-sm font-semibold text-gray-900 dark:text-gray-100 border border-transparent dark:border-gray-750" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value))} />
                    </div>
                    <div>
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-550 mb-2 block">Low Stock Alert Threshold (units)</label>
                        <input type="number" min="1" className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-800 text-sm font-semibold text-gray-900 dark:text-gray-100 border border-transparent dark:border-gray-750" value={lowStockThreshold} onChange={e => setLowStockThreshold(parseInt(e.target.value))} />
                    </div>
                    <Toggle value={maintenanceMode} onChange={() => setMaintenanceMode(p => !p)} label="Maintenance Mode" desc="Temporarily hides the storefront from customers" />
                </div>

                {/* Notifications */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-8 space-y-2">
                    <h3 className="font-bold text-indigo-950 dark:text-indigo-100 text-lg border-b border-gray-50 dark:border-gray-800 pb-4 mb-4">Notification Preferences</h3>
                    <Toggle value={newOrderEmails} onChange={() => setNewOrderEmails(p => !p)} label="New Order Alerts" desc="Get notified whenever a new order is placed" />
                    <Toggle value={lowStockAlerts} onChange={() => setLowStockAlerts(p => !p)} label="Low Stock Alerts" desc="Receive alerts when inventory drops below threshold" />
                </div>

                {/* Admin Profile */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-8 lg:col-span-2">
                    <h3 className="font-bold text-indigo-950 dark:text-indigo-100 text-lg border-b border-gray-50 dark:border-gray-800 pb-4 mb-6">Admin Profile</h3>
                    <div className="flex items-center gap-6">
                        <img
                            src={adminUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(adminUser.name)}&background=4f46e5&color=fff&size=120`}
                            className="w-20 h-20 rounded-2xl shadow-lg ring-4 ring-indigo-50 dark:ring-indigo-950"
                            alt="Admin"
                        />
                        <div>
                            <p className="text-2xl font-bold text-indigo-950 dark:text-indigo-100">{adminUser.name}</p>
                            <p className="text-sm text-gray-400 dark:text-gray-550 font-medium mt-1">{adminUser.email}</p>
                            <span className="mt-2 inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-indigo-600 text-white">Administrator</span>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <button type="submit" className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all">
                        Save All Settings
                    </button>
                </div>
            </form>
        </div>
    );
};

// ─────────────────────────────────────────────────────────
// Main Admin Dashboard
// ─────────────────────────────────────────────────────────
export const AdminDashboard = ({ books, onRefresh, user, onLogout }: {
    books: Book[];
    onRefresh: () => void;
    user: User;
    onLogout: () => void;
}) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    // Load data eagerly for Overview
    useEffect(() => {
        const load = async () => {
            try {
                const [o, u] = await Promise.all([dbService.getOrders(), dbService.getUsers()]);
                setOrders(o);
                setUsers(u);
            } catch (_) { }
        };
        load();
    }, []);

    const navItems: { id: AdminTab; label: string; iconPath: string }[] = [
        { id: 'overview', label: 'Overview', iconPath: ICONS.overview },
        { id: 'inventory', label: 'Inventory', iconPath: ICONS.inventory },
        { id: 'orders', label: 'Orders', iconPath: ICONS.orders },
        { id: 'users', label: 'Users', iconPath: ICONS.users },
        { id: 'settings', label: 'Settings', iconPath: ICONS.settings },
    ];

    const pendingCount = orders.filter(o => o.status === 'pending').length;

    return (
        <div className="min-h-screen flex bg-[#F4F5FA] dark:bg-gray-950 font-sans transition-colors duration-300">
            {/* ── Sidebar ── */}
            <aside className="w-64 flex-shrink-0 hidden md:flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-transparent text-gray-850 dark:text-white min-h-screen sticky top-0 h-screen transition-colors duration-300">
                {/* Brand */}
                <div className="px-7 py-8 border-b border-gray-150 dark:border-gray-800">
                    <span className="text-2xl font-black tracking-tight text-indigo-955 dark:text-white serif">Lumina</span>
                    <span className="ml-1 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest align-middle">Admin</span>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group ${activeTab === item.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10 dark:shadow-none'
                                : 'text-gray-550 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-white'
                                }`}
                        >
                            <Icon path={item.iconPath} className="w-5 h-5 flex-shrink-0" />
                            {item.label}
                            {item.id === 'orders' && pendingCount > 0 && (
                                <span className="ml-auto bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center">{pendingCount}</span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Admin user footer */}
                <div className="px-5 py-6 border-t border-gray-150 dark:border-gray-800">
                    <div className="flex items-center gap-3 mb-4">
                        <img
                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff&size=80`}
                            className="w-9 h-9 rounded-xl ring-2 ring-indigo-600 dark:ring-gray-700"
                            alt=""
                        />
                        <div className="min-w-0">
                            <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{user.name}</p>
                            <p className="text-indigo-600 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest">Administrator</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-bold text-gray-550 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-600 dark:hover:text-white transition-all"
                    >
                        <Icon path={ICONS.logout} className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* ── Mobile Top Bar ── */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 text-gray-800 dark:text-white flex items-center justify-between px-5 py-4 shadow border-b border-gray-150 dark:border-gray-800 transition-colors duration-300">
                <span className="text-xl font-black serif flex-shrink-0 text-indigo-955 dark:text-white">Lumina <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest">Admin</span></span>
                <div className="flex gap-2 overflow-x-auto">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            title={item.label}
                            className={`p-2.5 rounded-xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 dark:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-indigo-600'}`}
                        >
                            <Icon path={item.iconPath} className="w-5 h-5" />
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Main Content ── */}
            <main className="flex-1 min-w-0 md:p-10 p-5 pt-24 md:pt-10 overflow-y-auto">
                {/* Top bar (desktop) */}
                <div className="hidden md:flex items-center justify-between mb-10">
                    <div>
                        <p className="text-xs font-black text-gray-400 dark:text-gray-550 uppercase tracking-widest">Welcome back,</p>
                        <h1 className="text-2xl font-bold text-indigo-950 dark:text-indigo-100">{user.name}</h1>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.6)]" />Live</span>
                        <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                </div>

                {/* Panels */}
                {activeTab === 'overview' && <OverviewPanel books={books} orders={orders} users={users} />}
                {activeTab === 'inventory' && <InventoryPanel books={books} onRefresh={onRefresh} />}
                {activeTab === 'orders' && <OrdersPanel />}
                {activeTab === 'users' && <UsersPanel />}
                {activeTab === 'settings' && <SettingsPanel adminUser={user} />}
            </main>
        </div>
    );
};
