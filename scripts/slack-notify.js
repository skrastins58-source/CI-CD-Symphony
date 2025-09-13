#!/usr/bin/env node

/**
 * CI/CD Symphony - Slack Notification
 * Sends build and metrics notifications to Slack
 */

const fs = require('fs');
const axios = require('axios');

async function sendSlackNotification() {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  const channel = process.env.SLACK_CHANNEL || '#ci-cd';
  const username = process.env.SLACK_USERNAME || 'CI/CD Symphony';
  const icon = process.env.SLACK_ICON || ':musical_note:';
  const onlyFailures = process.env.SLACK_ONLY_FAILURES === 'true';

  if (!webhookUrl) {
    console.log('⚠️ No SLACK_WEBHOOK_URL provided, skipping Slack notification');
    return;
  }

  try {
    // Load analysis results
    let results = { status: 'unknown' };
    if (fs.existsSync('reports/analysis-results.json')) {
      results = JSON.parse(fs.readFileSync('reports/analysis-results.json', 'utf8'));
    }

    // Get GitHub context
    const githubContext = {
      actor: process.env.GITHUB_ACTOR || 'unknown',
      repository: process.env.GITHUB_REPOSITORY || 'unknown',
      ref: process.env.GITHUB_REF || 'unknown',
      sha: process.env.GITHUB_SHA || 'unknown',
      workflow: process.env.GITHUB_WORKFLOW || 'CI/CD Symphony',
      runId: process.env.GITHUB_RUN_ID || 'unknown',
      runNumber: process.env.GITHUB_RUN_NUMBER || 'unknown'
    };

    const isSuccess = results.status === 'success';
    const isPR = process.env.GITHUB_EVENT_NAME === 'pull_request';

    // Skip notification if only failures are requested and this is a success
    if (onlyFailures && isSuccess) {
      console.log('✅ Build successful, skipping notification (SLACK_ONLY_FAILURES=true)');
      return;
    }

    // Prepare notification content
    const color = isSuccess ? 'good' : 'danger';
    const emoji = isSuccess ? '✅' : '❌';
    const status = isSuccess ? 'Success' : 'Failed';
    
    const branch = githubContext.ref.replace('refs/heads/', '');
    const shortSha = githubContext.sha.substring(0, 7);
    const repoUrl = `https://github.com/${githubContext.repository}`;
    const runUrl = `${repoUrl}/actions/runs/${githubContext.runId}`;
    const commitUrl = `${repoUrl}/commit/${githubContext.sha}`;

    // Build metrics summary
    let metricsText = '';
    if (results.lighthouse) {
      metricsText += `\n📊 *Performance:* ${results.lighthouse.performance}/100`;
    }
    if (results.coverage) {
      metricsText += `\n📈 *Coverage:* ${results.coverage.statements.toFixed(1)}%`;
    }
    if (results.bundleSize) {
      const sizeKB = Math.round(results.bundleSize.totalSize / 1024);
      metricsText += `\n📦 *Bundle Size:* ${sizeKB}KB`;
    }

    const attachment = {
      color: color,
      fallback: `${emoji} ${status}: ${githubContext.workflow} #${githubContext.runNumber}`,
      pretext: `${emoji} *${status}*: ${githubContext.workflow} #${githubContext.runNumber}`,
      fields: [
        {
          title: 'Repository',
          value: `<${repoUrl}|${githubContext.repository}>`,
          short: true
        },
        {
          title: 'Branch',
          value: `\`${branch}\``,
          short: true
        },
        {
          title: 'Commit',
          value: `<${commitUrl}|\`${shortSha}\`>`,
          short: true
        },
        {
          title: 'Actor',
          value: githubContext.actor,
          short: true
        }
      ],
      actions: [
        {
          type: 'button',
          text: 'View Run',
          url: runUrl,
          style: isSuccess ? 'primary' : 'danger'
        }
      ],
      footer: 'CI/CD Symphony',
      footer_icon: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
      ts: Math.floor(Date.now() / 1000)
    };

    // Add metrics if available and successful
    if (isSuccess && metricsText) {
      attachment.fields.push({
        title: 'Metrics',
        value: metricsText,
        short: false
      });
    }

    // Add error information if failed
    if (!isSuccess && results.error) {
      attachment.fields.push({
        title: 'Error',
        value: `\`\`\`${results.error}\`\`\``,
        short: false
      });
    }

    const payload = {
      channel: channel,
      username: username,
      icon_emoji: icon,
      attachments: [attachment]
    };

    // Send to Slack
    const response = await axios.post(webhookUrl, payload);
    
    if (response.status === 200) {
      console.log('✅ Slack notification sent successfully');
    } else {
      console.error('❌ Failed to send Slack notification:', response.status, response.statusText);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error sending Slack notification:', error.message);
    if (error.response) {
      console.error('Response:', error.response.status, error.response.data);
    }
    process.exit(1);
  }
}

sendSlackNotification().catch(console.error);