export function getProfilePhotoUrl(photoUrl, apiBase = process.env.REACT_APP_API_URL || 'https://arrowdatatech.com/api') {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) return photoUrl;
  if (photoUrl.startsWith('data:')) return photoUrl;
  const normalizedBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
  return `${normalizedBase}${photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`}`;
}
