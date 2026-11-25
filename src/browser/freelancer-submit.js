import { launchBrowser, takeScreenshot } from './playwright-manager.js';
import { ensureLoggedIn } from './auto-login.js';
import { log, error as logError, warn } from '../utils/logger.js';
import { notify } from '../notifications/notify.js';

/**
 * Submit a bid on Freelancer.com using browser automation.
 */
export async function submitFreelancerBid(gig, proposalText, bidAmount, notifyFn = null) {
  let context = null;
  let page = null;

  try {
    log(`[FREELANCER] Submitting bid for: ${gig.title}`);

    const launched = await launchBrowser({ headless: false });
    context = launched.context;
    page = launched.page;

    // Ensure session (persistent or auto-login)
    const auth = await ensureLoggedIn(page, 'freelancer', notifyFn);
    if (!auth.success) {
      warn('[FREELANCER] Not logged in — falling back to clipboard');
      return {
        success: false,
        method: 'needs_login',
        error: auth.error,
      };
    }
    log(`[FREELANCER] Session ready via ${auth.method}`);

    // Navigate to the project page
    const projectUrl = gig.url || `https://www.freelancer.com/projects/${gig.id}`;
    log(`[FREELANCER] Navigating to: ${projectUrl}`);
    await page.goto(projectUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Click "Bid on this Project" / "Place Bid"
    const bidButtonClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const bid = btns.find(b =>
        b.textContent.includes('Place Bid') ||
        b.textContent.includes('Bid on this') ||
        b.textContent.includes('Place a Bid')
      );
      if (bid) { bid.click(); return true; }
      return false;
    });

    await new Promise(r => setTimeout(r, 2000));

    // Fill bid amount
    if (bidAmount) {
      await page.evaluate((amount) => {
        const inputs = document.querySelectorAll('input[type="number"], input[name*="bid"], input[name*="amount"]');
        for (const el of inputs) {
          el.focus();
          el.value = String(amount);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, bidAmount);
    }

    // Fill proposal description
    await page.evaluate((text) => {
      const textareas = document.querySelectorAll('textarea');
      for (const el of textareas) {
        if (el.offsetHeight > 50) {
          el.focus();
          el.value = text;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        }
      }
    }, proposalText);

    const preScreenshot = await takeScreenshot(page, 'freelancer-pre-submit');

    // Click submit
    const submitted = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const submit = btns.find(b =>
        (b.textContent.includes('Place Bid') || b.textContent.includes('Submit')) &&
        !b.disabled
      );
      if (submit) { submit.click(); return true; }
      return false;
    });

    await new Promise(r => setTimeout(r, 3000));

    const pageText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
    const isSuccess = pageText.includes('bid has been placed') ||
                      pageText.includes('successfully') ||
                      pageText.includes('Bid placed');

    const postScreenshot = await takeScreenshot(page, `freelancer-${isSuccess ? 'success' : 'result'}`);

    if (isSuccess) {
      log(`[FREELANCER] Bid submitted for: ${gig.title}`);
      await notify('PROPOSAL_SUBMITTED', {
        gigTitle: gig.title,
        platform: 'freelancer',
        method: 'Browser automation',
      });
    }

    await context.close();
    return { success: isSuccess, method: 'browser', screenshotPath: postScreenshot, error: isSuccess ? null : 'Check screenshot' };

  } catch (err) {
    logError(`[FREELANCER] Submission error: ${err.message}`);
    if (page) { try { await context.close(); } catch {} }
    return { success: false, method: 'browser', error: err.message };
  }
}

export async function setupFreelancerSession() {
  const { context, page } = await launchBrowser({ headless: false });
  const loggedIn = await isLoggedIn(page, 'freelancer');
  if (loggedIn) {
    await context.close();
    return { success: true, message: 'Already logged into Freelancer' };
  }

  const auto = await loginWithCredentials(page, {
    email: process.env.FREELANCER_EMAIL,
    password: process.env.FREELANCER_PASSWORD,
    platform: 'freelancer',
  });

  if (auto.success) {
    await context.close();
    return { success: true, message: 'Freelancer session saved (auto-login)' };
  }

  log(`[FREELANCER] Auto-login failed: ${auto.error}. Falling back to manual.`);
  await waitForLogin(page, 'freelancer');
  await context.close();
  return { success: true, message: 'Freelancer session saved (manual login)' };
}
