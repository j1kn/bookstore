
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getBookRecommendation = async (userPreferences: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Given the user's preference: "${userPreferences}", recommend 3 books that they would love. For each book, provide a title, author, and a one-sentence hook. Format the response clearly.`,
      config: { temperature: 0.7, topP: 0.95 },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble thinking of recommendations right now. Why not browse our bestsellers?";
  }
};

export interface RecommendationAnswers {
  mood: string;
  genres: string[];
  themes: string[];
  format: string;
  recentBook: string;
  disliked: string;
  pacePreference: string;
}

export const getDetailedRecommendations = async (answers: RecommendationAnswers): Promise<string> => {
  const prompt = `You are Lumina, a world-class literary curator for LuminaBooks. Based on the following reader profile, recommend exactly 5 books with rich, compelling descriptions.

Reader Profile:
- Current Mood / Reading Goal: ${answers.mood}
- Preferred Genres: ${answers.genres.join(', ') || 'No strong preference'}
- Themes of Interest: ${answers.themes.join(', ') || 'Open to anything'}
- Book Format Preference: ${answers.format}
- Last Book They Loved: ${answers.recentBook || 'Not specified'}
- What They Disliked Recently: ${answers.disliked || 'Not specified'}
- Reading Pace Preference: ${answers.pacePreference}

For each of the 5 recommendations, provide:
1. **Title** by Author Name
2. Genre & Mood tag (e.g., "Dark Literary Fiction · Slow Burn")
3. A compelling 2-sentence reason why this reader will love it
4. A memorable short quote or hook from the book

Format each book clearly separated. Be specific, enthusiastic, and literary. Do not recommend very famous obvious choices unless they truly fit. Aim for a mix of well-known and hidden gems.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { temperature: 0.85, topP: 0.95 },
    });
    return response.text || "Could not generate recommendations. Please try again.";
  } catch (error) {
    console.error("Gemini Recommendations Error:", error);
    return "I'm having trouble generating recommendations right now. Please try again in a moment.";
  }
};


export const getAIBookInsight = async (bookTitle: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Tell me a unique, fascinating fact or philosophical insight about the book "${bookTitle}" that most people don't know. Keep it under 3 sentences.`,
      config: {
        temperature: 0.8,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "This book is a masterpiece of modern literature.";
  }
};

export interface ChatUserContext {
  isPremium: boolean;
  userName?: string;
  subscriptionType?: string;
  favouriteGenres?: string[];
}

export const chatWithAssistant = async (
  message: string,
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  userContext?: ChatUserContext
) => {
  const isPremium = userContext?.isPremium ?? false;
  const userName = userContext?.userName ? `, ${userContext.userName}` : '';
  const genres = userContext?.favouriteGenres?.join(', ') || 'Literary Fiction, Mystery, Science Fiction';

  // Premium books available on LuminaBooks (kept in sync with seed data)
  const PREMIUM_TITLES = ['Dune by Frank Herbert', 'Steve Jobs by Walter Isaacson', 'Sapiens by Yuval Noah Harari'];

  const premiumSystemPrompt = `You are Lumina AI, the premium literary concierge for LuminaBooks — a sophisticated, exclusive bookstore.

MEMBER STATUS: ✦ PREMIUM MEMBER (${userContext?.subscriptionType ?? 'monthly'} plan)
USER: ${userName || 'Valued Premium Member'}
FAVOURITE GENRES: ${genres}

YOUR ROLE & BEHAVIOUR:
- Address the user warmly as a valued premium member
- Give deeply personalised book recommendations based on their favourite genres: ${genres}
- When asked about "premium books" or "exclusive titles", highlight these LuminaBooks premium exclusives: ${PREMIUM_TITLES.join(', ')}
- Offer early-access book tips, hidden gems, and curated picks premium members love
- For order tracking, explain that orders can be tracked via their email confirmation (mock response: "Your last order ORD-XXXX is being processed and will arrive in 2–3 business days")
- Answer customer support FAQs: returns within 30 days, free shipping on orders over ₹500, 24h support for premium members
- Mention their 10–20% premium discount when relevant
- Keep replies concise, warm, and literary. No bullet points for simple answers.`;

  const freeSystemPrompt = `You are Lumina AI, the friendly literary assistant for LuminaBooks — a premium bookstore.

MEMBER STATUS: Free Member
USER: ${userName || 'Reader'}

YOUR ROLE & BEHAVIOUR:
- Give helpful general book recommendations across all categories
- When users ask about "premium books", "exclusive titles", or premium-only content: ALWAYS mention that these are locked for Premium members and suggest upgrading at /premium for ₹199/month or ₹1,499/year
- For order tracking: "Your order can be tracked via your email confirmation. Orders typically arrive in 3–5 business days."
- Answer customer support FAQs: returns within 30 days, free shipping on orders over ₹500
- If asked about discounts: mention that Premium members get 10–20% off all books — a great reason to upgrade!
- Be warm, helpful and literary. Keep replies concise.`;

  try {
    const contents = [
      ...history,
      { role: 'user' as const, parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: {
        systemInstruction: isPremium ? premiumSystemPrompt : freeSystemPrompt,
        temperature: 0.75,
      },
    });

    return response.text;
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    const msg = error?.message || '';
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
      return '⚠️ quota_exceeded';
    }
    return "I apologize, but I encountered an error. How else can I assist you with our collection?";
  }
};
