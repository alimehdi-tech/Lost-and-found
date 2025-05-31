import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Item from '@/models/Item';
import { authOptions } from '@/lib/auth';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const { imageUrl, itemType, excludeItemId, category, limit = 10 } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Build query to find items to compare against
    const query = {
      status: 'active',
      images: { $exists: true, $ne: [] }
    };

    // If looking for lost items, search in found items and vice versa
    if (itemType === 'lost') {
      query.type = 'found';
    } else if (itemType === 'found') {
      query.type = 'lost';
    }

    // Filter by category if provided
    if (category && category !== 'all') {
      query.category = category;
    }

    // Exclude the current item if provided
    if (excludeItemId) {
      query._id = { $ne: excludeItemId };
    }

    // Exclude user's own items
    query.postedBy = { $ne: session.user.id };

    // Fetch items with images
    const items = await Item.find(query)
      .populate('postedBy', 'name avatar email')
      .limit(limit * 2) // Get more items to filter through
      .lean();

    if (items.length === 0) {
      return NextResponse.json({
        similarItems: [],
        message: 'No items found for comparison'
      });
    }

    // For server-side processing, we'll use a simpler approach
    // In a production environment, you might want to use a proper AI service
    const similarItems = await findSimilarItemsServer(imageUrl, items, limit);

    return NextResponse.json({
      similarItems,
      totalFound: similarItems.length,
      searchCriteria: {
        itemType,
        category,
        excludeItemId
      }
    });

  } catch (error) {
    console.error('Image similarity search error:', error);
    return NextResponse.json(
      { error: 'Failed to find similar items' },
      { status: 500 }
    );
  }
}

// Server-side similarity matching using basic image analysis
async function findSimilarItemsServer(targetImageUrl, items, limit) {
  const similarities = [];

  // For now, we'll use a combination of metadata and basic analysis
  // In production, you'd want to use a proper computer vision service
  
  for (const item of items) {
    if (!item.images || item.images.length === 0) continue;

    let similarityScore = 0;
    let factors = [];

    // Factor 1: Category matching (if same category, higher score)
    // This is handled in the query, but we can boost exact matches

    // Factor 2: Color analysis (basic)
    // We'll simulate this with a random score for now
    // In production, you'd extract actual color features
    const colorSimilarity = Math.random() * 0.4 + 0.1; // 0.1 to 0.5
    similarityScore += colorSimilarity * 0.3;
    factors.push({ type: 'color', score: colorSimilarity });

    // Factor 3: Size/dimension hints from description
    const sizeSimilarity = analyzeSizeFromDescription(item.description);
    similarityScore += sizeSimilarity * 0.2;
    factors.push({ type: 'size', score: sizeSimilarity });

    // Factor 4: Keyword matching in title and description
    const textSimilarity = analyzeTextSimilarity(item);
    similarityScore += textSimilarity * 0.3;
    factors.push({ type: 'text', score: textSimilarity });

    // Factor 5: Recency (newer items get slight boost)
    const recencyScore = calculateRecencyScore(item.createdAt);
    similarityScore += recencyScore * 0.1;
    factors.push({ type: 'recency', score: recencyScore });

    // Factor 6: Location proximity
    const locationScore = 0.5; // Default score, could be enhanced with actual location matching
    similarityScore += locationScore * 0.1;
    factors.push({ type: 'location', score: locationScore });

    // Only include items with reasonable similarity
    if (similarityScore > 0.3) {
      similarities.push({
        item,
        similarity: Math.min(similarityScore, 1.0), // Cap at 1.0
        matchedImage: item.images[0].url,
        factors,
        confidence: calculateConfidence(similarityScore, factors)
      });
    }
  }

  // Sort by similarity score and return top results
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

function analyzeSizeFromDescription(description) {
  const sizeKeywords = ['small', 'large', 'big', 'tiny', 'huge', 'medium', 'compact'];
  const desc = description.toLowerCase();
  
  // Simple keyword matching - in production, use NLP
  const hasSize = sizeKeywords.some(keyword => desc.includes(keyword));
  return hasSize ? 0.7 : 0.3;
}

function analyzeTextSimilarity(item) {
  // Simple text analysis - in production, use proper NLP/embedding similarity
  const commonWords = ['phone', 'bag', 'wallet', 'keys', 'laptop', 'book', 'glasses'];
  const title = item.title.toLowerCase();
  const description = item.description.toLowerCase();
  
  let score = 0;
  for (const word of commonWords) {
    if (title.includes(word) || description.includes(word)) {
      score += 0.1;
    }
  }
  
  return Math.min(score, 0.8);
}

function calculateRecencyScore(createdAt) {
  const now = new Date();
  const itemDate = new Date(createdAt);
  const daysDiff = (now - itemDate) / (1000 * 60 * 60 * 24);
  
  // Items posted within last 7 days get higher score
  if (daysDiff <= 7) return 0.8;
  if (daysDiff <= 30) return 0.5;
  return 0.2;
}

function calculateConfidence(similarity, factors) {
  // Calculate confidence based on number of factors and their scores
  const avgFactorScore = factors.reduce((sum, f) => sum + f.score, 0) / factors.length;
  const factorCount = factors.length;
  
  let confidence = 'low';
  if (similarity > 0.7 && avgFactorScore > 0.6 && factorCount >= 4) {
    confidence = 'high';
  } else if (similarity > 0.5 && avgFactorScore > 0.4) {
    confidence = 'medium';
  }
  
  return confidence;
}

// Alternative endpoint for client-side similarity processing
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get('type');
    const category = searchParams.get('category');
    const excludeItemId = searchParams.get('excludeItemId');
    const limit = parseInt(searchParams.get('limit')) || 20;

    // Build query
    const query = {
      status: 'active',
      images: { $exists: true, $ne: [] },
      postedBy: { $ne: session.user.id }
    };

    if (itemType === 'lost') {
      query.type = 'found';
    } else if (itemType === 'found') {
      query.type = 'lost';
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (excludeItemId) {
      query._id = { $ne: excludeItemId };
    }

    // Fetch items for client-side processing
    const items = await Item.find(query)
      .populate('postedBy', 'name avatar')
      .limit(limit)
      .lean();

    return NextResponse.json({
      items,
      totalFound: items.length
    });

  } catch (error) {
    console.error('Error fetching items for similarity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}
