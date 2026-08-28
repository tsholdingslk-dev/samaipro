"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  FlaskConical, Users, FileText, Activity, Shield, Plus,
  Search, CheckCircle2, AlertCircle, ArrowLeft, Download,
  Calendar, Phone, Mail, Clock, DollarSign, Database
} from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  test: string;
  date: string;
  status: 'Completed' | 'Processing' | 'Sample Collected';
  resultValue: string;
  normalRange: string;
}

const SAMPLE_PATIENTS: Patient[] = [
  { id: "LAB-1001", name: "Kamal Perera", age: 42, gender: "Male", phone: "+94 77 123 4567", test: "Complete Blood Count (CBC)", date: "2026-08-28", status: "Completed", resultValue: "Hemoglobin: 14.5 g/dL", normalRange: "13.5 - 17.5 g/dL" },
  { id: "LAB-1002", name: "Ananya Sharma", age: 29, gender: "Female", phone: "+94 71 987 6543", test: "Lipid Profile & Cholesterol", date: "2026-08-28", status: "Processing", resultValue: "Total Cholesterol: 185 mg/dL", normalRange: "< 200 mg/dL" },
  { id: "LAB-1003", name: "Suresh Kumar", age: 55, gender: "Male", phone: "+94 76 555 8899", test: "HbA1c Diabetes Screening", date: "2026-08-27", status: "Completed", resultValue: "HbA1c: 5.6%", normalRange: "< 5.7% Normal" },
  { id: "LAB-1004", name: "Fathima Rizwan", age: 34, gender: "Female", phone: "+94 75 333 2211", test: "Thyroid Profile (TSH, T3, T4)", date: "2026-08-27", status: "Sample Collected", resultValue: "Pending Analysis", normalRange: "0.4 - 4.0 mIU/L" },
];

