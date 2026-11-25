import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { filterNewGigs, loadSeen, saveSeen } from '../src/automation/dedup.js';

const SEEN_PATH = join(homedir(), '.hustlebot', 'seen-gigs.json');
let backup = null;

function setup() {
  if (existsSync(SEEN_PATH)) backup = readFileSync(SEEN_PATH, 'utf-8');
  writeFileSync(SEEN_PATH, '{}');
}

function teardown() {
  if (backup !== null) writeFileSync(SEEN_PATH, backup);
  else if (existsSync(SEEN_PATH)) unlinkSync(SEEN_PATH);
}

test('dedup: first gig is new', () => {
  setup();
  try {
    const gigs = [{ platform: 'upwork', title: 'Test Gig', description: 'desc' }];
    const newGigs = filterNewGigs(gigs);
    assert.equal(newGigs.length, 1);
  } finally {
    teardown();
  }
});

test('dedup: duplicate gig is filtered', () => {
  setup();
  try {
    const gigs = [{ platform: 'upwork', title: 'Test Gig', description: 'desc' }];
    filterNewGigs(gigs);
    const newGigs = filterNewGigs(gigs);
    assert.equal(newGigs.length, 0);
  } finally {
    teardown();
  }
});

test('dedup: different title is new', () => {
  setup();
  try {
    filterNewGigs([{ platform: 'upwork', title: 'Gig A', description: 'desc' }]);
    const newGigs = filterNewGigs([{ platform: 'upwork', title: 'Gig B', description: 'desc' }]);
    assert.equal(newGigs.length, 1);
  } finally {
    teardown();
  }
});

test('dedup: different platform is new', () => {
  setup();
  try {
    filterNewGigs([{ platform: 'upwork', title: 'Same Title', description: 'desc' }]);
    const newGigs = filterNewGigs([{ platform: 'twitter', title: 'Same Title', description: 'desc' }]);
    assert.equal(newGigs.length, 1);
  } finally {
    teardown();
  }
});

test('dedup: empty list returns empty', () => {
  setup();
  try {
    assert.deepEqual(filterNewGigs([]), []);
  } finally {
    teardown();
  }
});