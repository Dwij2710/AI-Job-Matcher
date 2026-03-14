import { useState, useEffect } from 'react'
import { Zap, Search, ChevronDown, CheckCircle2, XCircle, TrendingUp, AlertCircle, ChevronRight, ChevronUp } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { listWorkers, getMatches } from '../services/api'

const LEVEL_COLORS = {
  entry: 'tag-gray', junior: 'tag-blue', mid: 'tag-amber', senior: 'tag-green',
  lead: 'bg-purple-950 text-purple-300 border border-purple-800 tag',
}

function scoreColor(score) {
  if (score >= 75) return '#22c55e'
  if (score >= 55) return '#f59e0b'
  return '#ef4444'
}
function scoreBg(score) {
  if (score >= 75) return 'border-green-800 bg-green-950/20'
  if (score >= 55) return 'border-amber-800 bg-amber-950/20'
  return 'border-red-800 bg-red-950/20'
}

function ScoreRing({ score }) {
  const color = scoreColor(score)
  const data = [{ value: score }, { value: 100 - score }]
  return (
    <div className="relative w-20 h-20">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="65%" outerRadius="100%" data={[{ value: score, fill: color }]}
          startAngle={90} endAngle={-270} barSize={8}>
          <RadialBar dataKey="value" background={{ fill: '#1f2937' }} cornerRadius={10} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>{score.toFixed(0)}%</span>
      </div>
    </div>
  )
}