export default function LabNovaPortal() {
  const [patients, setPatients] = useState<Patient[]>(SAMPLE_PATIENTS);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Patient Form
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newGender, setNewGender] = useState('Male');
  const [newPhone, setNewPhone] = useState('');
  const [newTest, setNewTest] = useState('Complete Blood Count (CBC)');

  const handleAddPatient = () => {
    if (!newName.trim()) return;
    const newEntry: Patient = {
      id: `LAB-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newName,
      age: parseInt(newAge) || 30,
      gender: newGender,
      phone: newPhone || "+94 77 000 0000",
      test: newTest,
      date: new Date().toISOString().split('T')[0],
      status: 'Sample Collected',
      resultValue: 'Pending Analysis',
      normalRange: 'Standard'
    };
    setPatients([newEntry, ...patients]);
    setShowAddModal(false);
    setNewName('');
    setNewAge('');
    setNewPhone('');
  };

  const filtered = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.test.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, #090a12, #0d121c)", color: "#f3f4f6", padding: "2.5rem 2rem", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <Link href="/modules" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#9ca3af", textDecoration: "none", fontSize: "0.85rem", marginBottom: "0.6rem", padding: "4px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.05)" }}>
              <ArrowLeft size={14} /> Back to Modules
            </Link>
            <h1 style={{ fontSize: "2.4rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.8rem", background: "linear-gradient(135deg, #10b981, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              <FlaskConical size={36} color="#10b981" />
              LabNova Diagnostic Portal
            </h1>
            <p style={{ color: "#9ca3af", fontSize: "1rem", marginTop: "0.4rem" }}>
              Enterprise Pathology CRM, Patient Diagnostics Registry & Automated Lab Report Engine.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setShowAddModal(true)}
              style={{ display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "10px", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 15px rgba(16,185,129,0.3)" }}
            >
              <Plus size={16} /> New Patient Specimen
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Total Samples Today", value: "48 Tests", color: "#10b981", icon: FlaskConical },
            { label: "Completed Reports", value: "39 Ready", color: "#06b6d4", icon: CheckCircle2 },
            { label: "Pending Processing", value: "9 In Queue", color: "#f59e0b", icon: Activity },
            { label: "Diagnostic Accuracy", value: "99.98%", color: "#8b5cf6", icon: Shield },
          ].map((s, idx) => (
            <div key={idx} style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1.2rem", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `rgba(255,255,255,0.05)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <s.icon size={22} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: "0.78rem", color: "#9ca3af", textTransform: "uppercase" }}>{s.label}</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: s.color, marginTop: "2px" }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{ display: "flex", alignItems: "center", background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "10px 16px", marginBottom: "1.5rem" }}>
          <Search size={18} color="#9ca3af" style={{ marginRight: "10px" }} />
          <input 
            type="text" 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patient by name, Lab ID (e.g. LAB-1001), or test type..."
            style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "0.95rem" }}
          />
        </div>

        {/* Patient Registry Table */}
        <div style={{ background: "rgba(25, 25, 38, 0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", overflow: "hidden", backdropFilter: "blur(12px)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <th style={{ padding: "14px 20px", fontSize: "0.82rem", color: "#9ca3af", textTransform: "uppercase" }}>Lab ID</th>
                <th style={{ padding: "14px 20px", fontSize: "0.82rem", color: "#9ca3af", textTransform: "uppercase" }}>Patient Name</th>
                <th style={{ padding: "14px 20px", fontSize: "0.82rem", color: "#9ca3af", textTransform: "uppercase" }}>Test / Panel</th>
                <th style={{ padding: "14px 20px", fontSize: "0.82rem", color: "#9ca3af", textTransform: "uppercase" }}>Date</th>
                <th style={{ padding: "14px 20px", fontSize: "0.82rem", color: "#9ca3af", textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "14px 20px", fontSize: "0.82rem", color: "#9ca3af", textTransform: "uppercase" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "16px 20px", fontFamily: "monospace", color: "#10b981", fontWeight: 700 }}>{p.id}</td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ fontWeight: 600, color: "#fff" }}>{p.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "#9ca3af" }}>{p.age} yrs · {p.gender} · {p.phone}</div>
                  </td>
                  <td style={{ padding: "16px 20px", color: "#d1d5db" }}>{p.test}</td>
                  <td style={{ padding: "16px 20px", color: "#9ca3af", fontSize: "0.85rem" }}>{p.date}</td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600,
                      background: p.status === 'Completed' ? "rgba(16,185,129,0.15)" : p.status === 'Processing' ? "rgba(245,158,11,0.15)" : "rgba(99,102,241,0.15)",
                      color: p.status === 'Completed' ? "#10b981" : p.status === 'Processing' ? "#f59e0b" : "#818cf8",
                      border: `1px solid ${p.status === 'Completed' ? "rgba(16,185,129,0.3)" : p.status === 'Processing' ? "rgba(245,158,11,0.3)" : "rgba(99,102,241,0.3)"}`
                    }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <button
                      onClick={() => setSelectedPatient(p)}
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer" }}
                    >
                      View Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* View Diagnostic Report Modal */}
        {selectedPatient && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 100 }}>
            <div style={{ background: "#0e111a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "20px", maxWidth: "600px", width: "100%", padding: "2rem", color: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700 }}>Diagnostic Lab Report</h3>
                  <span style={{ fontSize: "0.8rem", color: "#10b981", fontFamily: "monospace" }}>{selectedPatient.id}</span>
                </div>
                <button onClick={() => setSelectedPatient(null)} style={{ background: "transparent", border: "none", color: "#9ca3af", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem", background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "10px" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Patient Name:</div>
                  <div style={{ fontWeight: 600 }}>{selectedPatient.name} ({selectedPatient.gender}, {selectedPatient.age}y)</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Contact:</div>
                  <div style={{ fontWeight: 600 }}>{selectedPatient.phone}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Test Conducted:</div>
                  <div style={{ fontWeight: 600, color: "#10b981" }}>{selectedPatient.test}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Collection Date:</div>
                  <div style={{ fontWeight: 600 }}>{selectedPatient.date}</div>
                </div>
              </div>

              <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "12px", padding: "1.2rem", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.85rem", color: "#9ca3af", marginBottom: "0.4rem" }}>Lab Finding / Observed Value:</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>{selectedPatient.resultValue}</div>
                <div style={{ fontSize: "0.78rem", color: "#10b981", marginTop: "0.3rem" }}>Reference Interval: {selectedPatient.normalRange}</div>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button 
                  onClick={() => alert(`Report for ${selectedPatient.name} downloaded as PDF!`)}
                  style={{ background: "#10b981", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Download size={16} /> Download Verified PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Patient Modal */}
        {showAddModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 100 }}>
            <div style={{ background: "#0e111a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "20px", maxWidth: "500px", width: "100%", padding: "2rem", color: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>Register New Specimen</h3>
                <button onClick={() => setShowAddModal(false)} style={{ background: "transparent", border: "none", color: "#9ca3af", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Patient Full Name</label>
                  <input 
                    type="text" 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                    placeholder="e.g. Johnathan Silva"
                    style={{ width: "100%", background: "#05060a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.7rem", color: "#fff", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Age</label>
                    <input 
                      type="number" 
                      value={newAge} 
                      onChange={e => setNewAge(e.target.value)} 
                      placeholder="e.g. 35"
                      style={{ width: "100%", background: "#05060a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.7rem", color: "#fff", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Gender</label>
                    <select 
                      value={newGender} 
                      onChange={e => setNewGender(e.target.value)}
                      style={{ width: "100%", background: "#05060a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.7rem", color: "#fff", outline: "none", boxSizing: "border-box" }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "#9ca3af", display: "block", marginBottom: "0.3rem" }}>Diagnostic Test Panel</label>
                  <select 
                    value={newTest} 
                    onChange={e => setNewTest(e.target.value)}
                    style={{ width: "100%", background: "#05060a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "0.7rem", color: "#fff", outline: "none", boxSizing: "border-box" }}
                  >
                    <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                    <option value="Lipid Profile & Cholesterol">Lipid Profile & Cholesterol</option>
                    <option value="HbA1c Diabetes Screening">HbA1c Diabetes Screening</option>
                    <option value="Thyroid Profile (TSH, T3, T4)">Thyroid Profile (TSH, T3, T4)</option>
                    <option value="Liver Function Test (LFT)">Liver Function Test (LFT)</option>
                    <option value="Renal / Kidney Panel (KFT)">Renal / Kidney Panel (KFT)</option>
                  </select>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                  <button 
                    onClick={handleAddPatient}
                    style={{ flex: 1, background: "#10b981", color: "#fff", border: "none", padding: "10px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Save & Generate Lab ID
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
