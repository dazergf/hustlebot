import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import {
  States, loadPipeline, savePipeline, addGigToPipeline,
  advanceGig, getGigsByState, getPipelineStats, getTodayProposalCount,
} from '../src/automation/pipeline.js';

const PIPELINE_PATH = join(homedir(), '.hustlebot', 'pipeline.json');
let backup = null;

function setup() {
  if (existsSync(PIPELINE_PATH)) {
    backup = readFileSync(PIPELINE_PATH, 'utf-8');
  }
  writeFileSync(PIPELINE_PATH, '[]');
}

function teardown() {
  if (backup !== null) {
    writeFileSync(PIPELINE_PATH, backup);
  } else if (existsSync(PIPELINE_PATH)) {
    unlinkSync(PIPELINE_PATH);
  }
}

test('pipeline: addGigToPipeline creates entry', () => {
  setup();
  try {
    const gig = { id: 'g1', title: 'Test gig', platform: 'upwork' };
    const entry = addGigToPipeline(gig);
    assert.equal(entry.id, 'g1');
    assert.equal(entry.state, States.DISCOVERED);
    assert.ok(entry.transitions.length >= 1);
  } finally {
    teardown();
  }
});

test('pipeline: addGigToPipeline dedupes', () => {
  setup();
  try {
    const gig = { id: 'g2', title: 'Test gig 2' };
    const e1 = addGigToPipeline(gig);
    const e2 = addGigToPipeline(gig);
    assert.equal(e1.id, e2.id);
    assert.equal(loadPipeline().length, 1);
  } finally {
    teardown();
  }
});

test('pipeline: advanceGig changes state', () => {
  setup();
  try {
    const gig = { id: 'g3', title: 'Test gig 3' };
    addGigToPipeline(gig);
    const updated = advanceGig('g3', States.SCORED, { score: 85 });
    assert.equal(updated.state, States.SCORED);
    assert.equal(updated.score, 85);
    assert.ok(updated.transitions.some(t => t.to === States.SCORED));
  } finally {
    teardown();
  }
});

test('pipeline: advanceGig returns null for missing', () => {
  setup();
  try {
    assert.equal(advanceGig('nonexistent', States.SCORED), null);
  } finally {
    teardown();
  }
});

test('pipeline: getGigsByState filters', () => {
  setup();
  try {
    addGigToPipeline({ id: 'g4', title: 'g4' });
    addGigToPipeline({ id: 'g5', title: 'g5' });
    advanceGig('g5', States.SCORED);
    const scored = getGigsByState(States.SCORED);
    assert.equal(scored.length, 1);
    assert.equal(scored[0].id, 'g5');
  } finally {
    teardown();
  }
});

test('pipeline: getPipelineStats counts', () => {
  setup();
  try {
    addGigToPipeline({ id: 'g6', title: 'g6' });
    advanceGig('g6', States.SCORED);
    const stats = getPipelineStats();
    assert.equal(stats.SCORED, 1);
    assert.equal(stats.DISCOVERED, 0);
  } finally {
    teardown();
  }
});

test('pipeline: getTodayProposalCount', () => {
  setup();
  try {
    addGigToPipeline({ id: 'g7', title: 'g7' });
    advanceGig('g7', States.SUBMITTED);
    const count = getTodayProposalCount();
    assert.ok(count >= 1);
  } finally {
    teardown();
  }
});