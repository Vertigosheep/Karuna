import { api } from './client'

/** POST /api/issues */
export const createIssue = (data, token) =>
  api.post('/api/issues', data, { token })

/** GET /api/issues */
export const getIssues = (token, signal) =>
  api.get('/api/issues', { token, signal })

/** GET /api/issues/my-tasks */
export const getMyTasks = (token, signal) =>
  api.get('/api/issues/my-tasks', { token, signal })

/** PATCH /api/issues/:id/status */
export const updateIssueStatus = (id, status, token) =>
  api.patch(`/api/issues/${id}/status`, { status }, { token })
