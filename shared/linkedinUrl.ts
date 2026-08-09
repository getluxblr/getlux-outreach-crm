/**
 * normalizeLinkedInUrl
 *
 * Normalizes a LinkedIn profile URL so that duplicate detection can compare
 * URLs reliably regardless of protocol, host casing, "www.", trailing
 * slashes, tracking query params, or locale-prefixed handle variants
 * (e.g. "/in/jane-doe/" vs "/in/jane-doe-1234ab/").
 *
 * This is a pure function with no network/IO — safe to unit test directly.
 */
export function normalizeLinkedInUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';

  let raw = url.trim();
  if (!raw) return '';

  // Ensure it has a protocol so URL() parsing works for bare "linkedin.com/in/..."
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw.replace(/^\/\//, '')}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    // Not parseable as a URL at all — fall back to a best-effort string clean.
    return raw
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/+$/, '')
      .split('?')[0];
  }

  let host = parsed.hostname.toLowerCase();
  host = host.replace(/^www\./, '');

  let pathname = parsed.pathname.toLowerCase();
  // Collapse duplicate slashes
  pathname = pathname.replace(/\/{2,}/g, '/');
  // Strip trailing slash (but keep root "/")
  pathname = pathname.replace(/\/+$/, '');

  // Normalize the /in/<handle> segment: drop trailing locale/query artifacts,
  // keep only the handle segment itself.
  const inMatch = pathname.match(/\/in\/([^/]+)/);
  if (inMatch) {
    const handle = inMatch[1];
    pathname = `/in/${handle}`;
  }

  // Deliberately ignore query string (tracking params like ?trk=, ?miniProfileUrn=)
  // and hash fragments — they carry no identity information for a profile.
  return `${host}${pathname}`;
}
