const StudyPlan = require('../models/StudyPlan');

const getPlans = async (req, res) => {
  try {
    const plans = await StudyPlan.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ detail: 'Server error' });
  }
};

const deletePlan = async (req, res) => {
  try {
    const plan = await StudyPlan.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!plan) {
      return res.status(404).json({ detail: 'Plan not found' });
    }
    res.json({ message: 'Plan deleted' });
  } catch (error) {
    res.status(500).json({ detail: 'Server error' });
  }
};

module.exports = { getPlans, deletePlan };
