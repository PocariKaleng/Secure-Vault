import { useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Button from "../ui/Button";
import Sidebar from "./Sidebar";

export default function AppLayout() {
    const [motionPaused, setMotionPaused] = useState(false);
    const { pathname } = useLocation();

    function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
        if (motionPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        event.currentTarget.style.setProperty("--pointer-x", `${event.clientX}px`);
        event.currentTarget.style.setProperty("--pointer-y", `${event.clientY}px`);
    }

    function handleSkipNavigation(event: ReactMouseEvent<HTMLAnchorElement>) {
        event.preventDefault();
        document.getElementById("workspace")?.focus();
    }

    return (
        <div
            className={`app-shell${motionPaused ? " motion-paused" : ""}`}
            onPointerMove={handlePointerMove}
        >
            <div className="cyber-ambient" aria-hidden="true">
                <span className="ambient-grid" />
                <span className="ambient-pointer" />
                <span className="ambient-scan" />
                <span className="ambient-orb ambient-orb-cyan" />
                <span className="ambient-orb ambient-orb-pink" />
            </div>
            <a className="skip-link" href="#workspace" onClick={handleSkipNavigation}>Skip navigation</a>
            <Sidebar />

            <main className="main-content" id="workspace" tabIndex={-1}>
                <div className="topbar">
                    <div>
                        <p className="eyebrow">PERSONAL / WORKSPACE</p>
                        <h1>Your files. Your control.</h1>
                    </div>

                    <div className="topbar-controls">
                        <div className="status-pill">Local demo · no account</div>
                        <Button variant="secondary" aria-pressed={motionPaused} onClick={() => setMotionPaused(value => !value)}>{motionPaused ? "Resume animations" : "Pause animations"}</Button>
                    </div>
                </div>

                <div className="system-rail" aria-hidden="true">
                    <span>SV://LOCAL{pathname.toUpperCase()}</span>
                    <span>AES-256-GCM · CHANNEL READY</span>
                </div>
                <div key={pathname} className="route-view"><Outlet /></div>
                <footer className="workspace-footer"><span>SecureVault / Personal file archive</span><span>No account. No server uploads.</span></footer>
            </main>
        </div>
    );
}
