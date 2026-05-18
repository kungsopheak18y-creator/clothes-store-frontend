import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const snakeToCamel = (str) => str.replace(/_([a-z])/g, (_, l) => l.toUpperCase())

const convertKeys = (obj) => {
  // ✅ Fixed: added null/undefined/non-object safety checks
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(convertKeys)
  if (typeof obj !== 'object') return obj
  try {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [snakeToCamel(k), convertKeys(v)])
    )
  } catch (e) {
    return obj
  }
}

api.interceptors.response.use(
  (response) => {
    try {
      response.data = convertKeys(response.data)
    } catch (e) {
      console.warn('Key conversion failed', e)
    }
    return response
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default api