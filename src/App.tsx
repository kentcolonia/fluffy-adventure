// POINT DIRECTLY TO THE LINUX SERVER
const API_URL = "http://10.10.0.3:5000/api";

import React, { useState, useEffect } from 'react';
import { Upload, Plus, Trash2, Printer, FileSpreadsheet, Loader2 } from 'lucide-react';

interface Employee {
  fullname: string;
  position: string;
}

interface EmployeeRecord {
  id: number;
  name: string;
  position: string;
  indication: string;
  signature: string | null;
  photo: string | null;
}

export default function App() {
  const [records, setRecords] = useState<EmployeeRecord[]>([]);
  const [employeeDatabase, setEmployeeDatabase] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedName, setSelectedName] = useState('');
  const [position, setPosition] = useState('');
  const [indication, setIndication] = useState('');
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dbRes, recRes] = await Promise.all([
          fetch(`${API_URL}/database`),
          fetch(`${API_URL}/records`)
        ]);
        if (dbRes.ok) setEmployeeDatabase(await dbRes.json());
        if (recRes.ok) setRecords(await recRes.json());
      } catch (err) {
        console.error("Connection to Linux server failed.");
      } finally {
        setIsLoading(false);
      }
    };

    if (!(window as any).XLSX) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.async = true;
      document.body.appendChild(script);
    }

    loadData();
  }, []);

  const saveDatabase = async (data: Employee[]) => {
    try {
      await fetch(`${API_URL}/database`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) { console.error("Failed to sync database to server"); }
  };

  const saveRecords = async (data: EmployeeRecord[]) => {
    try {
      await fetch(`${API_URL}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) { console.error("Failed to sync records to server"); }
  };

  const handleDatabaseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const XLSX = (window as any).XLSX;
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];

          const formatted = jsonData.map((row: any) => {
            const cleanKeys = Object.keys(row).reduce((acc: any, key: string) => {
              acc[key.toLowerCase().replace(/\s+/g, '')] = row[key];
              return acc;
            }, {});
            return {
              fullname: String(cleanKeys["fullname"] || "").trim(),
              position: String(cleanKeys["position"] || "").trim()
            };
          }).filter(emp => emp.fullname);

          setEmployeeDatabase(formatted);
          saveDatabase(formatted);
          e.target.value = '';
        } catch (err) { alert("Error reading Excel"); }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleAddRecord = () => {
    if (!selectedName || !indication) return;
    const newRecord: EmployeeRecord = {
      id: Date.now(),
      name: selectedName,
      position,
      indication,
      signature: signaturePreview,
      photo: photoPreview
    };
    const updated = [...records, newRecord];
    setRecords(updated);
    saveRecords(updated);

    setSelectedName(''); setPosition(''); setIndication('');
    setSignaturePreview(null); setPhotoPreview(null);
  };

  const handleDelete = (id: number) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    saveRecords(updated);
  };

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="font-medium text-gray-500">Connecting to Linux Backend...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Step 1: Load Excel */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 print:hidden">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
            <FileSpreadsheet className="w-6 h-6 text-green-600" /> Step 1: Load Excel Database
          </h2>
          <input type="file" accept=".xlsx, .xls" onChange={handleDatabaseUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 cursor-pointer" />
          {employeeDatabase.length > 0 && (
            <p className="text-xs text-green-700 mt-2 font-bold italic">✓ {employeeDatabase.length} employees stored on server.</p>
          )}
        </div>

        {/* Step 2: Entry Form */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 print:hidden">
          <h2 className="text-xl font-bold text-gray-800 mb-6 underline decoration-blue-500 underline-offset-8">Step 2: Employee Entry Form</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="relative">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Search Name</label>
              <input type="text" value={selectedName}
                onChange={(e) => { setSelectedName(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Search..." />
              {showDropdown && (
                <ul className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-2xl max-h-48 overflow-auto">
                  {employeeDatabase
                    .filter(e => e.fullname.toLowerCase().includes(selectedName.toLowerCase()))
                    .map((emp, i) => (
                      <li key={i}
                        onMouseDown={() => { setSelectedName(emp.fullname); setPosition(emp.position); setShowDropdown(false); }}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 text-sm">
                        <div className="font-bold">{emp.fullname}</div>
                        <div className="text-xs text-gray-400">{emp.position}</div>
                      </li>
                    ))}
                </ul>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Designation</label>
              <input type="text" value={position} readOnly className="w-full p-2.5 bg-gray-50 border rounded-lg text-gray-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Indication</label>
              <select value={indication} onChange={(e) => setIndication(e.target.value)}
                className="w-full p-2.5 border rounded-lg outline-none">
                <option value="">-- Select --</option>
                <option value="Stay-In">Stay-In</option>
                <option value="Stay-Out">Stay-Out</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 relative h-32 flex flex-col items-center justify-center">
              {signaturePreview
                ? <img src={signaturePreview} className="h-full object-contain" alt="sig" />
                : <><Upload className="w-6 h-6 text-gray-300" /><span className="text-xs text-gray-400">Upload Signature</span></>}
              <input type="file" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { const r = new FileReader(); r.onload = () => setSignaturePreview(r.result as string); r.readAsDataURL(f); }
              }} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 relative h-32 flex flex-col items-center justify-center">
              {photoPreview
                ? <img src={photoPreview} className="h-full object-contain" alt="pic" />
                : <><Upload className="w-6 h-6 text-gray-300" /><span className="text-xs text-gray-400">Upload Photo</span></>}
              <input type="file" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { const r = new FileReader(); r.onload = () => setPhotoPreview(r.result as string); r.readAsDataURL(f); }
              }} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>
          <button onClick={handleAddRecord}
            className="bg-blue-600 text-white px-10 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2 transition-all active:scale-95">
            <Plus className="w-5 h-5" /> Add Employee to List
          </button>
        </div>

        {/* Step 3: The Table Output */}
        {records.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <div className="flex justify-between items-center mb-4 print:hidden">
              <h3 className="font-black text-gray-700 uppercase tracking-widest text-sm">Employee Records</h3>
              <button onClick={() => window.print()}
                className="bg-black text-white px-8 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition shadow-md">
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>

            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold w-10">No.</th>
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold">Name</th>
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold">Designation</th>
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold">Signature</th>
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold">Indication</th>
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold">Photo</th>
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold print:hidden w-10"></th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={record.id} className="group">
                    {/* Row Number */}
                    <td className="border border-gray-400 px-3 py-2 text-center text-gray-500 font-medium align-middle">
                      {index + 1}
                    </td>
                    {/* Name */}
                    <td className="border border-gray-400 px-3 py-2 align-middle font-semibold text-gray-800" style={{ height: '80px' }}>
                      {record.name}
                    </td>
                    {/* Designation */}
                    <td className="border border-gray-400 px-3 py-2 align-middle text-gray-700">
                      {record.position}
                    </td>
                    {/* Signature */}
                    <td className="border border-gray-400 px-2 py-1 align-middle" style={{ width: '140px', height: '80px' }}>
                      {record.signature
                        ? <img src={record.signature} alt="signature"
                            style={{ width: '100%', height: '76px', objectFit: 'contain', display: 'block' }} />
                        : <span className="text-gray-300 text-xs block text-center">—</span>}
                    </td>
                    {/* Indication */}
                    <td className="border border-gray-400 px-3 py-2 text-center align-middle text-gray-700">
                      {record.indication}
                    </td>
                    {/* Photo - fitted inside the box */}
                    <td className="border border-gray-400 px-1 py-1 align-middle" style={{ width: '80px', height: '80px' }}>
                      {record.photo
                        ? <img src={record.photo} alt="photo"
                            style={{ width: '100%', height: '78px', objectFit: 'cover', display: 'block' }} />
                        : <span className="text-gray-300 text-xs block text-center">—</span>}
                    </td>
                    {/* Delete Button */}
                    <td className="border border-gray-400 px-2 py-2 text-center align-middle print:hidden">
                      <button onClick={() => handleDelete(record.id)}
                        className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid black !important; }
        }
      `}</style>
    </div>
  );
}