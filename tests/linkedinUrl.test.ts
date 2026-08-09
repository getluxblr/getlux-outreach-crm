import { describe, it, expect } from 'vitest';
import { normalizeLinkedInUrl } from '@shared/linkedinUrl';

describe('normalizeLinkedInUrl', () => {
  it('lowercases host and strips www', () => {
    expect(normalizeLinkedInUrl('https://WWW.LinkedIn.com/in/JaneDoe')).toBe('linkedin.com/in/janedoe');
  });

  it('strips query params and tracking', () => {
    expect(normalizeLinkedInUrl('https://www.linkedin.com/in/jane-doe?trk=public_profile_browse')).toBe(
      'linkedin.com/in/jane-doe',
    );
  });

  it('strips trailing slash', () => {
    expect(normalizeLinkedInUrl('https://www.linkedin.com/in/jane-doe/')).toBe('linkedin.com/in/jane-doe');
  });

  it('handles missing protocol', () => {
    expect(normalizeLinkedInUrl('linkedin.com/in/jane-doe')).toBe('linkedin.com/in/jane-doe');
  });

  it('handles bare www without protocol', () => {
    expect(normalizeLinkedInUrl('www.linkedin.com/in/jane-doe')).toBe('linkedin.com/in/jane-doe');
  });

  it('collapses duplicate slashes', () => {
    expect(normalizeLinkedInUrl('https://linkedin.com//in//jane-doe//')).toBe('linkedin.com/in/jane-doe');
  });

  it('treats two messy variants as equal after normalization', () => {
    const a = normalizeLinkedInUrl('HTTPS://www.linkedin.com/in/jane-doe-1234ab/?miniProfileUrn=xyz');
    const b = normalizeLinkedInUrl('linkedin.com/in/jane-doe-1234ab');
    expect(a).toBe(b);
  });

  it('returns empty string for empty/invalid input', () => {
    expect(normalizeLinkedInUrl('')).toBe('');
    expect(normalizeLinkedInUrl(undefined as unknown as string)).toBe('');
  });

  it('strips hash fragments', () => {
    expect(normalizeLinkedInUrl('https://linkedin.com/in/jane-doe#about')).toBe('linkedin.com/in/jane-doe');
  });
});
