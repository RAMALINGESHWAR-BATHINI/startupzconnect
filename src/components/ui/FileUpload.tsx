'use client';
import { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import api from '@/lib/api';

interface FileUploadProps {
  folder: 'team-photos' | 'documents' | 'resumes' | 'inspections';
  accept: string; // e.g. "image/jpeg,image/png,image/webp"
  onUploaded: (url: string) => void;
  currentUrl?: string;
  onClear?: () => void;
  label?: string;
}

export function FileUpload({ folder, accept, onUploaded, currentUrl, onClear, label }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(''); setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', folder);
      const res = await api.post('/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      onUploaded(res.data.url);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Upload failed.');
    } finally { setUploading(false); }
  };

  if (currentUrl) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span className="text-xs text-emerald-300 truncate flex-1">File uploaded</span>
        {onClear && (
          <button type="button" onClick={onClear} className="text-slate-500 hover:text-red-400 flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-white/15 hover:border-indigo-500/50 text-slate-400 hover:text-white text-sm transition-colors disabled:opacity-60">
        {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> {label || 'Upload a file'}</>}
      </button>
      {error && <p className="flex items-center gap-1 text-xs text-red-400 mt-1.5"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
}
