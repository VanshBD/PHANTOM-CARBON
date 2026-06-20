import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Phantom Carbon — 71% of Your Carbon Footprint Is Invisible',
};

const layers = [
  {
    name: 'Surface Carbon',
    border: 'border-green-500/30 hover:border-green-400/60',
    bg: 'bg-green-900/10 hover:bg-green-900/20',
    badge: 'bg-green-500/20 text-green-400 border border-green-500/30',
    glow: 'hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]',
    iconBg: 'bg-green-900/40 ring-1 ring-green-500/30',
    icon: '🌍',
    color: 'text-green-400',
    description: 'Direct emissions you can see — driving, flying, heating your home, the food on your plate.',
    examples: ['Car journeys', 'Flights', 'Gas heating', 'Beef meals'],
    percent: '29%',
  },
  {
    name: 'Shadow Carbon',
    border: 'border-amber-500/30 hover:border-amber-400/60',
    bg: 'bg-amber-900/10 hover:bg-amber-900/20',
    badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    glow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]',
    iconBg: 'bg-amber-900/40 ring-1 ring-amber-500/30',
    icon: '👁️',
    color: 'text-amber-400',
    description: 'Hidden lifecycle emissions from products you buy — manufacturing, packaging, retail, waste.',
    examples: ['Fast fashion', 'Electronics', 'Packaged food', 'Furniture'],
    percent: '42%',
  },
  {
    name: 'Ghost Carbon',
    border: 'border-orange-500/30 hover:border-orange-400/60',
    bg: 'bg-orange-900/10 hover:bg-orange-900/20',
    badge: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    glow: 'hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]',
    iconBg: 'bg-orange-900/40 ring-1 ring-orange-500/30',
    icon: '👻',
    color: 'text-orange-400',
    description: 'Completely invisible — server farms, supply chains, delivery logistics, digital infrastructure.',
    examples: ['Streaming services', 'Food delivery apps', 'Online shopping logistics', 'Cloud storage'],
    percent: '29%',
  },
];

