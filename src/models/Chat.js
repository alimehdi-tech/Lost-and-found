import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Message cannot be more than 1000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  attachments: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String
    },
    fileName: {
      type: String
    },
    fileSize: {
      type: Number
    },
    mimeType: {
      type: String
    }
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const ChatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  relatedItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  relatedClaim: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Claim'
  },
  chatType: {
    type: String,
    enum: ['item_inquiry', 'claim_discussion', 'support'],
    default: 'item_inquiry'
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'archived'],
    default: 'active'
  },
  messages: [MessageSchema],
  lastMessage: {
    content: {
      type: String
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date
    }
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  isEncrypted: {
    type: Boolean,
    default: false
  },
  closedAt: {
    type: Date
  },
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
ChatSchema.index({ participants: 1, status: 1 });
ChatSchema.index({ relatedItem: 1 });
ChatSchema.index({ relatedClaim: 1 });
ChatSchema.index({ 'lastMessage.timestamp': -1 });

// Virtual for chat age
ChatSchema.virtual('age').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24)); // days
});

// Method to add message
ChatSchema.methods.addMessage = function(senderId, content, messageType = 'text', attachments = []) {
  const message = {
    sender: senderId,
    content,
    messageType,
    attachments
  };
  
  this.messages.push(message);
  this.lastMessage = {
    content,
    sender: senderId,
    timestamp: new Date()
  };
  
  // Update unread count for other participants
  this.participants.forEach(participantId => {
    if (participantId.toString() !== senderId.toString()) {
      const currentCount = this.unreadCount.get(participantId.toString()) || 0;
      this.unreadCount.set(participantId.toString(), currentCount + 1);
    }
  });
  
  return this.save();
};

// Method to mark messages as read
ChatSchema.methods.markAsRead = function(userId) {
  this.unreadCount.set(userId.toString(), 0);
  
  // Mark unread messages as read
  this.messages.forEach(message => {
    if (message.sender.toString() !== userId.toString() && !message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
    }
  });
  
  return this.save();
};

// Method to close chat
ChatSchema.methods.closeChat = function(userId) {
  this.status = 'closed';
  this.closedAt = new Date();
  this.closedBy = userId;
  return this.save();
};

// Static method to find or create chat
ChatSchema.statics.findOrCreateChat = async function(participants, relatedItem, relatedClaim = null) {
  let chat = await this.findOne({
    participants: { $all: participants },
    relatedItem,
    status: 'active'
  });
  
  if (!chat) {
    chat = new this({
      participants,
      relatedItem,
      relatedClaim,
      unreadCount: new Map()
    });
    await chat.save();
  }
  
  return chat;
};

export default mongoose.models.Chat || mongoose.model('Chat', ChatSchema);
