import { useState, useEffect } from 'react'
import { User, Plus, Trash2, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react'
import { createWorkerProfile, listWorkers } from '../services/api'

const EXPERIENCE_OPTIONS = [
  { value: 0, label: '0 years (Student)' },
  { value: 1, label: '1 year' },
  { value: 2, label: '2 years' },
  { value: 3, label: '3 years' },
  { value: 4, label: '4 years' },
  { value: 5, label: '5 years' },
  { value: 6, label: '6 years' },
  { value: 7, label: '7 years' },
  { value: 8, label: '8+ years' },
  { value: 10, label: '10+ years' },
]

const SAMPLE_RESUMES = [
  {
    label: 'Python Backend Dev',
    data: {
      name: 'Arjun Sharma',
      resume_text: 'Senior Python developer with 5 years of experience building scalable REST APIs with FastAPI and Django. Expert in PostgreSQL, Redis, Docker, Kubernetes, and AWS. Familiar with CI/CD pipelines, microservices architecture, and agile methodologies.',
      experience_years: 5,
      preferred_role: 'Senior Backend Developer',
      location: 'Bangalore, India',
    },
  },
  {
    label: 'ML Engineer',
    data: {
      name: 'Priya Nair',
      resume_text: 'Machine Learning Engineer with 4 years building production ML systems. Proficient in Python, TensorFlow, PyTorch, Scikit-learn, Pandas, NumPy. Experience with NLP, computer vision, and recommendation systems. Deployed models using MLflow and Kubernetes.',
      experience_years: 4,
      preferred_role: 'ML Engineer',
      location: 'Hyderabad, India',
    },
  },
  {
    label: 'Frontend Dev',
    data: {
      name: 'Sneha Patel',
      resume_text: 'Frontend engineer with 3 years building modern web apps with React, TypeScript, Next.js, and Tailwind CSS. Strong in GraphQL, REST APIs, and performance optimization. Experience with Figma to code workflows and design systems.',
      experience_years: 3,
      preferred_role: 'Frontend Developer',
      location: 'Mumbai, India',
    },
  },
]

export default function WorkerProfile() {
  const [form, setForm] = useState({
    name: '', resume_text: '', skills: '', experience_years: 3,
    preferred_role: '', location: '',
  })
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState(null)
  const [error,    setError]    = useState('')
  const [workers,  setWorkers]  = useState([])
  const [loadingWorkers, setLoadingWorkers] = useState(true)

  useEffect(() => {
    fetchWorkers()
  }, [])

  async function fetchWorkers() {
    setLoadingWorkers(true)
    try {
      const data = await listWorkers()
      setWorkers(data.workers || [])
    } catch {
      setWorkers([])
    } finally {
      setLoadingWorkers(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required'); return }
    if (!form.resume_text.trim() && !form.skills.trim()) {
      setError('Provide either a resume text or skills list'); return
    }
    setLoading(true); setError(''); setResult(null)
    try {
      const payload = {
        name: form.name,
        resume_text: form.resume_text || null,
        skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : null,
        experience_years: Number(form.experience_years),
        preferred_role: form.preferred_role || null,
        location: form.location || null,
      }
      const data = await createWorkerProfile(payload)
      setResult(data)
      setForm({ name: '', resume_text: '', skills: '', experience_years: 3, preferred_role: '', location: '' })
      fetchWorkers()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to create profile. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  function loadSample(sample) {
    setForm(f => ({
      ...f,
      ...sample.data,
      skills: '',
    }))
    setResult(null); setError('')
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <User size={22} className="text-brand-400" /> Worker Profile
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload a worker profile. Skills are automatically extracted from resume text using NLP.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">

        {/* ── Form ── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Sample loaders */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 self-center">Quick fill:</span>
            {SAMPLE_RESUMES.map(s => (
              <button key={s.label} onClick={() => loadSample(s)} className="btn-secondary text-xs py-1.5 px-3">
                {s.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="card space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name *</label>
                <input className="input" placeholder="e.g. Arjun Sharma" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Preferred Role</label>
                <input className="input" placeholder="e.g. Backend Developer" value={form.preferred_role}
                  onChange={e => setForm(f => ({ ...f, preferred_role: e.target.value }))} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Experience</label>
                <div className="relative">
                  <select className="input appearance-none pr-8 cursor-pointer" value={form.experience_years}
                    onChange={e => setForm(f => ({ ...f, experience_years: Number(e.target.value) }))}>
                    {EXPERIENCE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Location</label>
                <input className="input" placeholder="e.g. Bangalore, India" value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Resume Text <span className="text-gray-600">(skills are auto-extracted)</span>
              </label>
              <textarea className="input resize-none h-32" placeholder="Paste your resume or bio here. Skills will be extracted automatically using NLP..."
                value={form.resume_text} onChange={e => setForm(f => ({ ...f, resume_text: e.target.value }))} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Manual Skills <span className="text-gray-600">(comma-separated, optional)</span>
              </label>
              <input className="input" placeholder="Python, React, AWS, Docker..."
                value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} />
            </div>

            {error && (
              <div className="flex gap-2 p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-sm">
                <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading
                ? <><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> Processing...</>
                : <><Plus size={16} /> Create Worker Profile</>}
            </button>
          </form>

          {/* Success result */}
          {result && (
            <div className="card border-green-800 space-y-3">
              <div className="flex items-center gap-2 text-green-400 font-semibold">
                <CheckCircle size={18} /> Profile Created!
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Worker ID:</span><span className="text-white font-mono ml-2">{result.worker_id}</span></div>
                <div><span className="text-gray-500">Skills found:</span><span className="text-white ml-2">{result.skills?.length}</span></div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-2">Extracted skills:</div>
                <div className="flex flex-wrap gap-1.5">
                  {result.skills?.map(s => <span key={s} className="tag-blue">{s}</span>)}
                </div>
              </div>
              <p className="text-xs text-gray-500">{result.message}</p>
            </div>
          )}
        </div>

        {/* ── Worker list ── */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-400">Saved Workers</h2>
            <span className="tag-gray">{workers.length}</span>
          </div>

          {loadingWorkers ? (
            <div className="card flex items-center justify-center h-32">
              <span className="animate-spin w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full" />
            </div>
          ) : workers.length === 0 ? (
            <div className="card text-center text-gray-600 text-sm py-10">
              No workers yet.<br />Create the first profile above.
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {workers.map((w, i) => {
                const skills = typeof w.skills === 'string' ? JSON.parse(w.skills || '[]') : (w.skills || [])
                return (
                  <div key={i} className="card py-3 px-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{w.name}</span>
                      <span className="tag-gray text-xs font-mono">{w.id}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {w.experience_years}y · {w.preferred_role || 'Any role'}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {skills.slice(0, 4).map(s => <span key={s} className="tag-blue text-xs">{s}</span>)}
                      {skills.length > 4 && <span className="tag-gray text-xs">+{skills.length - 4}</span>}
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
