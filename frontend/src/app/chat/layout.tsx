"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

type Project = {
  id: string;
  title: string;
};

const DEFAULT_PROJECTS: Project[] = [
  { id: "default", title: "General Workspace" },
  { id: "main", title: "Main Project" },
];

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [loading, setLoading] = useState(false);

  const getCurrentProjectId = () => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const p = urlParams.get("project") || urlParams.get("id");
      if (p) return p;
    }
    const match = pathname?.match(/\/chat\/([^/]+)/);
    return match ? match[1] : "default";
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    router.push("/login");
  };

  const createNewProject = () => {
    const title = prompt("Enter a title for your new chat:");
    if (!title?.trim()) return;
    const id = title.trim().toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    const newProject = { id, title: title.trim() };
    setProjects(prev => [newProject, ...prev]);
    router.push(`/chat?project=${id}`);
  };

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Delete this chat?")) return;
    setProjects(prev => prev.filter(p => p.id !== id));
    if (pathname?.includes(id)) router.push("/chat");
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currentProjectId = getCurrentProjectId();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="dashboard-container">
      {/* Mobile Header (Hidden on Desktop) */}
      <div className="mobile-menu-btn" style={{ padding: "1rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-sidebar)" }}>
        <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Sam AI</h2>
        <button onClick={toggleMobileMenu} style={{ background: "transparent", border: "none", color: "var(--text-main)", fontSize: "1.5rem", cursor: "pointer" }}>
          ☰
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        <button
          onClick={createNewProject}
          className="btn-primary"
          style={{ width: "100%", marginBottom: "2rem" }}
        >
          + New Chat
        </button>

        <div style={{ flex: 1, overflowY: "auto" }}>
          <h3 style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "1px" }}>
            Your Projects
          </h3>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton" style={{ height: "40px", borderRadius: "8px" }} />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No chats yet.</p>
          ) : (
            projects.map(p => (
              <Link href={`/chat?project=${p.id}`} key={p.id} onClick={() => setIsMobileMenuOpen(false)}>
                <div className={`project-item ${currentProjectId === p.id ? "active" : ""}`}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {p.title}
                  </span>
                  <span
                    onClick={e => deleteProject(p.id, e)}
                    style={{ fontSize: "1.2rem", color: "var(--text-muted)", padding: "0 0.2rem", cursor: "pointer" }}
                    title="Delete"
                  >
                    ×
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Link
            href="/modules"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", width: "100%", textAlign: "left", padding: "0.5rem", fontSize: "1rem" }}
          >
            Modules
          </Link>
          <Link
            href="/profile"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", width: "100%", textAlign: "left", padding: "0.5rem", fontSize: "1rem" }}
          >
            Profile
          </Link>
          <button
            onClick={logout}
            style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", width: "100%", textAlign: "left", padding: "0.5rem", fontSize: "1rem" }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-main">
        {children}
      </main>
    </div>
  );
}
