import { updateTrack } from '../src/lib/update-track';
import { describe, it, expect } from 'bun:test';
import { build, parse } from '../src/lib/parser';
describe('updateTrack', () => {
  it('should update every ID in the track', () => {
    const track = createTrack();
    const nextPointeeId = 1000;

    const expectedTrack = createExpectedTrack();
    const expectedNextPointeeId = 1004;

    const result = updateTrack(track, nextPointeeId);

    expect(build(result.track)).toEqual(build(expectedTrack));
    expect(result.nextPointeeId).toEqual(expectedNextPointeeId);
  });

  it('should throw an error if no nextPointeeId is provided', () => {
    const track = createTrack();
    const nextPointeeId = undefined;

    expect(() => {
      updateTrack(track, nextPointeeId);
    }).toThrow('No nextPointeeId provided');
  });

  // Helper functions to create test data
  function createTrack() {
    const xml = `
      <Track>
        <Node Id="1001">
          <!-- XML content -->
        </Node>
        <Node Id="1002">
          <!-- XML content -->
        </Node>
        <Node Id="1003">
          <!-- XML content -->
        </Node>
      </Track>
    `;
    return parse(xml);
  }

  function createExpectedTrack() {
    const xml = `
      <Track>
        <Node Id="1001">
          <!-- XML content -->
        </Node>
        <Node Id="1002">
          <!-- XML content -->
        </Node>
        <Node Id="1003">
          <!-- XML content -->
        </Node>
      </Track>
    `;
    return parse(xml);
  }
});