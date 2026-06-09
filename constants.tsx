
import React from 'react';
import { Book } from './types';

export const CATEGORIES = [
  "All",
  "Fiction",
  "Science Fiction",
  "Fantasy",
  "Biography",
  "Technology",
  "History",
  "Business",
  "Philosophy"
];

export const MOCK_BOOKS: Book[] = [
  {
    id: "1",
    title: "The Midnight Library",
    author: "Matt Haig",
    price: 24.99,
    category: "Fiction",
    description: "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.",
    coverImage: "https://picsum.photos/seed/library/400/600",
    rating: 4.8,
    stock: 12,
    isBestseller: true
  },
  {
    id: "2",
    title: "Dune",
    author: "Frank Herbert",
    price: 1560,
    category: "Science Fiction",
    description: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world.",
    coverImage: "https://picsum.photos/seed/dune/400/600",
    rating: 4.9,
    stock: 5,
    isBestseller: true
  },
  {
    id: "3",
    title: "Steve Jobs",
    author: "Walter Isaacson",
    price: 2560,
    category: "Biography",
    description: "Based on more than forty interviews with Jobs conducted over two years—as well as interviews with more than a hundred family members, friends, adversaries, competitors, and colleagues.",
    coverImage: "https://picsum.photos/seed/jobs/400/600",
    rating: 4.7,
    stock: 8
  },
  {
    id: "4",
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    price: 2240,
    category: "History",
    description: "Dr. Yuval Noah Harari spans the whole of human history, from the very first humans to walk the earth to the radical—and sometimes devastating—breakthroughs of the Cognitive, Agricultural, and Scientific Revolutions.",
    coverImage: "https://picsum.photos/seed/sapiens/400/600",
    rating: 4.9,
    stock: 20
  },
  {
    id: "5",
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    price: 1680,
    category: "Business",
    description: "Daniel Kahneman, the renowned psychologist and winner of the Nobel Prize in Economics, takes us on a groundbreaking tour of the mind and explains the two systems that drive the way we think.",
    coverImage: "https://picsum.photos/seed/thinking/400/600",
    rating: 4.6,
    stock: 15
  },
  {
    id: "6",
    title: "The Alchemist",
    author: "Paulo Coelho",
    price: 1279,
    category: "Philosophy",
    description: "Combining magic, mysticism, wisdom and wonder into an inspiring tale of self-discovery, The Alchemist has become a modern classic.",
    coverImage: "https://picsum.photos/seed/alchemist/400/600",
    rating: 4.8,
    stock: 30,
    isBestseller: true
  }
];
