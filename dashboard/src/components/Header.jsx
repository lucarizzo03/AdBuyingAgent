import { REPO_URL } from "../lib/constants";

export default function Header() {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        paddingBottom: 20,
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div>
        <h1
          style={{
            fontSize: 16,
            fontWeight: 600,
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Ad-Buying Agent
        </h1>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 12.5,
            color: "var(--ink-muted)",
            maxWidth: 560,
          }}
        >
          An LLM agent managing $500/day across 4 simulated channels for 45 days —
          vs a static baseline.
        </p>
      </div>
      <a
        href={REPO_URL}
        target="_blank"
        rel="noreferrer"
        style={{
          fontSize: 12.5,
          color: "var(--ink-muted)",
          whiteSpace: "nowrap",
          paddingTop: 2,
        }}
      >
        GitHub ↗
      </a>
    </header>
  );
}
