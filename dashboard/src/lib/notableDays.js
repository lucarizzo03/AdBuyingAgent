// Hand-picked days worth flagging in the decision log — grounded in the
// v2 agent's actual reasoning text and the simulator's ground truth (which
// the agent itself never sees).
export const NOTABLE_DAYS = {
  1: "opens with an even split — no data yet to act on",
  4: "kills display after zero sales for days straight; funds the cut into search and tiktok",
  13: "estimates search saturation near $260/day — actual hidden value: $250",
  20: "the hidden shock day: meta's conversion rate is secretly halved from here on",
  21: "catches meta's CPA spike and cuts it toward its 30% daily floor",
  25: "tiktok's CPA nearly doubles — the agent suspects its own scaling caused it",
};

export const RIVER_MARKERS = [
  { day: 4, label: "kills display" },
  { day: 21, label: "detects meta crash, cuts spend" },
];
