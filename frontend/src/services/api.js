import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Workers ──────────────────────────────────────────────────────────────────

export const createWorkerProfile = (data) =>
  api.post('/worker-profile', data).then(r => r.data)

export const listWorkers = () =>
  api.get('/worker-profile').then(r => r.data)

export const getWorker = (workerId) =>
  api.get(`/worker-profile/${workerId}`).then(r => r.data)

// ── Jobs ─────────────────────────────────────────────────────────────────────

export const createJob = (data) =>
  api.post('/job', data).then(r => r.data)

export const listJobs = () =>
  api.get('/job').then(r => r.data)

export const getJob = (jobId) =>
  api.get(`/job/${jobId}`).then(r => r.data)

export const seedJobs = () =>
  api.post('/job/seed').then(r => r.data)

// ── Matching ─────────────────────────────────────────────────────────────────

export const getMatches = (workerId, topK = 10) =>
  api.get(`/match/${workerId}`, { params: { top_k: topK } }).then(r => r.data)

export const runDemo = () =>
  api.post('/match/demo').then(r => r.data)

export default api