const steps = [
  { step: '01', title: 'Just Chat', description: 'Describe your day in plain language. "I drove 15km and ordered food delivery." No forms. No checkboxes.', icon: '💬' },
  { step: '02', title: 'AI Extracts', description: 'Groq-powered AI reads your text and instantly classifies every carbon-generating activity across all three layers.', icon: '⚡' },
  { step: '03', title: 'See Everything', description: 'Your Ghost Radar reveals the full picture — including the emissions nobody else tracks. Then act on it.', icon: '🎯' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a]">

      {/* ── Navigation ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800/50 bg-[#0a0e1a]/90 backdrop-blur-md"
        role="navigation" aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">👻</span>
            <span className="font-bold text-lg bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
              Phantom Carbon
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-2 py-1 rounded focus-visible:ring-2 focus-visible:ring-green-500">
              Sign in
            </Link>
            <Link href="/register" className="text-sm bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-all hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e1a]">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      <main id="main-content">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center" aria-labelledby="hero-heading">

          {/* Radial glow background */}
          <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-green-900/20 blur-[120px]" />
            <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-orange-900/10 blur-[100px]" />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-orange-900/30 border border-orange-500/30 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" aria-hidden="true" />
            <span className="text-sm text-orange-400 font-medium">AI-powered carbon intelligence · Powered by Groq</span>
          </div>

          {/* Headline */}
          <h1 id="hero-heading" className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
            <span className="block">71% of your carbon</span>
            <span className="block">footprint is</span>
            <span className="block mt-2 bg-gradient-to-r from-orange-400 via-red-400 to-orange-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(249,115,22,0.4)]">
              invisible.
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Standard carbon trackers only capture what you can see. Phantom Carbon detects the
            full picture — surface, shadow, and the ghost emissions no one else tracks.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-[0_0_30px_rgba(34,197,94,0.35)] focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e1a] text-lg"
              aria-describedby="cta-desc"
            >
              Start detecting your phantom carbon
              <span aria-hidden="true">→</span>
            </Link>
            <span id="cta-desc" className="sr-only">Create a free account to begin tracking your full carbon footprint</span>
            <p className="text-sm text-gray-600">Free · No credit card · No data sharing</p>
          </div>

          {/* Hero stats */}
          <div className="mt-20 grid grid-cols-3 gap-4 max-w-sm mx-auto" role="img" aria-label="Carbon breakdown: 29% surface, 42% shadow, 29% ghost">
            {[
              { label: 'Surface', value: '29%', color: 'text-green-400', bg: 'bg-green-900/20 border-green-800/50', glow: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]' },
              { label: 'Shadow', value: '42%', color: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-800/50', glow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]' },
              { label: 'Ghost 👻', value: '29%', color: 'text-orange-400', bg: 'bg-orange-900/20 border-orange-800/50', glow: 'hover:shadow-[0_0_20px_rgba(249,115,22,0.2)]' },
            ].map((stat) => (
              <div key={stat.label} className={`${stat.bg} ${stat.glow} border rounded-xl p-4 text-center transition-shadow duration-300`} aria-hidden="true">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Three Layers ── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" aria-labelledby="layers-heading">
          <div className="text-center mb-16">
            <h2 id="layers-heading" className="text-3xl sm:text-4xl font-bold text-white mb-4">
              The Three Carbon Layers
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">Most apps only see the surface. We see all three.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {layers.map((layer) => (
              <article
                key={layer.name}
                className={`${layer.bg} border ${layer.border} ${layer.glow} rounded-2xl p-8 relative overflow-hidden transition-all duration-300 hover:-translate-y-1`}
              >
                {/* Icon with background */}
                <div className={`w-14 h-14 ${layer.iconBg} rounded-2xl flex items-center justify-center text-3xl mb-5`} aria-hidden="true">
                  {layer.icon}
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <h3 className={`text-xl font-bold ${layer.color}`}>{layer.name}</h3>
                  <span className={`${layer.badge} text-xs font-bold px-2 py-0.5 rounded-full`}>{layer.percent}</span>
                </div>

                <p className="text-gray-400 leading-relaxed mb-6 text-sm">{layer.description}</p>

                <ul className="space-y-1.5" aria-label={`${layer.name} examples`}>
                  {layer.examples.map((ex) => (
                    <li key={ex} className="flex items-center gap-2 text-sm text-gray-500">
                      <span className={`w-1.5 h-1.5 rounded-full ${layer.color.replace('text-', 'bg-')}`} aria-hidden="true" />
                      {ex}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" aria-labelledby="how-heading">
          <div className="text-center mb-16">
            <h2 id="how-heading" className="text-3xl sm:text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-lg text-gray-400">Three steps. Zero manual input. Ever.</p>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <li key={step.step} className="relative bg-gray-900/50 border border-gray-800 hover:border-gray-700 rounded-2xl p-8 text-center transition-all duration-200 hover:-translate-y-1">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-gray-700 to-transparent z-10" aria-hidden="true" />
                )}
                <div className="w-16 h-16 bg-gray-800 border border-gray-700 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4" aria-hidden="true">
                  {step.icon}
                </div>
                <div className="text-xs font-mono text-green-500 mb-2 tracking-wider">STEP {step.step}</div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Features ── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" aria-labelledby="features-heading">
          <h2 id="features-heading" className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
            Everything in One Platform
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🤖', title: 'AI Chat', desc: 'Just describe your day — Groq AI extracts every emission automatically.', color: 'green' },
              { icon: '📄', title: 'Receipt Upload', desc: 'Upload a photo or PDF receipt for instant carbon classification.', color: 'blue' },
              { icon: '👻', title: 'Ghost Inferencer', desc: 'AI infers hidden supply-chain and digital emissions from spending patterns.', color: 'orange' },
              { icon: '🔮', title: 'Future Oracle', desc: 'See three personalized 2050 scenarios for your city based on your habits.', color: 'purple' },
              { icon: '📊', title: 'Live Dashboard', desc: 'Real-time three-layer breakdown with animated Ghost Radar and trend analysis.', color: 'green' },
              { icon: '🏆', title: 'Community Board', desc: 'Anonymized leaderboard showing collective impact — privacy-first.', color: 'amber' },
            ].map((feat) => (
              <div key={feat.title} className="group bg-gray-900/50 border border-gray-800 hover:border-gray-700 rounded-xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-200" aria-hidden="true">
                  {feat.icon}
                </div>
                <h3 className="font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Stats band ── */}
        <section className="py-16 px-4 border-y border-gray-800/50 bg-gray-900/20" aria-label="Project statistics">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '3', label: 'Carbon Layers', sub: 'Surface · Shadow · Ghost' },
              { value: '15+', label: 'Emission Factors', sub: 'IPCC AR6 · DEFRA 2023' },
              { value: '151', label: 'Tests Passing', sub: 'Zero failures' },
              { value: '100%', label: 'AI-Powered', sub: 'Groq LLaMA 3.3-70B' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-white font-medium text-sm">{stat.label}</div>
                <div className="text-gray-600 text-xs mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center relative overflow-hidden" aria-labelledby="cta-heading">
          <div className="absolute inset-0 -z-10" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-green-900/20 blur-[80px] rounded-full" />
          </div>
          <h2 id="cta-heading" className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Start seeing what you&apos;ve been missing
          </h2>
          <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto">
            The emissions you don&apos;t see are the hardest to change. Start here.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-10 py-5 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-[0_0_40px_rgba(34,197,94,0.35)] text-xl focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e1a]"
          >
            Create free account →
          </Link>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-800 py-8 px-4 sm:px-6 lg:px-8" role="contentinfo">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-500">
            <span aria-hidden="true">👻</span>
            <span className="text-sm">Phantom Carbon — Built for GDG HackToSkill 2025</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors focus-visible:ring-2 focus-visible:ring-green-500 rounded px-1" aria-label="View source on GitHub (opens in new tab)">
              GitHub
            </a>
            <span aria-hidden="true">·</span>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
