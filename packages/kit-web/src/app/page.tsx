import Link from "next/link";
import Image from "next/image";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Full VCS Engine",
    desc: "Blobs, trees, commits, branches, merging — the complete pipeline built from the ground up.",
    accent: "from-orange-500/20 to-amber-500/20",
    border: "group-hover:border-orange-500/30",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "Powerful CLI",
    desc: "init, add, commit, push, pull, clone, branch, merge, diff — every command you know.",
    accent: "from-indigo-500/20 to-purple-500/20",
    border: "group-hover:border-indigo-500/30",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    title: "Web Platform",
    desc: "Browse repos, view commits, read files with syntax highlighting — full GitHub experience.",
    accent: "from-cyan-500/20 to-teal-500/20",
    border: "group-hover:border-cyan-500/30",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Secure Auth",
    desc: "PBKDF2 password hashing, JWT tokens, and encrypted API access for your repos.",
    accent: "from-green-500/20 to-emerald-500/20",
    border: "group-hover:border-green-500/30",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Lightning Fast",
    desc: "Node.js core with Convex storage. Lightweight, blazing fast, zero heavy databases.",
    accent: "from-yellow-500/20 to-orange-500/20",
    border: "group-hover:border-yellow-500/30",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    title: "One npm Install",
    desc: "npm install -g kitwork — works everywhere. macOS, Linux, Windows.",
    accent: "from-rose-500/20 to-pink-500/20",
    border: "group-hover:border-rose-500/30",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* ─── Hero ─── */}
      <section className="relative pt-36 pb-28 px-4 overflow-hidden">
        {/* Background mesh */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-orange-500/8 rounded-full blur-[180px]" />
          <div className="absolute top-20 right-1/5 w-[500px] h-[500px] bg-indigo-500/6 rounded-full blur-[160px]" />
          <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/5 rounded-full blur-[200px]" />
          {/* Geometric accent */}
          <div className="absolute top-32 right-[15%] w-16 h-16 border border-orange-500/10 rounded-xl rotate-45 animate-float" />
          <div className="absolute top-60 left-[12%] w-10 h-10 border border-indigo-500/15 rounded-lg rotate-12 animate-float" style={{ animationDelay: "2s" }} />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-[var(--kit-surface)]/80 border border-[var(--kit-border)] text-xs tracking-wide mb-10">
            <span className="w-2 h-2 rounded-full bg-[var(--kit-green)] animate-pulse" />
            <span className="text-[var(--kit-text-muted)]">Open Source Version Control</span>
          </div>

          {/* Heading */}
          <h1 className="animate-fade-in-up delay-1 text-5xl sm:text-6xl md:text-8xl font-black tracking-tight mb-6 leading-[0.9]">
            Your code.
            <br />
            <span className="gradient-text">Your Git.</span>
          </h1>

          <p className="animate-fade-in-up delay-2 text-base md:text-lg text-[var(--kit-text-muted)] max-w-xl mx-auto mb-12 leading-relaxed">
            Kitwork is a complete version control system built from scratch.
            Push, pull, branch, and merge — with a beautiful web platform to manage it all.
          </p>

          {/* CTA */}
          <div className="animate-fade-in-up delay-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link
              href="/register"
              className="group w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold transition-all hover:shadow-xl hover:shadow-orange-500/25 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Start Using Kitwork
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/docs"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl glass text-white font-semibold hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              Read the Docs
              <span className="text-[var(--kit-text-muted)]">→</span>
            </Link>
          </div>

          {/* Terminal Preview */}
          <div className="animate-fade-in-up delay-4 max-w-2xl mx-auto">
            <div className="glass-glow rounded-2xl overflow-hidden animate-glow-pulse">
              {/* Tab bar */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--kit-border)] bg-[var(--kit-surface)]/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="ml-4 text-[11px] text-[var(--kit-text-dim)] code-font tracking-wider uppercase">terminal</span>
              </div>
              {/* Body */}
              <div className="p-6 code-font text-sm text-left space-y-1.5 bg-[var(--kit-bg)]/50">
                <div><span className="text-[var(--kit-green)]">❯</span> <span className="text-[var(--kit-cyan)]">kit</span> init</div>
                <div className="text-[var(--kit-text-muted)] pl-4">✓ Initialized empty Kitwork repository in .kit</div>
                <div className="pt-1"><span className="text-[var(--kit-green)]">❯</span> <span className="text-[var(--kit-cyan)]">kit</span> add .</div>
                <div className="text-[var(--kit-text-muted)] pl-4">✓ Staged 12 file(s)</div>
                <div className="pt-1"><span className="text-[var(--kit-green)]">❯</span> <span className="text-[var(--kit-cyan)]">kit</span> commit -m <span className="text-[var(--kit-yellow)]">&quot;first commit&quot;</span></div>
                <div className="text-[var(--kit-text-muted)] pl-4">✓ [<span className="text-[var(--kit-amber)]">a1b2c3d4</span>] first commit</div>
                <div className="pt-1"><span className="text-[var(--kit-green)]">❯</span> <span className="text-[var(--kit-cyan)]">kit</span> push origin main</div>
                <div className="text-[var(--kit-text-muted)] pl-4">✓ Pushed main → origin</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-28 px-4 relative">
        <div className="absolute inset-0 dot-grid pointer-events-none opacity-50" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              Everything you need.{" "}
              <span className="gradient-text">Nothing you don&apos;t.</span>
            </h2>
            <p className="text-[var(--kit-text-muted)] max-w-lg mx-auto">
              Built from scratch with SHA-256 hashing, zlib compression, and content-addressable storage.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className={`group glass-glow rounded-2xl p-6 hover-lift ${f.border} transition-all duration-300`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.accent} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">{f.title}</h3>
                <p className="text-sm text-[var(--kit-text-muted)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Install ─── */}
      <section className="py-28 px-4 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-1/3 w-[500px] h-[300px] bg-indigo-500/5 rounded-full blur-[160px]" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Get started in <span className="gradient-text">30 seconds</span>
          </h2>
          <p className="text-[var(--kit-text-muted)] mb-12">
            Install the CLI, init your repo, and push. That&apos;s it.
          </p>

          <div className="glass-glow rounded-2xl p-8 code-font text-left text-sm space-y-3">
            <div className="text-[var(--kit-text-dim)] text-xs"># Install Kitwork CLI</div>
            <div>
              <span className="text-[var(--kit-green)]">❯</span>{" "}
              <span className="text-white">npm install -g kitwork</span>
            </div>
            <div className="h-px bg-[var(--kit-border)] my-3" />
            <div className="text-[var(--kit-text-dim)] text-xs"># Initialize and push</div>
            <div><span className="text-[var(--kit-green)]">❯</span> <span className="text-[var(--kit-cyan)]">kit</span> init</div>
            <div><span className="text-[var(--kit-green)]">❯</span> <span className="text-[var(--kit-cyan)]">kit</span> add .</div>
            <div><span className="text-[var(--kit-green)]">❯</span> <span className="text-[var(--kit-cyan)]">kit</span> commit -m <span className="text-[var(--kit-yellow)]">&quot;🚀 first commit&quot;</span></div>
            <div><span className="text-[var(--kit-green)]">❯</span> <span className="text-[var(--kit-cyan)]">kit</span> remote add origin <span className="text-[var(--kit-purple)]">https://kitwork.vercel.app/user/repo</span></div>
            <div><span className="text-[var(--kit-green)]">❯</span> <span className="text-[var(--kit-cyan)]">kit</span> push origin main</div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-28 px-4 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-orange-500/8 to-indigo-500/8 rounded-full blur-[200px]" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
            Ready to own your{" "}
            <span className="gradient-text-indigo">version control</span>?
          </h2>
          <p className="text-[var(--kit-text-muted)] text-lg mb-12 max-w-xl mx-auto">
            Join the Kitwork community. Self-host your repos, contribute to the source, or just explore.
          </p>
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-lg transition-all hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5"
          >
            Create Your Account
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[var(--kit-border)] py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Image src="/mascot.png" alt="Kitwork" width={36} height={36} className="w-full h-full object-cover" />
                </div>
                <span className="text-lg font-bold">
                  Kit<span className="text-orange-400">work</span>
                </span>
              </div>
              <p className="text-sm text-[var(--kit-text-muted)] max-w-xs">
                Your code. Your Git. A complete VCS built from scratch.
              </p>
            </div>
            <div className="flex gap-12">
              <div>
                <div className="text-xs font-semibold text-[var(--kit-text-dim)] uppercase tracking-wider mb-3">Product</div>
                <div className="flex flex-col gap-2 text-sm text-[var(--kit-text-muted)]">
                  <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
                  <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
                  <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-[var(--kit-text-dim)] uppercase tracking-wider mb-3">Community</div>
                <div className="flex flex-col gap-2 text-sm text-[var(--kit-text-muted)]">
                  <a href="https://github.com/CoderVLSI/Kitwork" className="hover:text-white transition-colors">GitHub</a>
                  <Link href="/copilot" className="hover:text-white transition-colors">KitBot AI</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-[var(--kit-border)] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[var(--kit-text-dim)]">© 2026 Kitwork. Open source under MIT.</p>
            <p className="text-xs text-[var(--kit-text-dim)]">Built with Convex, Next.js & 🧡</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
