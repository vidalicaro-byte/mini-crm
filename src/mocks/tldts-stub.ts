/**
 * Stand-in for `tldts` in the production build. The mock API's request library (tough-cookie, via
 * MSW) uses it only to look up public suffixes for cookie rules, which this app never uses (it
 * authenticates with a bearer token). The real package carries a ~250 kB suffix list that would
 * be downloaded before the first screen can appear.
 */
export function getDomain(hostname: string): string | null {
  return hostname || null;
}
