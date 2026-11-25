import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getKiloModel, KILO_MODELS, TASK_MODEL_MAP } from '../src/config/kilo-models.js';

test('getKiloModel: default', () => {
  delete process.env.KILO_MODEL;
  delete process.env.KILO_MODEL_DEFAULT;
  assert.equal(getKiloModel('default'), KILO_MODELS.auto);
});

test('getKiloModel: scoring uses auto', () => {
  delete process.env.KILO_MODEL_SCORING;
  assert.equal(getKiloModel('scoring'), KILO_MODELS.auto);
});

test('getKiloModel: proposal uses beam', () => {
  delete process.env.KILO_MODEL_PROPOSAL;
  assert.equal(getKiloModel('proposal'), KILO_MODELS.beam);
});

test('getKiloModel: clientReply uses lfm', () => {
  delete process.env.KILO_MODEL_CLIENTREPLY;
  assert.equal(getKiloModel('clientReply'), KILO_MODELS.lfm);
});

test('getKiloModel: env override task-specific', () => {
  process.env.KILO_MODEL_SCORING = 'custom/model';
  assert.equal(getKiloModel('scoring'), 'custom/model');
  delete process.env.KILO_MODEL_SCORING;
});

test('getKiloModel: env KILO_MODEL global override', () => {
  delete process.env.KILO_MODEL_SCORING;
  process.env.KILO_MODEL = 'global/model';
  assert.equal(getKiloModel('scoring'), 'global/model');
  delete process.env.KILO_MODEL;
});

test('getKiloModel: unknown task falls back to default', () => {
  delete process.env.KILO_MODEL;
  delete process.env.KILO_MODEL_FOOBAR;
  assert.equal(getKiloModel('foobar'), KILO_MODELS.auto);
});

test('TASK_MODEL_MAP has all expected tasks', () => {
  const expected = ['default', 'scoring', 'classify', 'proposal', 'deliveryPlan', 'clientReply', 'review', 'delivery', 'marketing'];
  for (const t of expected) {
    assert.ok(TASK_MODEL_MAP[t], `missing task: ${t}`);
  }
});