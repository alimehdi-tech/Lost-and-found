import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Item title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Electronics',
      'Books & Stationery',
      'Clothing & Accessories',
      'ID Cards & Documents',
      'Keys',
      'Water Bottles',
      'Bags & Backpacks',
      'Sports Equipment',
      'Jewelry',
      'Other'
    ]
  },
  type: {
    type: String,
    required: [true, 'Item type is required'],
    enum: ['lost', 'found']
  },
  status: {
    type: String,
    enum: ['active', 'claimed', 'resolved', 'archived'],
    default: 'active'
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String
    },
    name: {
      type: String
    },
    type: {
      type: String
    },
    size: {
      type: Number
    }
  }],
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [100, 'Location cannot be more than 100 characters']
  },
  dateOccurred: {
    type: Date,
    required: [true, 'Date is required'],
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: 'Date cannot be in the future'
    }
  },
  contactInfo: {
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      trim: true
    },
    preferredContact: {
      type: String,
      enum: ['email', 'phone', 'chat'],
      default: 'email'
    }
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isUrgent: {
    type: Boolean,
    default: false
  },
  reward: {
    offered: {
      type: Boolean,
      default: false
    },
    amount: {
      type: Number,
      min: 0
    },
    description: {
      type: String,
      trim: true
    }
  },
  views: {
    type: Number,
    default: 0
  },
  claimsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ItemSchema.index({ type: 1, status: 1, createdAt: -1 });
ItemSchema.index({ category: 1, type: 1 });
ItemSchema.index({ location: 1, type: 1 });
ItemSchema.index({ postedBy: 1 });
ItemSchema.index({ tags: 1 });
ItemSchema.index({ 'contactInfo.email': 1 });

// Virtual for age of the post
ItemSchema.virtual('age').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24)); // days
});

// Method to increment views
ItemSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to increment claims count
ItemSchema.methods.incrementClaims = function() {
  this.claimsCount += 1;
  return this.save();
};

export default mongoose.models.Item || mongoose.model('Item', ItemSchema);
