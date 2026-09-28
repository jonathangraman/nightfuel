const text = value => new DOMParser().parseFromString(value || '', 'text/html').body.textContent.trim();
const allowedUrl = (value, host) => { try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === host; } catch { return false; } };
export function photoResults(data) {
  return Object.values(data.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0)).flatMap(page => {
    const info = page.imageinfo?.[0];
    const meta = info?.extmetadata || {};
    const license = text(meta.LicenseShortName?.value);
    const credit = text(meta.Artist?.value);
    const licenseUrl = meta.LicenseUrl?.value?.replace(/^http:/, 'https:');
    if (!info || !['image/jpeg', 'image/png', 'image/webp'].includes(info.mime) || !credit || !/^(CC BY(?:-SA)? [\d.]+|CC0(?: [\d.]+)?|Public domain)$/i.test(license) || !(allowedUrl(info.thumburl, 'upload.wikimedia.org') || allowedUrl(info.thumburl, 'thumb.wikimedia.org')) || !allowedUrl(info.descriptionurl, 'commons.wikimedia.org')) return [];
    if (!/^Public domain$/i.test(license) && !allowedUrl(licenseUrl, 'creativecommons.org')) return [];
    return [{ imageUrl: info.thumburl, imageCredit: credit, imageSourceUrl: info.descriptionurl, imageLicense: license, imageLicenseUrl: allowedUrl(licenseUrl, 'creativecommons.org') ? licenseUrl : '', imageIllustrative: true, title: page.title.replace(/^File:/, '') }];
  });
}
export async function findRecipePhotos(query, signal) {
  if (!query.trim()) throw new Error('Enter a dish name to search.');
  const params = new URLSearchParams({ action: 'query', generator: 'search', gsrsearch: query.trim().slice(0, 160), gsrnamespace: '6', gsrlimit: '18', prop: 'imageinfo', iiprop: 'url|mime|extmetadata', iiurlwidth: '960', format: 'json', origin: '*' });
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { signal, credentials: 'omit' });
  if (!response.ok) throw new Error('Photo search is unavailable right now. Please try again.');
  const data = await response.json();
  if (data.error) throw new Error('Photo search could not complete. Try a simpler dish name.');
  return photoResults(data).slice(0, 8);
}

