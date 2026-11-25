import { log, warn } from '../utils/logger.js';

/**
 * Submit a proposal to a platform.
 * V2: Uses Puppeteer browser automation for Upwork/Freelancer.
 * Falls back to clipboard + URL for other platforms.
 */
export async function submitProposal(gigEntry, notifyFn = null) {
  const { gig, proposal } = gigEntry;
  const platform = gig.platform;

  log(`[SUBMIT] Submitting proposal to ${platform}: ${gig.title?.substring(0, 50)}`);

  const result = { success: false, method: 'none' };

  try {
    switch (platform) {
      case 'upwork': {
        try {
          const { submitUpworkProposal } = await import('../browser/upwork-submit.js');
          const browserResult = await submitUpworkProposal(gig, proposal, gigEntry.suggested_rate, notifyFn);
          if (browserResult.success) {
            result.success = true;
            result.method = 'Browser automation - proposal submitted directly';
            result.screenshotPath = browserResult.screenshotPath;
            break;
          } else if (browserResult.method === 'needs_login') {
            warn('[SUBMIT] Upwork: not logged in - falling back to clipboard (alert already sent)');
          } else {
            warn(`[SUBMIT] Upwork browser submit failed: ${browserResult.error || 'unknown'}`);
          }
        } catch (err) {
          warn(`[SUBMIT] Upwork browser error: ${err.message}`);
        }
        await copyToClipboard(proposal);
        if (gig.url) await openUrl(gig.url);
        result.success = true;
        result.method = 'Proposal copied to clipboard, job URL opened';
        break;
      }

      case 'freelancer': {
        try {
          const { submitFreelancerBid } = await import('../browser/freelancer-submit.js');
          const browserResult = await submitFreelancerBid(gig, proposal, gigEntry.suggested_rate, notifyFn);
          if (browserResult.success) {
            result.success = true;
            result.method = 'Browser automation - bid submitted directly';
            result.screenshotPath = browserResult.screenshotPath;
            break;
          }
          if (browserResult.method === 'needs_login') {
            warn('[SUBMIT] Freelancer: not logged in - falling back to clipboard (alert already sent)');
          }
        } catch (err) {
          warn(`[SUBMIT] Freelancer browser error: ${err.message}`);
        }
        await copyToClipboard(proposal);
        if (gig.url) await openUrl(gig.url);
        result.success = true;
        result.method = 'Bid copied to clipboard, project URL opened';
        break;
      }

      case 'twitter': {
        try {
          const { submitTwitterProposal } = await import('../browser/twitter-submit.js');
          const browserResult = await submitTwitterProposal(gig, proposal, notifyFn);
          if (browserResult.success) {
            result.success = true;
            result.method = browserResult.method;
            break;
          }
          warn(`[SUBMIT] Twitter browser submit failed: ${browserResult.error || 'unknown'} — falling back to clipboard`);
        } catch (err) {
          warn(`[SUBMIT] Twitter browser error: ${err.message}`);
        }
        const dmMessage = `Hi! ${proposal.substring(0, 280)}`;
        await copyToClipboard(dmMessage);
        if (gig.url) await openUrl(gig.url);
        result.success = true;
        result.method = 'DM message copied to clipboard, profile URL opened';
        break;
      }

      case 'hackernews': {
        try {
          const { submitHackerNewsProposal } = await import('../browser/hn-submit.js');
          const browserResult = await submitHackerNewsProposal(gig, proposal, notifyFn);
          if (browserResult.success) {
            result.success = true;
            result.method = browserResult.method;
            break;
          }
          warn(`[SUBMIT] HN browser submit failed: ${browserResult.error || 'unknown'} — falling back to clipboard`);
        } catch (err) {
          warn(`[SUBMIT] HN browser error: ${err.message}`);
        }
        const hnReply = proposal.substring(0, 500);
        await copyToClipboard(hnReply);
        if (gig.url) await openUrl(gig.url);
        result.success = true;
        result.method = 'Reply copied to clipboard, thread URL opened';
        break;
      }

      case 'fiverr': {
        try {
          const { submitFiverrProposal } = await import('../browser/fiverr-submit.js');
          const browserResult = await submitFiverrProposal(gig, proposal, notifyFn);
          if (browserResult.success) {
            result.success = true;
            result.method = browserResult.method;
            break;
          }
          warn(`[SUBMIT] Fiverr browser submit failed: ${browserResult.error || 'unknown'} — falling back to clipboard`);
        } catch (err) {
          warn(`[SUBMIT] Fiverr browser error: ${err.message}`);
        }
        await copyToClipboard(proposal);
        if (gig.url) await openUrl(gig.url);
        result.success = true;
        result.method = 'Proposal copied to clipboard, URL opened';
        break;
      }

      case 'django': {
        await copyToClipboard(proposal);
        if (gig.url) await openUrl(gig.url);
        result.success = true;
        result.method = 'Proposal copied to clipboard, job URL opened (apply on posting site)';
        break;
      }

      default: {
        await copyToClipboard(proposal);
        if (gig.url) await openUrl(gig.url);
        result.success = true;
        result.method = 'Proposal copied to clipboard, URL opened';
      }
    }
  } catch (err) {
    warn(`[SUBMIT] Error during submission: ${err.message}`);
    result.error = err.message;
  }

  return result;
}

async function copyToClipboard(text) {
  const { execSync } = await import('child_process');
  try {
    if (process.platform === 'darwin') {
      execSync('pbcopy', { input: text });
    } else if (process.platform === 'linux') {
      execSync('xclip -selection clipboard', { input: text });
    } else if (process.platform === 'win32') {
      execSync('powershell.exe -command "Set-Clipboard -Value $input"', { input: text });
    }
  } catch {
    warn('[SUBMIT] Clipboard copy failed (expected in daemon mode)');
  }
}

async function openUrl(url) {
  try {
    const open = (await import('open')).default;
    await open(url);
  } catch {
    warn('[SUBMIT] Could not open URL (expected in daemon mode)');
  }
}
