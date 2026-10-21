import { describe, it, expect } from 'vitest';
import { isSafeHttpUrl } from '@/lib/url-safety';

describe('isSafeHttpUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isSafeHttpUrl('https://example.com')).toBe(true);
    expect(isSafeHttpUrl('http://example.com/path')).toBe(true);
  });

  it('rejects javascript: URLs (stored XSS)', () => {
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeHttpUrl('JAVASCRIPT:alert(1)')).toBe(false);
    expect(isSafeHttpUrl('  javascript:alert(1)  ')).toBe(false);
  });

  it('rejects data: URLs', () => {
    expect(isSafeHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('rejects vbscript: and file: URLs', () => {
    expect(isSafeHttpUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isSafeHttpUrl('file:///etc/passwd')).toBe(false);
  });

  it('rejects empty and non-string input', () => {
    expect(isSafeHttpUrl('')).toBe(false);
    expect(isSafeHttpUrl(null as any)).toBe(false);
    expect(isSafeHttpUrl(undefined as any)).toBe(false);
  });

  it('rejects URLs with newline injection', () => {
    expect(isSafeHttpUrl('https://example.com\nalert(1)')).toBe(false);
    expect(isSafeHttpUrl('https://example.com\r\nalert(1)')).toBe(false);
  });
});