function MatchCard({ match, rank }) {
  const [open, setOpen] = useState(false)
  const { title, company, location, match_score, experience_level, required_skills, explanation } = match
  return (
    <div className={`card border transition-all ${scoreBg(match_score)}`}>
      <div className="flex items-start gap-4">
        {/* Rank */}
        <div className="text-2xl font-black text-gray-700 w-7 shrink-0 mt-1">#{rank}</div>
        {/* Score ring */}
        <ScoreRing score={match_score} />
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-bold text-white text-base">{title}</h3>
              <div className="text-xs text-gray-500 mt-0.5">
                {company && <span>{company} · </span>}
                {location || 'Location not specified'}
              </div>
            </div>
            <span className={LEVEL_COLORS[experience_level] || 'tag-gray'}>{experience_level}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {required_skills.slice(0, 5).map(s => <span key={s} className="tag-gray text-xs">{s}</span>)}
            {required_skills.length > 5 && <span className="tag-gray text-xs">+{required_skills.length - 5}</span>}
          </div>
        </div>
        <button onClick={() => setOpen(o => !o)}
          className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-white transition-colors shrink-0">
          {open ? <ChevronUp size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Expanded explanation */}
      {open && (
        <div className="mt-4 pt-4 border-t border-gray-700/50 grid sm:grid-cols-2 gap-4">
          {/* Matched */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-green-400 mb-2">
              <CheckCircle2 size={13} /> Matched Skills ({explanation.matched_skills.length})
            </div>
            {explanation.matched_skills.length === 0
              ? <p className="text-xs text-gray-600">No direct matches</p>
              : (
                <div className="flex flex-wrap gap-1.5">
                  {explanation.matched_skills.map(s => <span key={s} className="tag-green text-xs">{s}</span>)}
                </div>
              )}
          </div>
          {/* Missing */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400 mb-2">
              <XCircle size={13} /> Missing Skills ({explanation.missing_skills.length})
            </div>
            {explanation.missing_skills.length === 0
              ? <p className="text-xs text-green-600">All skills covered!</p>
              : (
                <div className="flex flex-wrap gap-1.5">
                  {explanation.missing_skills.map(s => <span key={s} className="tag-red text-xs">{s}</span>)}
                </div>
              )}
          </div>
          {/* Experience + recommendation */}
          <div className="sm:col-span-2 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <TrendingUp size={13} className="text-brand-400" />
              <span className="font-medium text-gray-300">Experience:</span>
              {explanation.experience_alignment}
            </div>
            <div className="p-3 rounded-xl bg-brand-950/40 border border-brand-800/50 text-xs text-brand-300">
              💡 {explanation.recommendation}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreBarChart({ matches }) {
  const data = matches.slice(0, 8).map(m => ({
    name: m.title.split(' ').slice(0, 2).join(' '),
    score: m.match_score,
  }))
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} />
        <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
        <Tooltip
          contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 10, fontSize: 12 }}
          labelStyle={{ color: '#e5e7eb' }}
          formatter={v => [`${v.toFixed(1)}%`, 'Match Score']}
        />
        <Bar dataKey="score" radius={[6, 6, 0, 0]}>
          {data.map((entry, i) => <Cell key={i} fill={scoreColor(entry.score)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function Matches() {
  const [workers,  setWorkers]  = useState([])
  const [workerId, setWorkerId] = useState('')
  const [topK,     setTopK]     = useState(10)
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState(null)
  const [error,    setError]    = useState('')

  useEffect(() => {
    listWorkers()
      .then(d => {
        setWorkers(d.workers || [])
        if (d.workers?.length) setWorkerId(d.workers[0].id)
      })
      .catch(() => {})
  }, [])

  async function handleMatch() {
    if (!workerId) { setError('Select a worker first'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const data = await getMatches(workerId, topK)
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Matching failed. Check backend is running and both workers & jobs exist.')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Zap size={22} className="text-brand-400" /> Find Job Matches
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Select a worker and get semantically ranked job matches with explainable scores.
        </p>
      </div>

      {/* Controls */}
      <div className="card flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Select Worker</label>
          <div className="relative">
            <select className="input appearance-none pr-8 cursor-pointer" value={workerId}
              onChange={e => setWorkerId(e.target.value)}>
              <option value="">-- Choose a worker --</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.id})</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>
        <div className="w-32">
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Top Results</label>
          <div className="relative">
            <select className="input appearance-none pr-8 cursor-pointer" value={topK}
              onChange={e => setTopK(Number(e.target.value))}>
              {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} matches</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>
        <button onClick={handleMatch} disabled={loading || !workerId} className="btn-primary py-3 px-6">
          {loading
            ? <><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />Matching...</>
            : <><Search size={15} />Find Matches</>}
        </button>
      </div>

      {workers.length === 0 && (
        <div className="card border-amber-800 bg-amber-950/20 flex gap-3">
          <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="text-amber-300 text-sm">
            No workers found. Go to <a href="/worker" className="underline">Worker Profile</a> to add one first.
          </div>
        </div>
      )}

      {error && (
        <div className="card border-red-800 bg-red-950/30 flex gap-3">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <div className="text-red-300 text-sm">{error}</div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Worker',       value: result.worker_name,                       color: 'text-blue-400' },
              { label: 'Skills',       value: result.worker_skills?.length,             color: 'text-purple-400' },
              { label: 'Matches',      value: result.top_matches?.length,               color: 'text-green-400' },
              { label: 'Jobs Searched',value: result.total_jobs_searched,               color: 'text-amber-400' },
            ].map(s => (
              <div key={s.label} className="card py-3 text-center">
                <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
                <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Worker skills */}
          <div className="card">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Worker Skills</div>
            <div className="flex flex-wrap gap-1.5">
              {result.worker_skills?.map(s => <span key={s} className="tag-blue">{s}</span>)}
            </div>
          </div>

          {/* Score chart */}
          {result.top_matches?.length > 0 && (
            <div className="card">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Match Score Overview</div>
              <ScoreBarChart matches={result.top_matches} />
            </div>
          )}

          {/* Match cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-white">
                Top {result.top_matches?.length} Matches
                <span className="text-gray-500 font-normal text-sm ml-2">— click any card to expand explanation</span>
              </h2>
            </div>
            <div className="space-y-3">
              {result.top_matches?.map((match, i) => (
                <MatchCard key={match.job_id} match={match} rank={i + 1} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
