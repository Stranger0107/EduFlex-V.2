const insightController = require('../controllers/insightController');

async function runOnce() {
  try {
    console.log('Cron: Running weekly insights generation job (startup)');
    await insightController.doGenerateWeeklyInsights();
    console.log('Cron: Weekly insights generation complete');
  } catch (err) {
    console.error('Cron: Error running weekly insights job', err);
  }
}

// Run once at startup
runOnce();

// Schedule a simple weekly runner: check every 6 hours and run when it's Monday 02:00 server time
setInterval(async () => {
  try {
    const now = new Date();
    const day = now.getDay(); // 1 == Monday
    const hour = now.getHours();
    if (day === 1 && hour === 2) {
      console.log('Cron: Running scheduled weekly insights job (Monday 02:00)');
      await insightController.doGenerateWeeklyInsights();
      console.log('Cron: Scheduled weekly insights job complete');
    }
  } catch (err) {
    console.error('Cron interval error:', err);
  }
}, 1000 * 60 * 60 * 6);

module.exports = { runOnce };
