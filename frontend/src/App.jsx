import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useState } from 'react'
import {
  BrainCircuit, Users, Briefcase, Zap, Menu, X, Github, Activity
} from 'lucide-react'
import Dashboard from './pages/Dashboard'
import WorkerProfile from './pages/WorkerProfile'
import JobListings from './pages/JobListings'
import Matches from './pages/Matches'

const NAV = [
  { to: '/',        label: 'Dashboard',   icon: Activity   },
  { to: '/worker',  label: 'Worker Profile', icon: Users   },
  { to: '/jobs',    label: 'Job Listings', icon: Briefcase  },
  { to: '/matches', label: 'Find Matches', icon: Zap        },
]

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">

        {/* ── Top nav ── */}
        <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <BrainCircuit size={16} className="text-white" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">
                AI Job <span className="text-gradient">Matcher</span>
              </span>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-600/20 text-brand-400 border border-brand-700/50'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                    }`
                  }
                >
                  <Icon size={15} />
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white"
              onClick={() => setMenuOpen(o => !o)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile nav */}
          {menuOpen && (
            <div className="md:hidden border-t border-gray-800 bg-gray-950 px-4 py-3 flex flex-col gap-1">
              {NAV.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-600/20 text-brand-400'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`
                  }
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </div>
          )}
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
          <Routes>
            <Route path="/"        element={<Dashboard />} />
            <Route path="/worker"  element={<WorkerProfile />} />
            <Route path="/jobs"    element={<JobListings />} />
            <Route path="/matches" element={<Matches />} />
          </Routes>
        </main>

        {/* ── Footer ── */}
        <footer className="border-t border-gray-800 py-5 text-center text-xs text-gray-600">
          AI Job Matcher · Semantic Similarity Powered · Built with FastAPI + React + Sentence Transformers
        </footer>
      </div>
    </BrowserRouter>
  )
}
