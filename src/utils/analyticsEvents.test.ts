import { analyticsEvents } from './analytics';
// The Worker is deployed separately (see worker/README.md) but its event
// allowlist has to mirror this app's event names exactly, so it is imported
// directly rather than duplicated in a fixture.
import { ALLOWED_EVENTS } from '../../worker/src/ingest.js';

/**
 * The site and the analytics Worker keep two copies of the event-name list:
 * `analyticsEvents` here, and `ALLOWED_EVENTS` in the Worker, which rejects
 * anything not on it with a 422 so a forged event can't pollute the dataset.
 *
 * Nothing but convention kept them in sync, and they drifted: `scheduling_open`
 * and `home_experience_slide` were emitted by the site and silently rejected by
 * the Worker for as long as they existed, so no rows were ever recorded for
 * them. This test is what would have caught that the day they were added.
 */
describe('analytics event allowlist', () => {
  it('matches the Worker allowlist exactly', () => {
    const emitted = [...new Set(Object.values(analyticsEvents))].sort();
    const accepted = [...ALLOWED_EVENTS].sort();

    expect(accepted).toEqual(emitted);
  });
});
