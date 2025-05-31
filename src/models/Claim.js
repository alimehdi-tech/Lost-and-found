import mongoose from 'mongoose';

const ClaimSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  claimant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  message: {
    type: String,
    required: [true, 'Claim message is required'],
    trim: true,
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  proofImages: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    }
  }],
  verificationQuestions: [{
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      default: null
    }
  }],
  meetingDetails: {
    location: {
      type: String,
      trim: true
    },
    dateTime: {
      type: Date
    },
    notes: {
      type: String,
      trim: true
    }
  },
  adminNotes: {
    type: String,
    trim: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  rating: {
    claimantRating: {
      score: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        trim: true
      }
    },
    ownerRating: {
      score: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        trim: true
      }
    }
  }
}, {
  timestamps: true
});

// Indexes
ClaimSchema.index({ item: 1, claimant: 1 }, { unique: true });
ClaimSchema.index({ status: 1, createdAt: -1 });
ClaimSchema.index({ claimant: 1 });
ClaimSchema.index({ itemOwner: 1 });

// Virtual for claim age
ClaimSchema.virtual('age').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24)); // days
});

// Method to approve claim
ClaimSchema.methods.approve = function(reviewerId, notes = '') {
  this.status = 'approved';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.adminNotes = notes;
  return this.save();
};

// Method to reject claim
ClaimSchema.methods.reject = function(reviewerId, notes = '') {
  this.status = 'rejected';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.adminNotes = notes;
  return this.save();
};

// Method to complete claim
ClaimSchema.methods.complete = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

export default mongoose.models.Claim || mongoose.model('Claim', ClaimSchema);
