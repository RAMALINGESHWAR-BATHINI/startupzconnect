import { describe, it, expect } from 'vitest';
import { verifyFileSignature, hasDangerousExtension, declaredMimeAllowed } from '@/lib/file-signature';

describe('verifyFileSignature', () => {
  it('accepts valid JPEG bytes', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const r = verifyFileSignature(jpeg, 'photo.jpg', 'image/jpeg');
    expect(r.ok).toBe(true);
    expect(r.mime).toBe('image/jpeg');
  });

  it('accepts valid PNG bytes', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const r = verifyFileSignature(png, 'image.png', 'image/png');
    expect(r.ok).toBe(true);
    expect(r.mime).toBe('image/png');
  });

  it('accepts valid WEBP bytes', () => {
    const webp = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00, // size
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]);
    const r = verifyFileSignature(webp, 'image.webp', 'image/webp');
    expect(r.ok).toBe(true);
    expect(r.mime).toBe('image/webp');
  });

  it('accepts valid PDF bytes', () => {
    const pdf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]);
    const r = verifyFileSignature(pdf, 'doc.pdf', 'application/pdf');
    expect(r.ok).toBe(true);
    expect(r.mime).toBe('application/pdf');
  });

  it('rejects MIME spoofing: PHP bytes with image/jpeg type', () => {
    const php = Buffer.from([0x3c, 0x3f, 0x70, 0x68, 0x70]); // <?php
    const r = verifyFileSignature(php, 'shell.jpg', 'image/jpeg');
    expect(r.ok).toBe(false);
  });

  it('rejects HTML bytes with image/png type', () => {
    const html = Buffer.from([0x3c, 0x21, 0x44, 0x4f, 0x43, 0x54, 0x59, 0x50, 0x45]); // <!DOCTYPE
    const r = verifyFileSignature(html, 'image.png', 'image/png');
    expect(r.ok).toBe(false);
  });

  it('rejects too-small files', () => {
    const r = verifyFileSignature(Buffer.from([0xff]), 'tiny.jpg', 'image/jpeg');
    expect(r.ok).toBe(false);
  });
});

describe('hasDangerousExtension', () => {
  it('rejects executable/script extensions', () => {
    expect(hasDangerousExtension('shell.php')).toBe(true);
    expect(hasDangerousExtension('script.js')).toBe(true);
    expect(hasDangerousExtension('page.html')).toBe(true);
    expect(hasDangerousExtension('image.svg')).toBe(true);
    expect(hasDangerousExtension('program.exe')).toBe(true);
  });

  it('accepts safe extensions', () => {
    expect(hasDangerousExtension('image.jpg')).toBe(false);
    expect(hasDangerousExtension('doc.pdf')).toBe(false);
    expect(hasDangerousExtension('photo.png')).toBe(false);
  });
});

describe('declaredMimeAllowed', () => {
  it('allows safe MIME types', () => {
    expect(declaredMimeAllowed('image/jpeg')).toBe(true);
    expect(declaredMimeAllowed('image/png')).toBe(true);
    expect(declaredMimeAllowed('image/webp')).toBe(true);
    expect(declaredMimeAllowed('application/pdf')).toBe(true);
  });

  it('rejects unsafe MIME types', () => {
    expect(declaredMimeAllowed('text/html')).toBe(false);
    expect(declaredMimeAllowed('application/x-php')).toBe(false);
    expect(declaredMimeAllowed('image/svg+xml')).toBe(false);
  });
});
