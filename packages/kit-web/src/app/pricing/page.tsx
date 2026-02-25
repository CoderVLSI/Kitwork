import Link from "next/link";

export default function PricingPage() {
    return (
        <div className="min-h-screen pt-24 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-14">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-purple-300 mb-4">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        Simple Pricing
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                        Choose Your Plan
                    </h1>
                    <p className="text-[var(--kit-text-muted)] text-lg max-w-xl mx-auto">
                        Start free, scale when you need. No hidden fees, cancel anytime.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {/* Free Plan */}
                    <div className="glass rounded-2xl p-8 border border-[var(--kit-border)]">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">Free</h3>
                            <p className="text-sm text-[var(--kit-text-muted)]">Perfect for getting started</p>
                        </div>
                        <div className="mb-6">
                            <span className="text-4xl font-black text-white">$0</span>
                            <span className="text-[var(--kit-text-muted)]">/month</span>
                        </div>
                        <ul className="space-y-3 mb-8">
                            {[
                                "Unlimited public repositories",
                                "Unlimited private repositories",
                                "Full Git commands (push, pull, branch, merge)",
                                "Complete web interface",
                                "Community support",
                            ].map((feature, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-[var(--kit-text)]">
                                    <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <Link
                            href="/register"
                            className="block w-full py-3 rounded-xl bg-[var(--kit-bg)] border border-[var(--kit-border)] text-white font-semibold text-center hover:bg-white/5 transition-all"
                        >
                            Get Started Free
                        </Link>
                    </div>

                    {/* Pro Plan */}
                    <div className="relative glass rounded-2xl p-8 border-2 border-purple-500/50 glow-purple">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-semibold">
                            Coming Soon
                        </div>
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
                            <p className="text-sm text-[var(--kit-text-muted)]">For power users and teams</p>
                        </div>
                        <div className="mb-6">
                            <span className="text-4xl font-black gradient-text">$2</span>
                            <span className="text-[var(--kit-text-muted)]">/month</span>
                        </div>
                        <ul className="space-y-3 mb-8">
                            {[
                                "Everything in Free",
                                "Collaborators (share repos with team)",
                                "Protected branches",
                                "Pull requests & code review",
                                "Priority support",
                                "CI/CD integrations",
                                "Advanced analytics",
                            ].map((feature, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-[var(--kit-text)]">
                                    <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <button
                            disabled
                            className="block w-full py-3 rounded-xl bg-purple-600/50 text-white/70 font-semibold text-center cursor-not-allowed border border-purple-500/30"
                        >
                            Coming Soon
                        </button>
                    </div>
                </div>

                {/* FAQ */}
                <div className="mt-20">
                    <h2 className="text-2xl font-bold text-white text-center mb-10">Frequently Asked Questions</h2>
                    <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                        {[
                            {
                                q: "Is Kitwork really free forever?",
                                a: "Yes! The Free plan has unlimited repositories and will remain free forever. We believe version control should be accessible to everyone.",
                            },
                            {
                                q: "What's included in the Pro plan?",
                                a: "Pro adds team collaboration features like shared repositories, pull requests, protected branches, and priority support. Perfect for teams working together.",
                            },
                            {
                                q: "Can I self-host Kitwork?",
                                a: "Absolutely! Kitwork is open source. You can run your own instance on your own server for full control over your code.",
                            },
                            {
                                q: "How does this compare to GitHub?",
                                a: "Kitwork is a complete version control system built from scratch. It has all the core Git commands you know, with a beautiful web interface. Plus, it's open source!",
                            },
                        ].map((faq, i) => (
                            <div key={i} className="glass rounded-xl p-5">
                                <h3 className="text-sm font-semibold text-white mb-2">{faq.q}</h3>
                                <p className="text-sm text-[var(--kit-text-muted)] leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-16 text-center">
                    <p className="text-[var(--kit-text-muted)] mb-4">Ready to get started?</p>
                    <Link
                        href="/register"
                        className="inline-block px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/25"
                    >
                        Create Free Account
                    </Link>
                </div>
            </div>
        </div>
    );
}
