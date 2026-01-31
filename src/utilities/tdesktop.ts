export async function fetchLatestTDesktopRelease() {
  return fetch('https://api.github.com/repos/telegramdesktop/tdesktop/releases/latest')
    .then(res => res.json())
    .then((data) => {
      const tagName = data.tag_name
      if (!tagName) {
        console.warn('[!] No tag name found in the release data, using fallback')
        
        return '6.4.2'
      }

      return tagName.replace('v', '').trim()
    })
}
