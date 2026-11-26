import schedule from 'node-schedule';
import { runScanCycle, runProposeCycle, runDeliveryCycle, runMessageCycle } from './daemon-cycles.js';
import { notify, setNotifyConfig } from '../notifications/notify.js';
import { log, warn, error as logError } from '../utils/logger.js';
import { loadAutopilotConfig } from './autopilot-config.js';

export async function startDaemon() {
  const autopilotConfig = loadAutopilotConfig();
  setNotifyConfig(autopilotConfig);

  const { healthCheck } = await import('../utils/health.js');
  const health = await healthCheck();
  if (!health.ok) {
    log('[DAEMON] ⚠ Health check failed — some features may not work.');
    await notify('ERROR', { message: 'Health check failed: ' + health.checks.filter(c => !c.ok).map(c => c.name).join(', ') });
  }

  log('========================================');
  log('[DAEMON] HustleBot Autopilot starting...');
  log(`[DAEMON] Autonomy level: ${autopilotConfig.autonomy_level}`);
  log(`[DAEMON] Scan interval: ${autopilotConfig.scan_interval_hours}h`);
  log('========================================');

  await runScanCycle(autopilotConfig);

  const scanCron = `0 */${autopilotConfig.scan_interval_hours || 2} * * *`;

  schedule.scheduleJob('scan', scanCron, () => runScanCycle(autopilotConfig));
  schedule.scheduleJob('propose', '*/30 * * * *', () => runProposeCycle(autopilotConfig));
  schedule.scheduleJob('deliver', '*/15 * * * *', () => runDeliveryCycle(autopilotConfig));
  schedule.scheduleJob('messages', '*/10 * * * *', () => runMessageCycle(autopilotConfig));

  log('[DAEMON] Scheduler started. Jobs:');
  log(`  - Scan: ${scanCron}`);
  log(`  - Propose: every 30 min`);
  log(`  - Deliver: every 15 min`);
  log(`  - Messages: every 10 min`);

  await notify('CYCLE_SUMMARY', { scanned: 0, newGigs: 0, proposed: 0 });

  process.on('SIGINT', () => {
    log('[DAEMON] Shutting down...');
    schedule.gracefulShutdown().then(() => process.exit(0));
  });

  process.on('SIGTERM', () => {
    log('[DAEMON] Terminated.');
    schedule.gracefulShutdown().then(() => process.exit(0));
  });
}

if (process.argv[1]?.endsWith('daemon.js')) {
  startDaemon();
}
