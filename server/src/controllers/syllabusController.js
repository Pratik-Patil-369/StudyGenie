const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const StudyPlan = require('../models/StudyPlan');
const { extractTopics } = require('../utils/topicExtractor');

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'text/plain'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed'));
    }
  }
}).single('syllabus_file');

const createPlanWithFile = (req, res) => {
  upload(req, res, async (multerErr) => {
    if (multerErr) {
      return res.status(400).json({ detail: multerErr.message });
    }

    try {
      const { title, start_date, end_date, subject, current_grade, syllabus } = req.body;

      if (!title || !start_date || !end_date || !subject || !current_grade) {
        return res.status(400).json({ detail: 'Title, dates, subject, and grade are required' });
      }

      let syllabusText = syllabus || '';
      let topics = [];
      let syllabusFileName = null;
      let syllabusFilePath = null;
      let warning = null;

      if (req.file) {
        syllabusFileName = req.file.originalname;
        syllabusFilePath = req.file.filename;

        let fileText = '';
        try {
          if (req.file.mimetype === 'application/pdf') {
            const fileBuffer = fs.readFileSync(req.file.path);
            const data = await pdfParse(fileBuffer);
            fileText = data.text;
          } else {
            fileText = fs.readFileSync(req.file.path, 'utf-8');
          }
        } catch (parseErr) {
          console.error('File parse error:', parseErr.message);
          warning = 'Could not parse the file. You can add topics manually.';
        }

        const cleanedText = fileText.replace(/\s+/g, '').trim();
        if (cleanedText.length > 10) {
          topics = extractTopics(fileText);
          syllabusText = fileText.slice(0, 10000);
        } else {
          warning = 'This PDF appears to be scanned/image-based. Text could not be extracted automatically. Please add topics manually on the topics page.';
        }
      } else if (syllabus) {
        // Handle manual copy-paste text
        topics = extractTopics(syllabus);
        syllabusText = syllabus;
      }

      if (!syllabusText) {
        syllabusText = syllabusFileName ? `File: ${syllabusFileName}` : '';
      }

      const plan = await StudyPlan.create({
        user: req.user.id,
        title,
        syllabus: syllabusText,
        start_date,
        end_date,
        subject,
        current_grade,
        topics,
        syllabus_file_name: syllabusFileName,
        syllabus_file_path: syllabusFilePath,
      });

      const response = plan.toObject();
      if (warning) {
        response.warning = warning;
      }

      res.status(201).json(response);
    } catch (error) {
      console.error('Create plan error:', error);
      res.status(500).json({ detail: 'Server error: ' + error.message });
    }
  });
};

const downloadFile = async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user.id });
    if (!plan || !plan.syllabus_file_path) {
      return res.status(404).json({ detail: 'File not found' });
    }

    const filePath = path.join(uploadsDir, plan.syllabus_file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ detail: 'File no longer exists on disk' });
    }

    res.download(filePath, plan.syllabus_file_name);
  } catch (error) {
    res.status(500).json({ detail: 'Server error' });
  }
};

const getTopics = async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user.id });
    if (!plan) {
      return res.status(404).json({ detail: 'Study plan not found' });
    }
    res.json({ topics: plan.topics, file_name: plan.syllabus_file_name, plan_title: plan.title });
  } catch (error) {
    res.status(500).json({ detail: 'Server error' });
  }
};

const updateTopics = async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user.id });
    if (!plan) {
      return res.status(404).json({ detail: 'Study plan not found' });
    }

    plan.topics = req.body.topics || [];
    await plan.save();

    res.json({ topics: plan.topics });
  } catch (error) {
    res.status(500).json({ detail: 'Server error' });
  }
};

module.exports = { createPlanWithFile, getTopics, updateTopics, downloadFile };
