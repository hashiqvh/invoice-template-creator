'use client';

import InvoiceEditor from '@/components/InvoiceEditor';
import { useState } from 'react';

export default function Home() {
  const [savedContent, setSavedContent] = useState<{html: string, css: string} | null>(null);

  const handleSave = (html: string, css: string) => {
    setSavedContent({ html, css });
    console.log('Invoice saved:', { html, css });
  };

  const downloadHTML = () => {
    if (savedContent) {
      const blob = new Blob([savedContent.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invoice-template.html';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const downloadComplete = () => {
    if (savedContent) {
      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Invoice Template</title>
            <style>${savedContent.css}</style>
          </head>
          <body>
            ${savedContent.html}
          </body>
        </html>
      `;
      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invoice-template.html';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Frappe-style Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-sm font-bold">P</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Print Designer</h1>
                <p className="text-sm text-gray-600">Invoice Template</p>
              </div>
              {savedContent && (
                <div className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                  Saved
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={downloadHTML}
                disabled={!savedContent}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export HTML
              </button>
              <button
                onClick={downloadComplete}
                disabled={!savedContent}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="h-[calc(100vh-73px)]">
        <InvoiceEditor onSave={handleSave} />
      </main>
    </div>
  );
}
