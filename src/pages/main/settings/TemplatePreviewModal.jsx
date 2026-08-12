import React from "react";
import { X } from "lucide-react";
import { renderTemplate } from "./templateUtils";

export default function TemplatePreviewModal({ open, onClose, subject, body, sampleKey }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0b1017] border border-slate-800/90 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white">Preview</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto space-y-3">
          {subject && (
            <div className="text-xs text-slate-500">
              Subject: <span className="text-slate-300">{renderTemplate(subject, sampleKey)}</span>
            </div>
          )}
          <div
            className="bg-white text-slate-900 rounded-lg p-4 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderTemplate(body, sampleKey) }}
          />
        </div>
      </div>
    </div>
  );
}
