import { useEffect, useState } from "react";
import { loadLogs } from "./lib/stats";
import Header from "./components/Header";
import Scoreboard from "./components/Scoreboard";
import HeroChart from "./components/HeroChart";
import CpaChart from "./components/CpaChart";
import AllocationRiver from "./components/AllocationRiver";
import ChannelMultiples from "./components/ChannelMultiples";
import DecisionLog from "./components/DecisionLog";
import Findings from "./components/Findings";

export default function App() {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadLogs()
      .then((data) => {
        if (!cancelled) setLogs(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="page">
        <p style={{ color: "var(--ink-muted)", fontSize: 13 }}>
          Couldn't load campaign logs: {error}
        </p>
      </div>
    );
  }

  // No spinner — the logs are small same-origin files; render nothing until
  // they land rather than flash a loading state.
  if (!logs) return null;

  return (
    <div className="page">
      <Header />
      <Scoreboard baseline={logs.baseline} v1={logs.v1} v2={logs.v2} />
      <HeroChart logs={logs} />
      <CpaChart logs={logs} />
      <AllocationRiver logs={logs} />
      <ChannelMultiples log={logs.v2} />
      <DecisionLog log={logs.v2} />
      <Findings logs={logs} />
    </div>
  );
}
