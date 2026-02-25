import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[128px]" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[128px]" />
          <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-yellow-500/5 rounded-full blur-[128px]" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-orange-300 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Open Source Version Control
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
            Your code.
            <br />
            <span className="gradient-text">Your Git.</span>
          </h1>

          <p className="text-lg md:text-xl text-[var(--kit-text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Kitwork is a complete version control system built from scratch.
            Push, pull, branch, and merge — with a beautiful web interface to manage it all.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold transition-all hover:shadow-xl hover:shadow-orange-500/25 hover:-translate-y-0.5"
            >
              Start Using Kitwork
            </Link>
            <Link
              href="/docs"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl glass text-white font-semibold hover:bg-white/5 transition-all"
            >
              Read the Docs →
            </Link>
          </div>

          {/* Terminal Preview */}
          <div className="max-w-2xl mx-auto glow-orange rounded-2xl overflow-hidden">
            <div className="glass rounded-2xl overflow-hidden">
              {/* Terminal Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--kit-border)]">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-3 text-xs text-[var(--kit-text-muted)] code-font">terminal</span>
              </div>
              {/* Terminal Body */}
              <div className="p-6 code-font text-sm text-left space-y-2">
                <div>
                  <span className="text-green-400">$</span>{" "}
                  <span className="text-cyan-300">kit</span> init
                </div>
                <div className="text-[var(--kit-text-muted)]">
                  ✓ Initialized empty Kitwork repository in .kit
                </div>
                <div className="mt-2">
                  <span className="text-green-400">$</span>{" "}
                  <span className="text-cyan-300">kit</span> add .
                </div>
                <div className="text-[var(--kit-text-muted)]">
                  ✓ Staged 12 file(s)
                </div>
                <div className="mt-2">
                  <span className="text-green-400">$</span>{" "}
                  <span className="text-cyan-300">kit</span> commit -m{" "}
                  <span className="text-yellow-300">&quot;first commit&quot;</span>
                </div>
                <div className="text-[var(--kit-text-muted)]">
                  ✓ [<span className="text-yellow-400">a1b2c3d4</span>] first commit
                </div>
                <div className="mt-2">
                  <span className="text-green-400">$</span>{" "}
                  <span className="text-cyan-300">kit</span> push origin main
                </div>
                <div className="text-[var(--kit-text-muted)]">
                  ✓ Pushed main → origin
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need. <span className="gradient-text">Nothing you don&apos;t.</span>
            </h2>
            <p className="text-[var(--kit-text-muted)] max-w-xl mx-auto">
              Built from scratch with SHA-256 hashing, zlib compression, and content-addressable storage — just like Git.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "🔧",
                title: "Full VCS Engine",
                desc: "Blobs, trees, commits, branches, merging — the complete version control pipeline built from the ground up.",
              },
              {
                icon: "💻",
                title: "Powerful CLI",
                desc: "kit init, add, commit, push, pull, clone, branch, merge, diff — every command you know and love.",
              },
              {
                icon: "🌐",
                title: "Web Platform",
                desc: "Browse repos, view commits, read files with syntax highlighting — a full GitHub-like experience.",
              },
              {
                icon: "🔐",
                title: "JWT Auth",
                desc: "Secure user authentication with encrypted passwords and token-based API access.",
              },
              {
                icon: "⚡",
                title: "Lightning Fast",
                desc: "Lightweight Node.js implementation with SQLite storage. No heavy databases required.",
              },
              {
                icon: "📦",
                title: "npm Install",
                desc: "Install with a single command: npm install -g kitwork. Works on any platform.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group glass rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-sm text-[var(--kit-text-muted)] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Install Section */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get started in <span className="gradient-text">30 seconds</span>
          </h2>
          <p className="text-[var(--kit-text-muted)] mb-10">
            Install the CLI, init your repo, and push. It&apos;s that simple.
          </p>

          <div className="glass rounded-2xl p-8 code-font text-left text-sm space-y-4">
            <div className="text-[var(--kit-text-muted)]"># Install Kitwork CLI</div>
            <div>
              <span className="text-green-400">$</span>{" "}
              <span className="text-white">npm install -g kitwork</span>
            </div>
            <div className="h-px bg-[var(--kit-border)]" />
            <div className="text-[var(--kit-text-muted)]"># Initialize and push</div>
            <div>
              <span className="text-green-400">$</span> <span className="text-cyan-300">kit</span> init
            </div>
            <div>
              <span className="text-green-400">$</span> <span className="text-cyan-300">kit</span> add .
            </div>
            <div>
              <span className="text-green-400">$</span> <span className="text-cyan-300">kit</span> commit -m{" "}
              <span className="text-yellow-300">&quot;🚀 first commit&quot;</span>
            </div>
            <div>
              <span className="text-green-400">$</span> <span className="text-cyan-300">kit</span> remote add origin{" "}
              <span className="text-purple-300">http://localhost:4000/user/my-repo</span>
            </div>
            <div>
              <span className="text-green-400">$</span> <span className="text-cyan-300">kit</span> push origin main
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Ready to own your <span className="gradient-text">version control</span>?
          </h2>
          <p className="text-[var(--kit-text-muted)] text-lg mb-10 max-w-xl mx-auto">
            Join the Kitwork community. Self-host your repos, contribute to the source, or just explore.
          </p>
          <Link
            href="/register"
            className="inline-block px-10 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg transition-all hover:shadow-xl hover:shadow-purple-500/25 hover:-translate-y-0.5"
          >
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--kit-border)] py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Image
                src="/mascot.png"
                alt="Kitwork Mascot"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm font-bold">
              Kit<span className="text-orange-400">work</span>
            </span>
          </div>
          <div className="flex gap-6 text-sm text-[var(--kit-text-muted)]">
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <a href="https://github.com" className="hover:text-white transition-colors">GitHub</a>
          </div>
          <p className="text-xs text-[var(--kit-text-muted)]">
            © 2026 Kitwork. Open source under MIT.
          </p>
        </div>
      </footer>
    </div>
  );
}
