// import { describe, it, expect } from 'bun:test';
// import { Diff3 } from '../src/lib/diff';
// import type { Diff, DiffRules } from '../src/lib/diff-rules';

// describe('Diff3.diff', () => {
//     it('should return an array of diffs when given valid inputs', () => {
//         const ours = document.createElement('div');
//         const theirs = document.createElement('div');
//         const base = document.createElement('div');
//         const rules: DiffRules = {
//             special: [],
//             _default: {
//                 target: 'all',
//                 rule: 'none',
//                 display: (diff: Diff) => {
//                     return `Diff on ${diff.x_path}`;
//                 }
//             },
//         };

//         const diffs = Diff3.diff({ ours, theirs, base, rules });

//         expect(Array.isArray(diffs)).toBe(true);
//         expect(diffs.length).toBeGreaterThan(0);
//     });
// });