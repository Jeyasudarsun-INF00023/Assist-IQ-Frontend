import axios from 'axios'

export const API_URL = process.env.BACKEND_URL || 'https://assist-iq-backend-cwid.onrender.com' || 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: API_URL,
  timeout: 0
})

// Optional: Add request/response interceptors here if needed in the future

export default api
