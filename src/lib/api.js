import axios from 'axios'

const api = axios.create({
  baseURL: 'https://clothes-store-backend-na6n.onrender.com',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const snakeToCamel = (str) => str.replace(/_([a-z])/g, (_, l) => l.toUpperCase())
const convertKeys = (obj) => {
  if (Array.isArray(obj)) return obj.map(convertKeys)
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [snakeToCamel(k), convertKeys(v)])
    )
  }
  return obj
}

api.interceptors.response.use((response) => {
  response.data = convertKeys(response.data)
  return response
})

export default api