import { useEffect, useState } from 'react';
import { getJSON } from '../lib/api';
import FoundersManager from '../components/admin/FoundersManager';
import ProjectsManager from '../components/admin/ProjectsManager';
import AnalyticsPanel from '../components/admin/AnalyticsPanel';
import LiveUsersPanel from '../components/admin/LiveUsersPanel';
import AbTestsPanel from '../components/admin/AbTestsPanel';
import TasksPanel from '../components/admin/TasksPanel';
import FinancePanel from '../components/admin/FinancePanel';
import ApprovalsPanel from '../components/admin/ApprovalsPanel';
import LeadsPanel from '../components/admin/LeadsPanel';
import AdminsPanel from '../components/admin/AdminsPanel';
import SessionsPanel from '../components/admin/SessionsPanel';
import BackupsPanel from '../components/admin/BackupsPanel';
import './AdminStudio.css';

const TABS = [
  { key: 'leads', label: 'Leads' },
  { key: 'founders', label: 'Team' },
  { key: 'projects', label: 'Projects' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'live', label: 'Live users' },
  { key: 'abtests', label: 'A/B tests' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'finance', label: 'Finance' },
  { key: 'approvals', label: 'Approvals' },
  { key: 'admins', label: 'Admins' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'backups', label: 'Backups' },
];

const PANELS = {
  leads: LeadsPanel,
  founders: FoundersManager,
  projects: ProjectsManager,
  analytics: AnalyticsPanel,
  live: LiveUsersPanel,
  abtests: AbTestsPanel,
  tasks: TasksPanel,
  finance: FinancePanel,
  approvals: ApprovalsPanel,
  admins: AdminsPanel,
  sessions: SessionsPanel,
  backups: BackupsPanel,
};

export default function AdminStudio() {
  const [session, setSession] = useState({ loading: true, user: null });
  const [tab, setTab] = useState('leads');

  useEffect(() => {
    document.title = 'Studio — Unitary X Admin';
  }, []);

  useEffect(() => {
    getJSON('/api/auth/session')
      .then((data) => {
        if (!data.authenticated || data.user?.role !== 'admin') {
          window.location.href = '/login';
          return;
        }
        setSession({ loading: false, user: data.user });
      })
      .catch(() => {
        window.location.href = '/login';
      });
  }, []);

  if (session.loading) {
    return (
      <div className="studio-shell">
        <p className="studio-loading">Loading studio…</p>
      </div>
    );
  }

  return (
    <div className="studio-shell">
      <header className="studio-header glass">
        <div>
          <p className="studio-eyebrow">Unitary X · Admin studio</p>
          <h1>Content management</h1>
        </div>
        <div className="studio-header-actions">
          <a className="studio-btn" href="/admin">
            Classic panel
          </a>
          <a className="studio-btn" href="/">
            View site
          </a>
        </div>
      </header>

      <nav className="studio-tabs" aria-label="Studio sections">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`studio-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="studio-main">{(() => {
        const Panel = PANELS[tab] || FoundersManager;
        return <Panel />;
      })()}</main>
    </div>
  );
}
