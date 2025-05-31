// Image Similarity Service using Canvas API and basic computer vision techniques
// This is a client-side implementation that works without external AI services

export class ImageSimilarityService {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.initCanvas();
  }

  initCanvas() {
    if (typeof window !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }
  }

  // Convert image to a standardized format for comparison
  async imageToCanvas(imageUrl, size = 64) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        this.canvas.width = size;
        this.canvas.height = size;
        
        // Draw image scaled to standard size
        this.ctx.drawImage(img, 0, 0, size, size);
        
        // Get image data
        const imageData = this.ctx.getImageData(0, 0, size, size);
        resolve(imageData);
      };
      
      img.onerror = reject;
      img.src = imageUrl;
    });
  }

  // Extract color histogram from image
  extractColorHistogram(imageData) {
    const data = imageData.data;
    const histogram = {
      red: new Array(256).fill(0),
      green: new Array(256).fill(0),
      blue: new Array(256).fill(0)
    };

    for (let i = 0; i < data.length; i += 4) {
      histogram.red[data[i]]++;
      histogram.green[data[i + 1]]++;
      histogram.blue[data[i + 2]]++;
    }

    return histogram;
  }

  // Extract dominant colors
  extractDominantColors(imageData, numColors = 5) {
    const data = imageData.data;
    const colorMap = new Map();

    // Sample every 4th pixel for performance
    for (let i = 0; i < data.length; i += 16) {
      const r = Math.floor(data[i] / 32) * 32;
      const g = Math.floor(data[i + 1] / 32) * 32;
      const b = Math.floor(data[i + 2] / 32) * 32;
      const color = `${r},${g},${b}`;
      
      colorMap.set(color, (colorMap.get(color) || 0) + 1);
    }

    // Sort by frequency and return top colors
    return Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, numColors)
      .map(([color, count]) => {
        const [r, g, b] = color.split(',').map(Number);
        return { r, g, b, count };
      });
  }

  // Calculate edge density (simple edge detection)
  calculateEdgeDensity(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    let edgeCount = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Convert to grayscale
        const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
        const bottom = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;
        
        // Simple edge detection
        const edgeStrength = Math.abs(current - right) + Math.abs(current - bottom);
        if (edgeStrength > 30) {
          edgeCount++;
        }
      }
    }

    return edgeCount / (width * height);
  }

  // Extract comprehensive features from image
  async extractFeatures(imageUrl) {
    try {
      const imageData = await this.imageToCanvas(imageUrl);
      
      const features = {
        colorHistogram: this.extractColorHistogram(imageData),
        dominantColors: this.extractDominantColors(imageData),
        edgeDensity: this.calculateEdgeDensity(imageData),
        brightness: this.calculateBrightness(imageData),
        contrast: this.calculateContrast(imageData)
      };

      return features;
    } catch (error) {
      console.error('Error extracting features:', error);
      return null;
    }
  }

  calculateBrightness(imageData) {
    const data = imageData.data;
    let total = 0;
    let count = 0;

    for (let i = 0; i < data.length; i += 4) {
      total += (data[i] + data[i + 1] + data[i + 2]) / 3;
      count++;
    }

    return total / count;
  }

  calculateContrast(imageData) {
    const data = imageData.data;
    const brightness = this.calculateBrightness(imageData);
    let variance = 0;
    let count = 0;

    for (let i = 0; i < data.length; i += 4) {
      const pixelBrightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      variance += Math.pow(pixelBrightness - brightness, 2);
      count++;
    }

    return Math.sqrt(variance / count);
  }

  // Compare two sets of features and return similarity score (0-1)
  compareFeatures(features1, features2) {
    if (!features1 || !features2) return 0;

    let totalScore = 0;
    let weights = 0;

    // Compare color histograms
    const colorScore = this.compareColorHistograms(features1.colorHistogram, features2.colorHistogram);
    totalScore += colorScore * 0.3;
    weights += 0.3;

    // Compare dominant colors
    const dominantColorScore = this.compareDominantColors(features1.dominantColors, features2.dominantColors);
    totalScore += dominantColorScore * 0.25;
    weights += 0.25;

    // Compare edge density
    const edgeScore = 1 - Math.abs(features1.edgeDensity - features2.edgeDensity) / Math.max(features1.edgeDensity, features2.edgeDensity, 0.1);
    totalScore += edgeScore * 0.2;
    weights += 0.2;

    // Compare brightness
    const brightnessScore = 1 - Math.abs(features1.brightness - features2.brightness) / 255;
    totalScore += brightnessScore * 0.15;
    weights += 0.15;

    // Compare contrast
    const contrastScore = 1 - Math.abs(features1.contrast - features2.contrast) / Math.max(features1.contrast, features2.contrast, 1);
    totalScore += contrastScore * 0.1;
    weights += 0.1;

    return totalScore / weights;
  }

  compareColorHistograms(hist1, hist2) {
    let similarity = 0;
    const channels = ['red', 'green', 'blue'];

    for (const channel of channels) {
      let channelSimilarity = 0;
      for (let i = 0; i < 256; i++) {
        channelSimilarity += Math.min(hist1[channel][i], hist2[channel][i]);
      }
      similarity += channelSimilarity;
    }

    return similarity / (64 * 64 * 3); // Normalize by total pixels * channels
  }

  compareDominantColors(colors1, colors2) {
    let totalSimilarity = 0;
    let comparisons = 0;

    for (const color1 of colors1) {
      let bestMatch = 0;
      for (const color2 of colors2) {
        const distance = Math.sqrt(
          Math.pow(color1.r - color2.r, 2) +
          Math.pow(color1.g - color2.g, 2) +
          Math.pow(color1.b - color2.b, 2)
        );
        const similarity = 1 - (distance / (255 * Math.sqrt(3)));
        bestMatch = Math.max(bestMatch, similarity);
      }
      totalSimilarity += bestMatch;
      comparisons++;
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  // Find similar items from a list
  async findSimilarItems(targetImageUrl, itemsList, threshold = 0.3) {
    const targetFeatures = await this.extractFeatures(targetImageUrl);
    if (!targetFeatures) return [];

    const similarities = [];

    for (const item of itemsList) {
      if (!item.images || item.images.length === 0) continue;

      // Compare with the first image of each item
      const itemFeatures = await this.extractFeatures(item.images[0].url);
      if (itemFeatures) {
        const similarity = this.compareFeatures(targetFeatures, itemFeatures);
        
        if (similarity >= threshold) {
          similarities.push({
            item,
            similarity,
            matchedImage: item.images[0].url
          });
        }
      }
    }

    // Sort by similarity score (highest first)
    return similarities.sort((a, b) => b.similarity - a.similarity);
  }
}

// Singleton instance
let imageSimilarityService = null;

export function getImageSimilarityService() {
  if (!imageSimilarityService && typeof window !== 'undefined') {
    imageSimilarityService = new ImageSimilarityService();
  }
  return imageSimilarityService;
}
