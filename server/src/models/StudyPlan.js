const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subtopics: [String],
  order: { type: Number, default: 0 },
  completed: { type: Boolean, default: false }
}, { _id: true });

const studyPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  syllabus: {
    type: String,
    default: ''
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  current_grade: {
    type: String,
    required: true,
    trim: true
  },
  topics: [topicSchema],
  syllabus_file_name: {
    type: String,
    default: null
  },
  syllabus_file_path: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('StudyPlan', studyPlanSchema);
