require('dotenv').config();
const mongoose = require('mongoose');
const StudyPlan = require('./src/models/StudyPlan');

async function diagnose() {
  try {
    console.log('Connecting to:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('Fetching study plans...');
    const plans = await StudyPlan.find({});
    console.log(`✅ Found ${plans.length} plans`);
    
    if (plans.length > 0) {
      console.log('First plan sample:', JSON.stringify(plans[0].topics[0], null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Diagnostics Failed:');
    console.error(err);
    process.exit(1);
  }
}

diagnose();
