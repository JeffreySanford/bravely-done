/**
 * @jest-environment node
 *
 * Runs in Node's environment (no `document` global at all) specifically to
 * exercise isWebglAvailable's SSR/no-DOM guard clause, isolated from the
 * jsdom-based tests in webgl-support.spec.ts.
 */
import { isWebglAvailable } from './webgl-support';

describe('isWebglAvailable (no document)', () => {
  it('returns false when document does not exist', () => {
    expect(isWebglAvailable()).toBe(false);
  });
});
