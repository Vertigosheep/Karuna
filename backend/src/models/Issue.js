const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    location: {
      lat: { type: Number, required: [true, 'Latitude is required'] },
      lng: { type: Number, required: [true, 'Longitude is required'] },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['food', 'shelter', 'medical', 'education', 'other'],
        message: 'Category must be one of: food, shelter, medical, education, other',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'completed'],
      default: 'pending',
    },
    priorityScore: {
      type: Number,
      default: 0,
    },
    mlAnalysis: {
      keywords:      { type: [String], default: [] },
      category:      { type: String,  default: '' },
      severityScore: { type: Number,  default: 0 },
      analyzed:      { type: Boolean, default: false },
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Issue', issueSchema);
