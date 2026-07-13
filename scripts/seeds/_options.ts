// Run-time switches the runner sets from the command line, before any seed
// runs. Lives here (and not in ../seed) so the helpers can read it without
// importing the runner back — that would be a cycle. Ignored by the runner's
// file listing thanks to the leading "_".

export const options = {
  /**
   * false (default) — a course/book that already exists is left untouched, so
   *   `npm run seed all` only creates what is missing. Safe to run any time.
   * true (`--force`) — existing content is replaced with what the seed says.
   *   Use after editing a seed's content. This resets learner progress inside
   *   the affected course, because lesson_block_progress cascades off the
   *   blocks being replaced.
   */
  force: false,
};

/** Tallied by the helpers as they run, printed by the runner at the end. */
export const stats = {
  created: 0,
  skipped: 0,
  replaced: 0,
};
