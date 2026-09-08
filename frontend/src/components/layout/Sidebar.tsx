import {
    ClipboardList,
    FileSignature,
    FolderLock,
    Fingerprint,
    LayoutDashboard,
    LockKeyhole,
    UnlockKeyhole,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import SecureVaultMark from "./SecureVaultMark";

const menuItems = [
    {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Encrypt File",
        path: "/encrypt",
        icon: LockKeyhole,
    },
    {
        label: "Decrypt File",
        path: "/decrypt",
        icon: UnlockKeyhole,
    },
    {
        label: "Vault",
        path: "/vault",
        icon: FolderLock,
    },
    {
        label: "Digital Signature",
        path: "/signatures",
        icon: FileSignature,
    },
    {
        label: "Audit Logs",
        path: "/audit-logs",
        icon: ClipboardList,
    },
];

export default function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="brand">
                <div className="brand-symbol">
                    <SecureVaultMark />
                </div>
                <div>
                    <h2>SecureVault</h2>
                    <p>YOUR PRIVATE ARCHIVE</p>
                </div>
            </div>

            <p className="nav-caption">WORKSPACE</p>
            <nav className="nav-menu" aria-label="Primary navigation">
                {menuItems.map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                isActive ? "nav-link active" : "nav-link"
                            }
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>
            <div className="sidebar-note"><Fingerprint size={22} /><strong>Local by design.</strong><p>New file content and metadata are encrypted in your browser. Download a copy before clearing browser data.</p><span>AES-256-GCM / v2</span></div>
        </aside>
    );
}
