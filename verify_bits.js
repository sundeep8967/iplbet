import { computeSquadStats } from './src/models/statsModel.js';
import { MISC_RESULTS } from './src/models/constants.js';

const mockVotes = [
  { user_name: 'Alice', match_id: 'm1', chosen_team: 'Team A' },
  { user_name: 'Bob',   match_id: 'm1', chosen_team: 'Team B' },
];

const mockResults = [
  { match_id: 'm1', winner_team: MISC_RESULTS.DRAW, settled_at: new Date().toISOString() }
];

const stats = computeSquadStats(mockVotes, mockResults);

console.log('Stats after DRAW:');
console.log(stats);

if (stats['Alice'].earnings === 0 && stats['Bob'].earnings === 0) {
  console.log('✅ TEST PASSED: Draw result does not affect user earnings.');
} else {
  console.log('❌ TEST FAILED: Draw result affected user earnings.');
  process.exit(1);
}
