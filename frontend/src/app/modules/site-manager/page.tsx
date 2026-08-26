"use client";
import React from 'react';
import { Globe, Server, ExternalLink, Settings } from 'lucide-react';

export default function SiteManager() {
  const sites = [
    { 
      name: "3zeronetwork.com", type: "PHP / Custom", status: "Active",
      manageUrl: "http://localhost/samai/super_app_projects/3z/admin/index.php",
      siteUrl: "http://localhost/samai/super_app_projects/3zeronetwork.com/index.php"
    },
    { 
      name: "AusLanka", type: "HTML / PHP", status: "Active",
      manageUrl: "http://localhost/samai/super_app_projects/auslanka/admin/dashboard.php",
      siteUrl: "http://localhost/samai/super_app_projects/auslanka/index.php"
    },
    { 
      name: "Kannagi Kalalayam", type: "WordPress", status: "Active",
      manageUrl: "http://localhost/samai/super_app_projects/kannagi/wp-admin/index.php",
      siteUrl: "http://localhost/samai/super_app_projects/kannagi/index.php"
    }
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', color: 'var(--text-main)', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Globe size={36} color="#f59e0b" />
        Websites & CMS Manager
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.1rem' }}>
        Manage your deployed PHP, HTML, and WordPress projects directly from SAM AI.
      </p>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {sites.map((site, index) => (
          <div key={index} style={{ 
            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', 
            borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', color: '#f59e0b' }}>
                <Server size={24} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem' }}>{site.name}</h3>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{site.type}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ padding: '4px 12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                {site.status}
              </span>
              <button 
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid var(--border)' }}
                onClick={() => window.open(site.manageUrl, '_blank')}
              >
                <Settings size={16} /> Manage
              </button>
              <button 
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={() => window.open(site.siteUrl, '_blank')}
              >
                <ExternalLink size={16} /> Open Site
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
