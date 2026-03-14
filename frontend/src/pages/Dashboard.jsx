import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BrainCircuit, Users, Briefcase, Zap, ArrowRight, Play, CheckCircle, AlertCircle } from 'lucide-react'
import { listWorkers, listJobs, runDemo } from '../services/api'

const STEPS = [
  { step: '01', title: 'Upload Worker Profile', desc: 'Add skills, experience, and resume text. AI extracts skills automatically.', icon: Users, to: '/worker', color: 'blue' },
  { step: '02', title: 'Add Job Listings',       desc: 'Post jobs with descriptions. Skills are extracted via NLP.',                icon: Briefcase, to: '/jobs',   color: 'purple' },
  { step: '03', title: 'Get AI Matches',          desc: 'Semantic similarity finds the best-fit jobs with explainable scores.',    icon: Zap, to: '/matches', color: 'green' },
]

const COLOR_MAP = {
  blue:   'bg-blue-950 border-blue-800 text-blue-400',
  purple: 'bg-purple-950 border-purple-800 text-purple-400',
  green:  'bg-green-950 border-green-800 text-green-400',
}

export default function Dashboard() {
  const [workers, setWorkers] = useState(0)
  const [jobs,    setJobs]    = useState(0)
  const [loading, setLoading] = useState(false)
  const [demoResult, setDemoResult] = useState(null)
  const [demoError,  setDemoError]  = useState('')

  useEffect(() => {
    listWorkers().then(d => setWorkers(d.count || 0)).catch(() => {})
    listJobs().then(d => setJobs(d.count || 0)).catch(() => {})
  }, [])

  async function handleDemo() {
    setLoading(true)
    setDemoError('')
    setDemoResult(null)
    try {
      const result = await runDemo()
      setDemoResult(result)
      setWorkers(w => w + 1)
      setJobs(10)
    } catch (e) {
      setDemoError(e.response?.data?.detail || 'Backend not running. Start with: uvicorn app.main:app --reload')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-10">

      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-950 border border-brand-800 text-brand-400 text-xs font-medium mb-2">
          <BrainCircuit size={13} />
          Semantic AI · Vector Search · Explainable Matching
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
          Match Workers to Jobs<br />
          <span className="text-gradient">with AI Precision</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Upload a worker profile, add job listings, and let our AI find the best semantic matches
          with full skill-by-skill explanations.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={handleDemo}
            disabled={loading}
            className="btn-primary px-6 py-3 text-base glow"
          >
            {loading ? (
              <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> Running Demo...</>
            ) : (
              <><Play size={16} /> Try Live Demo</>
            )}
          </button>
          <Link to="/worker" className="btn-secondary px-6 py-3 text-base">
            Get Started <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Workers',      value: workers, color: 'text-blue-400' },
          { label: 'Jobs',         value: jobs,    color: 'text-purple-400' },
          { label: 'Model Dims',   value: '384',   color: 'text-green-400' },
          { label: 'Match Weights',value: '3',     color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className={`text-3xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-gray-500 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">How it works</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {STEPS.map(({ step, title, desc, icon: Icon, to, color }) => (
            <Link key={step} to={to} className="card group hover:border-gray-700 transition-colors cursor-pointer">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border ${COLOR_MAP[color]} mb-4`}>
                <Icon size={18} />
              </div>
              <div className="text-xs font-mono text-gray-600 mb-1">STEP {step}</div>
              <h3 className="font-semibold text-white text-sm mb-1">{title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              <div className="mt-4 flex items-center gap-1 text-xs text-brand-400 group-hover:gap-2 transition-all">
                Open <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Demo result */}
      {demoError && (
        <div className="card border-red-800 bg-red-950/30 flex gap-3">
          <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-red-400 font-semibold text-sm mb-1">Backend not reachable</div>
            <div className="text-red-300/70 text-xs font-mono">{demoError}</div>
          </div>
        </div>
      )}

      {demoResult && (
        <div className="card border-green-800 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-green-400" />
            <span className="text-green-400 font-semibold">Demo ran successfully!</span>
            <span className="text-gray-500 text-xs ml-auto">Worker: {demoResult.worker_name}</span>
          </div>
          <div className="text-sm text-gray-400">
            Found <strong className="text-white">{demoResult.top_matches?.length}</strong> matches for worker
            <strong className="text-white ml-1">{demoResult.worker_id}</strong>
          </div>
          <div className="grid gap-2">
            {demoResult.top_matches?.slice(0, 3).map((m, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                <div>
                  <span className="text-white text-sm font-medium">{m.title}</span>
                  <span className="text-gray-500 text-xs ml-2">{m.company}</span>
                </div>
                <ScoreBadge score={m.match_score} />
              </div>
            ))}
          </div>
          <Link to="/matches" className="btn-primary w-full justify-center">
            View Full Results <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Tech stack */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Tech Stack</h2>
        <div className="flex flex-wrap gap-2">
          {['FastAPI', 'Python', 'Sentence Transformers', 'Pinecone', 'spaCy', 'React', 'Tailwind CSS', 'Recharts', 'Cosine Similarity', 'Explainable AI'].map(t => (
            <span key={t} className="tag-gray">{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function ScoreBadge({ score }) {
  const color = score >= 75 ? 'text-green-400 bg-green-950 border-green-800'
              : score >= 50 ? 'text-amber-400 bg-amber-950 border-amber-800'
              : 'text-red-400 bg-red-950 border-red-800'
  return (
    <span className={`tag border font-mono font-bold ${color}`}>
      {score.toFixed(1)}%
    </span>
  )
}
