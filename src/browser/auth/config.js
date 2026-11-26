/**
 * Shared configuration for browser authentication flows.
 */

export const LOGIN_URLS = {
  google: 'https://accounts.google.com/',
  upwork: 'https://www.upwork.com/ab/account-security/login',
  freelancer: 'https://www.freelancer.com/login',
  twitter: 'https://x.com/i/flow/login',
  hackernews: 'https://news.ycombinator.com/login',
  fiverr: 'https://www.fiverr.com/login',
};

export const LOGIN_SUCCESS_CHECKS = {
  google: url =>
    url.includes('myaccount.google.com') ||
    (url.includes('google.com') && !url.includes('accounts.google.com')),
  upwork: url => url.includes('upwork.com') && !url.includes('/login') && !url.includes('account-security'),
  freelancer: url => url.includes('freelancer.com') && !url.includes('/login'),
  twitter: url => url.includes('x.com') && !url.includes('/i/flow/login') && !url.includes('/login'),
  hackernews: url => url.includes('news.ycombinator.com') && !url.includes('/login'),
  fiverr: url => url.includes('fiverr.com') && !url.includes('/login') && !url.includes('/join'),
};

export function normalizePlatform(platform) {
  const normalized = (platform || '').toLowerCase();
  if (normalized === 'x') return 'twitter';
  if (normalized === 'hn') return 'hackernews';
  return normalized;
}

export function getCredentialEnv(platform) {
  const env = {
    google: {
      email: process.env.GOOGLE_EMAIL,
      password: process.env.GOOGLE_PASSWORD,
    },
    upwork: {
      email: process.env.UPWORK_EMAIL,
      password: process.env.UPWORK_PASSWORD,
      securityAnswer: process.env.UPWORK_SECURITY_ANSWER,
    },
    freelancer: {
      email: process.env.FREELANCER_EMAIL,
      password: process.env.FREELANCER_PASSWORD,
    },
    twitter: {
      email: process.env.TWITTER_EMAIL,
      password: process.env.TWITTER_PASSWORD,
    },
    hackernews: {
      email: process.env.HACKERNEWS_USERNAME,
      password: process.env.HACKERNEWS_PASSWORD,
    },
    fiverr: {
      email: process.env.FIVERR_EMAIL,
      password: process.env.FIVERR_PASSWORD,
    },
  };

  return env[platform] || {};
}
