import Link from "next/link";
import Image from "next/image";

const features = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Full VCS Engine",
    desc: "Blobs, trees, commits, branches, merging — the complete pipeline built from the ground up with SHA-256.",
    color: "text-orange-400",
    glow: "bg-orange-500/10",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "Powerful CLI",
    desc: "init, add, commit, push, pull, clone, branch, merge, diff — every Git command you know and love.",
    color: "text-indigo-400",
    glow: "bg-indigo-500/10",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    title: "Web Platform",
    desc: "Browse repos, view commits, read files with syntax highlighting — a full GitHub-like experience.",
    color: "text-cyan-400",
    glow: "bg-cyan-500/10",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Secure by Default",
    desc: "PBKDF2 password hashing, JWT authentication, and encrypted API access for all your repositories.",
    color: "text-green-400",
    glow: "bg-green-500/10",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Lightning Fast",
    desc: "Built on Node.js with Convex backend. Lightweight, blazing fast, zero heavy database required.",
    color: "text-yellow-400",
    glow: "bg-yellow-500/10",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: "AI Copilot Built-in",
    desc: "KitBot AI assistant powered by Gemini. Ask about your code, get suggestions, right inside the platform.",
    color: "text-purple-400",
    glow: "bg-purple-500/10",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* ━━━ HERO ━━━ */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4">
        {/* Animated grid */}
        <div className="absolute inset-0 hero-grid" />

        {/* Animated gradient orbs */}
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-orange-500/15 gradient-orb" />
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-indigo-600/12 gradient-orb" style={{ animationDelay: "3s" }} />
        <div className="absolute bottom-[10%] left-[40%] w-[600px] h-[300px] bg-amber-500/8 gradient-orb" style={{ animationDelay: "5s" }} />

        {/* Floating decorative shapes */}
        <div className="absolute top-[25%] right-[18%] w-20 h-20 border border-indigo-500/20 rounded-2xl rotate-12 animate-float" />
        <div className="absolute bottom-[30%] left-[10%] w-14 h-14 border border-orange-500/15 rounded-xl -rotate-12 animate-float" style={{ animationDelay: "3s" }} />
        <div className="absolute top-[60%] right-[8%] w-8 h-8 bg-indigo-500/20 rounded-lg rotate-45 animate-float" style={{ animationDelay: "1.5s" }} />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-[var(--kit-border)] bg-[var(--kit-surface)]/60 backdrop-blur-xl text-xs tracking-widest uppercase mb-10">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
            </span>
            <span className="text-[var(--kit-text-muted)] font-medium">Open Source Version Control</span>
          </div>

          {/* Heading — dramatically large */}
          <h1 className="animate-fade-in-up delay-1 text-6xl sm:text-7xl md:text-[6.5rem] font-black tracking-tighter mb-8 leading-[0.85]">
            <span className="block text-white">Your code.</span>
            <span className="block gradient-text mt-2">Your Git.</span>
          </h1>

          <p className="animate-fade-in-up delay-2 text-lg md:text-xl text-[var(--kit-text-muted)] max-w-2xl mx-auto mb-14 leading-relaxed font-light">
            A complete version control system built from scratch.
            Push, pull, branch, merge — with a stunning web platform.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up delay-3 flex flex-col sm:flex-row items-center justify-center gap-5 mb-24">
            <Link
              href="/register"
              className="group w-full sm:w-auto px-10 py-4.5 rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white font-bold text-base transition-all hover:shadow-2xl hover:shadow-orange-500/30 hover:-translate-y-1 flex items-center justify-center gap-3"
            >
              Start Using Kitwork
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/docs"
              className="w-full sm:w-auto px-10 py-4.5 rounded-2xl border border-[var(--kit-border)] bg-[var(--kit-surface)]/50 backdrop-blur text-white font-semibold hover:border-[var(--kit-text-muted)] hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              Read the Docs
              <span className="text-[var(--kit-text-dim)]">→</span>
            </Link>
          </div>

          {/* Terminal Preview — enhanced */}
          <div className="animate-fade-in-up delay-4 max-w-2xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden animate-glow-pulse">
              {/* Glowing border effect */}
              <div className="absolute -inset-[1px] bg-gradient-to-b from-orange-500/20 via-transparent to-indigo-500/10 rounded-2xl pointer-events-none" />
              <div className="relative bg-[var(--kit-surface)] rounded-2xl overflow-hidden border border-[var(--kit-border)]">
                {/* Tab bar */}
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[var(--kit-border)] bg-[var(--kit-bg)]/80">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  </div>
                  <span className="ml-4 text-[10px] text-[var(--kit-text-dim)] code-font tracking-[0.2em] uppercase">terminal — zsh</span>
                </div>
                {/* Body */}
                <div className="p-7 code-font text-[13px] text-left space-y-2.5">
                  <div><span className="text-[var(--kit-green)]">❯</span> <span className="text-[var(--kit-cyan)]">kit</span> <span className="text-white">init</span></div>
                  <div className="text-[var(--kit-text-muted)] pl-5 text-xs">✓ Initialized empty Kitwork repository in .kit</div>
                  <div className="pt-1"><span className="text-[var(--kit-green)]">❯</span> <span className="text-[var(--kit-cyan)]">kit</span> <span className="text-white">add .</span></div>
                  <div className="text-[var(--kit-text-muted)] pl-5 text-xs">✓ Staged 12 file(s)</div>
                  <div className="pt-1"><span className="text-[var(--kit-green)]">❯</span> <span className="text-[var(--kit-cyan)]">kit</span> <span className="text-white">commit</span> -m <span className="text-[var(--kit-yellow)]">&quot;first commit&quot;</span></div>
                  <div className="text-[var(--kit-text-muted)] pl-5 text-xs">✓ [<span className="text-[var(--kit-amber)]">a1b2c3d4</span>] first commit</div>
                  <div className="pt-1"><span className="text-[var(--kit-green)]">❯</span> <span className="text-[var(--kit-cyan)]">kit</span> <span className="text-white">push</span> origin main</div>
                  <div className="text-[var(--kit-text-muted)] pl-5 text-xs">✓ Pushed <span className="text-[var(--kit-green)]">main</span> → <span className="text-[var(--kit-purple)]">origin</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ FEATURES ━━━ */}
      <section className="py-32 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-xs font-semibold text-[var(--kit-indigo)] tracking-[0.3em] uppercase mb-4">Features</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-5">
              Everything you need.
              <br />
              <span className="gradient-text">Nothing you don&apos;t.</span>
            </h2>
            <p className="text-[var(--kit-text-muted)] max-w-lg mx-auto text-lg font-light">
              Built from scratch with SHA-256, zlib compression, and content-addressable storage.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="group rounded-2xl p-7 feature-card cursor-default"
              >
                <div className={`w-12 h-12 rounded-xl ${f.glow} flex items-center justify-center ${f.color} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold mb-2 text-white tracking-tight">{f.title}</h3>
                <p className="text-sm text-[var(--kit-text-muted)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ INSTALL ━━━ */}
      <section className="py-32 px-4 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-1/3 w-[600px] h-[400px] bg-indigo-500/6 gradient-orb" style={{ animationDelay: "2s" }} />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <p className="text-xs font-semibold text-orange-400 tracking-[0.3em] uppercase mb-4">Quick Start</p>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-5">
            Ready in <span className="gradient-text">30 seconds</span>
          </h2>
          <p className="text-[var(--kit-text-muted)] mb-14 text-lg font-light">
            Install the CLI, initialize, and push. That&apos;s it.
          </p>

          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute -inset-[1px] bg-gradient-to-br from-indigo-500/15 via-transparent to-orange-500/15 rounded-2xl pointer-events-none" />
            <div className="relative bg-[var(--kit-surface)] border border-[var(--kit-border)] rounded-2xl p-8 code-font text-left text-sm space-y-3">
              <div className="text-[var(--kit-text-dim)] text-xs"># Install Kitwork CLI</div>
              <div>
                <span className="text-[var(--kit-green)]">❯</span>{" "}
                <span className="text-white">npm install -g kitwork</span>
              </div>
              <div className="h-px bg-[var(--kit-border)] my-4" />
              <div className="text-[var(--kit-text-dim)] text-xs"># Initialize and push</div>
              <div><span className="text-[var(--kit-green)]">❯</span> <span className="text-[var(--kit-cyan)]">kit</span> init</div>
              <div><span className="text-[var(--kit-green)]">❯</span> <span className="text-[var(--kit-cyan)]">kit</span> add .</div>
              <div><span className="text-[var(--kit-green)]">❯</span> <span className="text-[var(--kit-cyan)]">kit</span> commit -m <span className="text-[var(--kit-yellow)]">&quot;🚀 first commit&quot;</span></div>
              <div><span className="text-[var(--kit-green)]">❯</span> <span className="text-[var(--kit-cyan)]">kit</span> remote add origin <span className="text-[var(--kit-purple)]">https://kitwork.vercel.app/user/repo</span></div>
              <div><span className="text-[var(--kit-green)]">❯</span> <span className="text-[var(--kit-cyan)]">kit</span> push origin main</div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ CTA ━━━ */}
      <section className="py-32 px-4 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-orange-500/6 via-indigo-500/6 to-orange-500/6 gradient-orb" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tight leading-[0.9]">
            Ready to own your
            <br />
            <span className="gradient-text-indigo">version control</span>?
          </h2>
          <p className="text-[var(--kit-text-muted)] text-xl mb-14 max-w-xl mx-auto font-light">
            Join the Kitwork community. Self-host, contribute, or just explore.
          </p>
          <Link
            href="/register"
            className="group inline-flex items-center gap-3 px-12 py-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-500 text-white font-bold text-lg transition-all hover:shadow-2xl hover:shadow-indigo-500/25 hover:-translate-y-1"
          >
            Create Your Account
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="border-t border-[var(--kit-border)] py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/20">
                  <Image src="/mascot.png" alt="Kitwork" width={40} height={40} className="w-full h-full object-cover" />
                </div>
                <span className="text-xl font-black">
                  Kit<span className="text-orange-400">work</span>
                </span>
              </div>
              <p className="text-sm text-[var(--kit-text-muted)] max-w-xs leading-relaxed">
                Your code. Your Git. A complete version control system built from scratch with love.
              </p>
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--kit-text-dim)] uppercase tracking-[0.2em] mb-4">Product</div>
              <div className="flex flex-col gap-2.5 text-sm text-[var(--kit-text-muted)]">
                <Link href="/explore" className="hover:text-white transition-colors w-fit">Explore</Link>
                <Link href="/docs" className="hover:text-white transition-colors w-fit">Documentation</Link>
                <Link href="/pricing" className="hover:text-white transition-colors w-fit">Pricing</Link>
                <Link href="/copilot" className="hover:text-white transition-colors w-fit">KitBot AI</Link>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--kit-text-dim)] uppercase tracking-[0.2em] mb-4">Community</div>
              <div className="flex flex-col gap-2.5 text-sm text-[var(--kit-text-muted)]">
                <a href="https://github.com/CoderVLSI/Kitwork" className="hover:text-white transition-colors w-fit">GitHub</a>
                <Link href="/register" className="hover:text-white transition-colors w-fit">Join Community</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-[var(--kit-border)] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[var(--kit-text-dim)]">© 2026 Kitwork. Open source under MIT License.</p>
            <p className="text-xs text-[var(--kit-text-dim)]">Built with Convex, Next.js & 🧡</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
