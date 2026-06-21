export async function api(url, options = {}) {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  const res = await fetch(url, { ...options, headers })
  if (res.status === 401 && !url.includes('/login')) {
    localStorage.removeItem('token')
    window.location.reload()
  }
  return res
}
