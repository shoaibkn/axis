import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "generate recurring task instances",
  { minutes: 15 },
  internal.tasks.generateRecurringTaskInstances,
  {},
);

export default crons;
