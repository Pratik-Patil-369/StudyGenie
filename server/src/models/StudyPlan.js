const mongoose = require('mongoose');

const subtopicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  completed: { type: Boolean, default: false }
}, { _id: false });

const topicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subtopics: [subtopicSchema],
  order: { type: Number, default: 0 },
  completed: { type: Boolean, default: false }
});

const studyPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  syllabus: { type: String },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  subject: { type: String, required: true },
  current_grade: { type: String, required: true },
  topics: [topicSchema],
  createdAt: { type: Date, default: Date.now },
  syllabus_file_name: { type: String },
  syllabus_file_path: { type: String }
});

module.exports = mongoose.model('StudyPlan', studyPlanSchema);
