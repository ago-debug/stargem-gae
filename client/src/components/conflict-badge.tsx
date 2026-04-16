import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { ConflictResult } from '@/hooks/useFieldConflictCheck';

interface ConflictBadgeProps {
  result: ConflictResult;
  type: 'cf' | 'email' | 'telefono';
}

export function ConflictBadge({ result, type }: ConflictBadgeProps) {
  if (result.checking) {
    return (
      <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
        <Loader2 className="w-3 h-3 animate-spin" /> Verifico {type}...
      </div>
    );
  }

  if (result.available === true && !result.warning) {
    return null; // All good
  }

  if (result.warning) {
    let warningText = "⚠ Valore duplicato";
    if (result.warning === 'email_famiglia') {
      warningText = "⚠ Email già usata da un'altra scheda — permesso per minori";
    } else if (result.warning === 'telefono_famiglia') {
      warningText = "⚠ Telefono già usato da un'altra scheda — permesso per minori";
    }
    return (
      <div className="mt-1.5 text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1.5 rounded-md inline-flex items-center max-w-full">
        <span className="truncate">{warningText}</span>
      </div>
    );
  }

  if (result.available === false && result.conflict) {
    const typeLabel = type === 'cf' ? 'CF' : type === 'email' ? 'Email' : 'Telefono';
    return (
      <div className="mt-1.5 bg-red-50 text-red-700 border border-red-200 rounded-md p-2 text-xs flex flex-col gap-1 w-full max-w-sm">
        <div className="flex items-start gap-1.5 font-bold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>✗ {typeLabel} già presente nel sistema</span>
        </div>
        <div className="ml-5 space-y-0.5 text-[11px] opacity-90">
          <div>Scheda: {result.conflict.name} {result.conflict.email ? `· ${result.conflict.email}` : ''}</div>
          <a
            href={`/members/${result.conflict.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-1 uppercase tracking-wider font-semibold underline underline-offset-2 hover:text-red-900 transition-colors"
          >
            → Vai alla scheda
          </a>
        </div>
      </div>
    );
  }

  return null;
}
