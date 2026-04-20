import { api } from './client'

/** POST /api/auth/register */
export const registerUser = (data) => api.post('/api/auth/register', data)

/** POST /api/auth/login */
export const loginUser = (data) => api.post('/api/auth/login', data)
