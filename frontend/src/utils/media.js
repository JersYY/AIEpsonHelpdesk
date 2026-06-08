const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const backendBase = apiBase.replace(/\/api\/?$/, '')

export const uploadImageUrl = (image) => {
  if (!image?.storedName) return null
  return `${backendBase}/uploads/${encodeURIComponent(image.storedName)}`
}

export const normalizeMediaUrl = (value) => {
  if (!value) return null
  if (value.startsWith('blob:') || value.startsWith('data:') || /^https?:\/\//i.test(value)) return value
  if (value.startsWith('/uploads/')) return `${backendBase}${value}`
  return value
}
