import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

export async function predictAnxiety(inputs) {
  const { data } = await client.post('/predict', inputs)
  return data
}

export async function explainPrediction(inputs, topN = 10) {
  const { data } = await client.post(`/explain?top_n=${topN}`, inputs)
  return data
}

export async function getFeatures() {
  const { data } = await client.get('/features')
  return data
}

export async function getPerformance() {
  const { data } = await client.get('/performance')
  return data
}

export async function checkHealth() {
  const { data } = await client.get('/health')
  return data
}