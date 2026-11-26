/**
 * Backward-compatible authentication facade.
 *
 * The implementation lives in ./auth:
 * - credentials.js: email/password auto-login
 * - google.js: Google OAuth session setup
 * - config.js: platform URLs and credential mapping
 */
export { ensureLoggedIn, loginWithCredentials } from './auth/credentials.js';
export { loginWithGoogle, setupGoogleSession } from './auth/google.js';
