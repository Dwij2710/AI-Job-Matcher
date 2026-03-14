import { useState, useEffect } from 'react'
import { Briefcase, Plus, CheckCircle, AlertCircle, ChevronDown, Database } from 'lucide-react'
import { createJob, listJobs, seedJobs } from '../services/api'

const LEVELS = ['entry', 'junior', 'mid', 'senior', 'lead']

const LEVEL_COLORS = {
  entry:  'tag-gray',
  junior: 'tag-blue',
  mid:    'tag-amber',
  senior: 'tag-green',
  lead:   'bg-purple-950 text-purple-300 border border-purple-800 tag',
}

const SAMPLE_JOBS = [
  {
    label: 'Python Backend',
    data: {
      title: 'Senior Python Backend Developer',
      description: 'Build scalable APIs with Python, FastAPI, PostgreSQL, Redis, Docker, and Kubernetes. Drive microservices architecture decisions.',
      experience_level: 'senior',
      location: 'Bangalore',
      company: 'TechCorp',
    },
  },
  {
    label: 'ML Engineer',
    data: {
      title: 'Machine Learning Engineer',
      description: 'Develop and deploy ML models using Python, TensorFlow, PyTorch. Build NLP pipelines and recommendation systems. MLflow for tracking.',
      experience_level: 'senior',
      location: 'Hyderabad',
      company: 'AI Labs',
    },
  },
  {
    label: 'React Frontend',
    data: {
      title: 'React Frontend Engineer',
      description: 'Build stunning web UIs with React, TypeScript, Next.js, Tailwind CSS, and GraphQL. Own the design system and component library.',
      experience_level: 'mid',
      location: 'Mumbai',
      company: 'DesignFirst',
    },
  },
]

export default function JobListings() {
  const [form, setForm] = useState({
    title: '', description: '', required_skills: '',
    experience_level: 'mid', location: '', company: '',
  })
  const [loading,      setLoading]      = useState(false)
  const [seeding,      setSeeding]      = useState(false)
  const [result,       setResult]       = useState(null)
  const [error,        setError]        = useState('')
  const [jobs,         setJobs]         = useState([])
  const [loadingJobs,  setLoadingJobs]  = useState(true)

  useEffect(() => { fetchJobs() }, [])

  async function fetchJobs() {
    setLoadingJobs(true)
    try {
      const data = await listJobs()
      setJobs(data.jobs || [])
    } catch { setJobs([]) }
    finally { setLoadingJobs(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required'); return
    }
    setLoading(true); setError(''); setResult(null)
    try {
      const payload = {
        title: form.title,
        description: form.description,
        required_skills: form.required_skills ? form.required_skills.split(',').map(s => s.trim()).filter(Boolean) : null,
        experience_level: form.experience_level,
        location: form.location || null,
        company: form.company || null,
      }
      const data = await createJob(payload)
      setResult(data)
      setForm({ title: '', description: '', required_skills: '', experience_level: 'mid', location: '', company: '' })
      fetchJobs()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to add job. Is the backend running?')
    } finally { setLoading(false) }
  }

  async function handleSeed() {
    setSeeding(true); setError('')
    try {
      await seedJobs()
      fetchJobs()
    } catch (e) {
      setError(e.response?.data?.detail || 'Seeding failed. Is the backend running?')
    } finally { setSeeding(false) }
  }

  function loadSample(s) {
    setForm(f => ({ ...f, ...s.data, required_skills: '' }))
    setResult(null); setError('')
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Briefcase size={22} className="text-brand-400" /> Job Listings
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Add jobs manually or seed with 10 sample listings for quick testing.
          </p>
        </div>
        <button onClick={handleSeed} disabled={seeding} className="btn-secondary">
          {seeding
            ? <span className="animate-spin w-4 h-4 border-2 border-gray-500 border-t-gray-200 rounded-full" />
            : <Database size={15} />}
          Seed 10 Sample Jobs
        </button>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">

        {/* Form */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 self-center">Quick fill:</span>
            {SAMPLE_JOBS.map(s => (
              <button key={s.label} onClick={() => loadSample(s)} className="btn-secondary text-xs py-1.5 px-3">
                {s.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="card space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Job Title *</label>
                <input className="input" placeholder="e.g. Senior Backend Developer"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Company</label>
                <input className="input" placeholder="e.g. TechCorp"
                  value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Experience Level</label>
                <div className="relative">
                  <select className="input appearance-none pr-8 cursor-pointer"
                    value={form.experience_level}
                    onChange={e => setForm(f => ({ ...f, experience_level: e.target.value }))}>
                    {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Location</label>
                <input className="input" placeholder="e.g. Remote / Bangalore"
                  value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Job Description *</label>
              <textarea className="input resize-none h-28"
                placeholder="Describe the role, responsibilities, and required stack..."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Required Skills <span className="text-gray-600">(comma-separated, optional)</span>
              </label>
              <input className="input" placeholder="Python, FastAPI, PostgreSQL..."
                value={form.required_skills} onChange={e => setForm(f => ({ ...f, required_skills: e.target.value }))} />
            </div>

            {error && (
              <div className="flex gap-2 p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-sm">
                <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading
                ? <><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />Processing...</>
                : <><Plus size={16} />Add Job Listing</>}
            </button>
          </form>

          {result && (
            <div className="card border-green-800 space-y-3">
              <div className="flex items-center gap-2 text-green-400 font-semibold">
                <CheckCircle size={18} /> Job Added!
              </div>
              <div className="text-sm text-gray-400">
                <span className="text-white font-medium">{result.title}</span> · ID: <span className="font-mono text-gray-300">{result.job_id}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.required_skills?.map(s => <span key={s} className="tag-green">{s}</span>)}
              </div>
              {result.bias_warnings?.length > 0 && (
                <div className="flex gap-2 p-2 rounded-lg bg-amber-950/30 border border-amber-800 text-amber-300 text-xs">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  Bias warnings: {result.bias_warnings.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Job list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-400">Current Listings</h2>
            <span className="tag-gray">{jobs.length}</span>
          </div>

          {loadingJobs ? (
            <div className="card flex items-center justify-center h-32">
              <span className="animate-spin w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="card text-center text-gray-600 text-sm py-10">
              No jobs yet.<br />Add one or seed sample data.
            </div>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {jobs.map((j, i) => {
                const skills = typeof j.required_skills === 'string'
                  ? JSON.parse(j.required_skills || '[]') : (j.required_skills || [])
                return (
                  <div key={i} className="card py-3 px-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-white leading-tight">{j.title}</span>
                      <span className={LEVEL_COLORS[j.experience_level] || 'tag-gray'}>{j.experience_level}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {j.company && <span>{j.company} · </span>}
                      {j.location || 'Remote'}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {skills.slice(0, 3).map(s => <span key={s} className="tag-green text-xs">{s}</span>)}
                      {skills.length > 3 && <span className="tag-gray text-xs">+{skills.length - 3}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
