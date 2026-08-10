import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUiStore } from '../state/store';

const NAV_ITEMS: { to: string; label: string }[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/linkedin-data', label: 'LinkedIn Data' },
  { to: '/import', label: 'Import CSV' },
  { to: '/contacts', label: 'Contacts' },
  { to: '/companies', label: 'Companies' },
  { to: '/batch-send', label: 'Batch Review & Send' },
  { to: '/campaigns', label: 'Campaigns' },
  { to: '/messages', label: 'Messages' },
  { to: '/replies', label: 'Replies Inbox' },
  { to: '/pipeline', label: 'Pipeline Kanban' },
  { to: '/proposals', label: 'Proposals Tracker' },
  { to: '/tasks', label: 'Tasks & Follow-ups' },
  { to: '/templates', label: 'Templates' },
  { to: '/reports', label: 'Reports & Analytics' },
  { to: '/scheduler', label: 'Scheduler' },
  { to: '/audit-log', label: 'Audit Log' },
  { to: '/export', label: 'Export & Backup' },
  { to: '/settings', label: 'Settings' },
];

export default function Sidebar(): JSX.Element {
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="brand">Getlux</div>
        <div className="brand-sub">Outreach CRM</div>
      </div>
      <div className="sidebar-links">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === 'light' ? 'Dark mode' : 'Light mode'}
      </button>
    </nav>
  );
}
