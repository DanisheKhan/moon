import { useState } from 'react';
import { Input, Select } from '@/shared/ui';
import {
  Printer,
  Shield,
  Check,
  Building,
  Save,
} from 'lucide-react';

export function ConsoleSettingsPage() {
  const [stationName, setStationName] = useState('Star Enterprises - Store Console');
  const [primaryPhone, setPrimaryPhone] = useState('+91 98200 12345');
  const [defaultPrintMode, setDefaultPrintMode] = useState('thermal');
  const [autoEmailInvoice, setAutoEmailInvoice] = useState(true);
  const [gstMode, setGstMode] = useState('intra');
  const [isSaved, setIsSaved] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2500);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-1">
            SYSTEM CONFIGURATION
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Console Settings
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Manage station profile, GST tax defaults, receipt printing format, and console security.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 bg-text text-bg hover:opacity-90 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg transition-all cursor-pointer shrink-0 shadow-xs"
        >
          {isSaved ? (
            <>
              <Check size={16} />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Save Configuration</span>
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Store Details */}
        <div className="p-5 rounded-2xl border border-border bg-surface space-y-4 shadow-2xs">
          <div className="flex items-center gap-2.5 border-b border-border pb-3">
            <div className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center text-text">
              <Building size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text">Station & Operations Profile</h2>
              <p className="text-xs text-muted">Primary name appearing on headers and customer invoices.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="set-station-name"
              label="Console Display Title"
              value={stationName}
              onChange={(e) => setStationName(e.target.value)}
              required
            />
            <Input
              id="set-primary-phone"
              label="Primary WhatsApp / Helpline Phone"
              value={primaryPhone}
              onChange={(e) => setPrimaryPhone(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Invoicing and Printing Settings */}
        <div className="p-5 rounded-2xl border border-border bg-surface space-y-4 shadow-2xs">
          <div className="flex items-center gap-2.5 border-b border-border pb-3">
            <div className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center text-text">
              <Printer size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text">Tax Invoice & Printing Configuration</h2>
              <p className="text-xs text-muted">Receipt dimensions, layout rules, and paper output.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="set-print-mode"
              label="Default Output Format"
              value={defaultPrintMode}
              onChange={(e) => setDefaultPrintMode(e.target.value)}
              options={[
                { value: 'thermal', label: '80mm Thermal Receipt (POS Counter)' },
                { value: 'a4', label: 'A4 Full Tax Invoice (Standard Laser)' },
              ]}
            />
            <Select
              id="set-gst-mode"
              label="Default GST Tax Application"
              value={gstMode}
              onChange={(e) => setGstMode(e.target.value)}
              options={[
                { value: 'intra', label: 'Intra-State (CGST 50% + SGST 50%)' },
                { value: 'inter', label: 'Inter-State (Integrated IGST 100%)' },
              ]}
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoEmailInvoice}
                onChange={(e) => setAutoEmailInvoice(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-sidebar-active cursor-pointer"
              />
              <span className="text-xs font-medium text-text">
                Automatically generate and copy WhatsApp link when invoice is paid
              </span>
            </label>
          </div>
        </div>

        {/* Security & Access */}
        <div className="p-5 rounded-2xl border border-border bg-surface space-y-4 shadow-2xs">
          <div className="flex items-center gap-2.5 border-b border-border pb-3">
            <div className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center text-text">
              <Shield size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text">Security & Multi-Station Telemetry</h2>
              <p className="text-xs text-muted">Role verification and session management.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-border bg-bg/50 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-text block">Superadmin Owner Protection</span>
              <span className="text-muted text-[11px]">Enforce dual authentication for salary disbursement.</span>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-pastel-mint text-pastel-mint-text border border-pastel-mint-border">
              ENABLED
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}
