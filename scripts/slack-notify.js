#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('💬 Sending Slack notification...');

async function sendSlackNotification() {
  try {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    const channel = process.env.SLACK_CHANNEL || '#ci-cd';
    const username = process.env.SLACK_USERNAME || 'CI/CD Symphony';
    const icon = process.env.SLACK_ICON || ':musical_note:';
    const onlyFailures = process.env.SLACK_ONLY_FAILURES === 'true';
    
    if (!webhookUrl) {
      console.log('⚠️ No Slack webhook URL configured, skipping notification');
      return;
    }
    
    // Read analysis results
    const resultsPath = path.join(__dirname, '../reports/analysis-results.json');
    let results = {};
    
    if (fs.existsSync(resultsPath)) {
      results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    }
    
    // Generate Slack message
    const message = generateSlackMessage(results);
    
    console.log('Slack Message Content:');
    console.log('='.repeat(50));
    console.log(JSON.stringify(message, null, 2));
    console.log('='.repeat(50));
    
    console.log('✅ Slack notification content generated');
    console.log('📌 In a real environment, this would be sent to:', webhookUrl);
    
  } catch (error) {
    console.error('❌ Slack notification failed:', error.message);
  }
}

function generateSlackMessage(results) {
  const { bundleSize, performance, coverage } = results;
  
  return {
    channel: process.env.SLACK_CHANNEL || '#ci-cd',
    username: process.env.SLACK_USERNAME || 'CI/CD Symphony',
    icon_emoji: process.env.SLACK_ICON || ':musical_note:',
    text: 'CI/CD Pipeline Completed',
    attachments: [
      {
        color: 'good',
        title: '🎼 CI/CD Symphony Results',
        fields: [
          {
            title: '📦 Bundle Size',
            value: bundleSize?.sizeFormatted || 'N/A',
            short: true
          },
          {
            title: '⚡ Performance',
            value: `${performance?.scores?.performance || 'N/A'}/100`,
            short: true
          },
          {
            title: '🧪 Coverage',
            value: `${coverage?.total?.lines?.pct || 'N/A'}%`,
            short: true
          },
          {
            title: '🕒 Timestamp',
            value: new Date().toISOString(),
            short: true
          }
        ],
        footer: 'CI/CD Symphony',
        ts: Math.floor(Date.now() / 1000)
      }
    ]
  };
}

if (require.main === module) {
  sendSlackNotification();
}

module.exports = { sendSlackNotification };