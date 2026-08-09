import { describe, it, expect } from 'vitest';
import { dedupeContacts } from '@shared/dedupe';

describe('dedupeContacts', () => {
  it('keeps first occurrence, flags rest as duplicates', () => {
    const contacts = [
      { id: '1', linkedin_url: 'https://www.linkedin.com/in/jane-doe/' },
      { id: '2', linkedin_url: 'https://linkedin.com/in/jane-doe' },
      { id: '3', linkedin_url: 'https://linkedin.com/in/john-smith' },
    ];
    const { unique, duplicates } = dedupeContacts(contacts);
    expect(unique.map((c) => c.id)).toEqual(['1', '3']);
    expect(duplicates.map((c) => c.id)).toEqual(['2']);
  });

  it('treats different profiles as unique', () => {
    const contacts = [
      { id: '1', linkedin_url: 'https://linkedin.com/in/a' },
      { id: '2', linkedin_url: 'https://linkedin.com/in/b' },
    ];
    const { unique, duplicates } = dedupeContacts(contacts);
    expect(unique.length).toBe(2);
    expect(duplicates.length).toBe(0);
  });

  it('never drops records with empty urls, treats them as unique', () => {
    const contacts = [
      { id: '1', linkedin_url: '' },
      { id: '2', linkedin_url: '' },
    ];
    const { unique, duplicates } = dedupeContacts(contacts);
    expect(unique.length).toBe(2);
    expect(duplicates.length).toBe(0);
  });
});
