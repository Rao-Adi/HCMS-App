// Static files (uploads, signatures) are served from the API host's root, not under the "/api"
// prefix used for REST calls -- same pattern as esignature.ts and main-layout.ts's SignalR hub URL.
export function resolveUploadUrl(relativeUrl: string | null | undefined, apiBaseUrl: string | null | undefined): string {
  if (!relativeUrl) return '';
  if (relativeUrl.startsWith('http')) return relativeUrl;

  let baseUrl = apiBaseUrl ? apiBaseUrl.replace(/\/$/, '') : '';
  if (baseUrl.endsWith('/api')) {
    baseUrl = baseUrl.substring(0, baseUrl.length - 4);
  }
  return baseUrl + (relativeUrl.startsWith('/') ? '' : '/') + relativeUrl;
}
