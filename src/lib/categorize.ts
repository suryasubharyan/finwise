import { prisma } from "@/lib/prisma";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: ["swiggy", "zomato", "food", "restaurant", "cafe", "dominos", "pizza", "eatclub"],
  Transport: ["uber", "ola", "rapido", "petrol", "fuel", "metro", "irctc", "fastag"],
  Shopping: ["amazon", "flipkart", "myntra", "ajio", "meesho", "nykaa"],
  Entertainment: ["netflix", "spotify", "hotstar", "prime video", "bookmyshow", "youtube"],
  Housing: ["rent", "landlord", "maintenance"],
  Utilities: ["electricity", "water bill", "broadband", "wifi", "recharge", "airtel", "jio", "vi "],
  Health: ["pharmacy", "hospital", "apollo", "clinic", "medicine"],
  Income: ["salary", "payroll", "stipend"],
  Investment: ["mutual fund", "sip", "zerodha", "groww", "upstox"],
  Transfer: ["upi", "imps", "neft", "transfer"],
};

let categoryIdCache: Record<string, string> | null = null;

async function getCategoryId(name: string): Promise<string> {
  if (!categoryIdCache) categoryIdCache = {};
  if (categoryIdCache[name]) return categoryIdCache[name];

  const category = await prisma.category.upsert({
    where: { name },
    update: {},
    create: { name },
  });

  categoryIdCache[name] = category.id;
  return category.id;
}

/**
 * Learning categorization: if this user has previously categorized (or
 * corrected) a transaction from the same merchant, reuse that category —
 * this is what makes corrections "stick" per PRD's Money Story requirement,
 * and the system gets smarter per-user over time without any ML model.
 * Falls back to keyword matching for merchants never seen before.
 */
export async function guessCategoryId(
  merchant: string,
  userId?: string
): Promise<string | null> {
  if (userId) {
    const learned = await prisma.transaction.findFirst({
      where: {
        merchant: { equals: merchant, mode: "insensitive" },
        categoryId: { not: null },
        account: { userId },
      },
      orderBy: { updatedAt: "desc" },
      select: { categoryId: true },
    });
    if (learned?.categoryId) return learned.categoryId;
  }

  const lower = merchant.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return getCategoryId(category);
    }
  }

  return null;
}
