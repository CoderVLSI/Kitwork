import {
    AbsoluteFill,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";

// Kitwork brand colors
const ORANGE = "#f97316";
const BLUE = "#3b82f6";
const DARK = "#0a0a0f";
const TEXT = "#e4e4ef";

// Animated text component
const Title: React.FC<{
    children: React.ReactNode;
    frame: number;
    delay?: number;
}> = ({ children, frame, delay = 0 }) => {
    const opacity = spring({
        frame: frame - delay,
        fps: 30,
        config: {
            damping: 10,
            stiffness: 100,
        },
    });

    const scale = spring({
        frame: frame - delay,
        fps: 30,
        config: {
            damping: 15,
            stiffness: 200,
        },
    });

    return (
        <div
            style={{
                opacity,
                transform: `scale(${scale})`,
                color: TEXT,
                fontSize: 80,
                fontWeight: "bold",
                textAlign: "center",
            }}
        >
            {children}
        </div>
    );
};

// Fade in component
const FadeIn: React.FC<{
    children: React.ReactNode;
    frame: number;
    from: number;
    duration: number;
}> = ({ children, frame, from, duration }) => {
    const opacity = interpolate(frame, [from, from + duration], [0, 1], {
        extrapolateRight: "clamp",
    });

    return (
        <div
            style={{
                opacity,
                width: "100%",
                height: "100%",
            }}
        >
            {children}
        </div>
    );
};

// Feature card component
const FeatureCard: React.FC<{
    title: string;
    description: string;
    icon: string;
    frame: number;
    delay: number;
}> = ({ title, description, icon, frame, delay }) => {
    const y = spring({
        frame: frame - delay,
        fps: 30,
        config: {
            damping: 12,
            stiffness: 100,
        },
    });

    return (
        <div
            style={{
                transform: `translateY(${80 - y * 80}px)`,
                backgroundColor: "rgba(249, 115, 22, 0.1)",
                border: `2px solid ${ORANGE}`,
                borderRadius: 20,
                padding: 40,
                margin: 20,
            }}
        >
            <div style={{ fontSize: 48, marginBottom: 20 }}>{icon}</div>
            <h2 style={{ color: ORANGE, fontSize: 32, marginBottom: 10, fontWeight: "bold" }}>
                {title}
            </h2>
            <p style={{ color: TEXT, fontSize: 20, lineHeight: 1.5 }}>{description}</p>
        </div>
    );
};

// Code snippet animation
const CodeSnippet: React.FC<{
    code: string;
    frame: number;
    delay: number;
}> = ({ code, frame, delay }) => {
    const progress = spring({
        frame: frame - delay,
        fps: 30,
        config: {
            damping: 10,
            stiffness: 80,
        },
    });

    const lines = code.split("\n");
    const visibleLines = Math.floor(progress * lines.length);

    return (
        <div
            style={{
                backgroundColor: "#1a1a26",
                border: `1px solid ${ORANGE}`,
                borderRadius: 10,
                padding: 20,
                fontFamily: "monospace",
                fontSize: 18,
                color: TEXT,
            }}
        >
            {lines.slice(0, visibleLines).map((line, i) => (
                <div key={i} style={{ marginBottom: 5 }}>
                    <span style={{ color: "#8888a0", marginRight: 15 }}>{i + 1}</span>
                    {line}
                </div>
            ))}
        </div>
    );
};

export const MarketingVideo: React.FC<{ title: string }> = ({ title }) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    // Scene transitions
    const scene1End = 180;
    const scene2End = 450;
    const scene3End = 630;

    // Determine which scene to show
    const scene = frame < scene1End ? 1 : frame < scene2End ? 2 : frame < scene3End ? 3 : 4;

    return (
        <AbsoluteFill style={{ backgroundColor: DARK }}>
            {/* Scene 1: Hero Intro (0-6 seconds) */}
            {scene === 1 && (
                <AbsoluteFill
                    style={{
                        background: `linear-gradient(135deg, ${DARK} 0%, #1a1a26 100%)`,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <div style={{ textAlign: "center" }}>
                        {/* KitBot icon animation */}
                        <div
                            style={{
                                fontSize: 120,
                                marginBottom: 30,
                            }}
                        >
                            🐱‍🏗️
                        </div>

                        {/* Main title */}
                        <Title frame={frame} delay={10}>
                            {title}
                        </Title>

                        {/* Subtitle */}
                        <FadeIn frame={frame} from={60} duration={60}>
                            <h2
                                style={{
                                    color: ORANGE,
                                    fontSize: 48,
                                    marginTop: 20,
                                    fontWeight: "600",
                                }}
                            >
                                Build Faster. Ship Smarter.
                            </h2>
                        </FadeIn>

                        {/* Tagline */}
                        <FadeIn frame={frame} from={100} duration={60}>
                            <p
                                style={{
                                    color: "#8888a0",
                                    fontSize: 28,
                                    marginTop: 30,
                                }}
                            >
                                The modern code hosting platform for developers
                            </p>
                        </FadeIn>
                    </div>
                </AbsoluteFill>
            )}

            {/* Scene 2: Features Showcase (6-15 seconds) */}
            {scene === 2 && (
                <AbsoluteFill
                    style={{
                        background: `linear-gradient(135deg, ${DARK} 0%, #0f0a0a 100%)`,
                        padding: 80,
                        justifyContent: "center",
                    }}
                >
                    <h1
                        style={{
                            color: TEXT,
                            fontSize: 64,
                            fontWeight: "bold",
                            textAlign: "center",
                            marginBottom: 60,
                        }}
                    >
                        Everything You Need
                    </h1>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: 40,
                            maxWidth: 1600,
                            margin: "0 auto",
                        }}
                    >
                        <FeatureCard
                            title="⚡ Sparks"
                            description="React with emojis - more expressive than stars"
                            icon="⚡"
                            frame={frame}
                            delay={180 + 20}
                        />
                        <FeatureCard
                            title="👥 Crew"
                            description="Follow developers and build your network"
                            icon="👥"
                            frame={frame}
                            delay={180 + 40}
                        />
                        <FeatureCard
                            title="🧵 Threads"
                            description="Rich discussions with markdown support"
                            icon="🧵"
                            frame={frame}
                            delay={180 + 60}
                        />
                        <FeatureCard
                            title="🩹 Patches"
                            description="Easy pull requests with branch management"
                            icon="🩹"
                            frame={frame}
                            delay={180 + 80}
                        />
                    </div>
                </AbsoluteFill>
            )}

            {/* Scene 3: Code Demo (15-21 seconds) */}
            {scene === 3 && (
                <AbsoluteFill
                    style={{
                        background: DARK,
                        padding: 80,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <h2
                        style={{
                            color: ORANGE,
                            fontSize: 56,
                            marginBottom: 40,
                            fontWeight: "bold",
                        }}
                    >
                        Simple. Fast. Powerful.
                    </h2>

                    <CodeSnippet
                        frame={frame}
                        delay={450 + 30}
                        code={`# Clone a repository
kit clone username/project

# Create a new file
kit files create src/app.tsx

# Commit changes
kit commit "Add new feature"

# Push to remote
kit push`}
                    />
                </AbsoluteFill>
            )}

            {/* Scene 4: Call to Action (21-30 seconds) */}
            {scene === 4 && (
                <AbsoluteFill
                    style={{
                        background: `linear-gradient(135deg, ${BLUE} 0%, ${ORANGE} 100%)`,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <div style={{ textAlign: "center" }}>
                        <h1
                            style={{
                                color: "white",
                                fontSize: 80,
                                fontWeight: "bold",
                                marginBottom: 30,
                            }}
                        >
                            Start Building Today
                        </h1>

                        <p
                            style={{
                                color: "rgba(255,255,255,0.9)",
                                fontSize: 32,
                                marginBottom: 50,
                            }}
                        >
                            Join thousands of developers shipping faster
                        </p>

                        <div
                            style={{
                                backgroundColor: "white",
                                color: ORANGE,
                                padding: "20px 60px",
                                borderRadius: 50,
                                fontSize: 28,
                                fontWeight: "bold",
                                display: "inline-block",
                            }}
                        >
                            Get Started Free →
                        </div>

                        <p
                            style={{
                                color: "rgba(255,255,255,0.7)",
                                fontSize: 24,
                                marginTop: 40,
                            }}
                        >
                            kitwork.dev
                        </p>
                    </div>
                </AbsoluteFill>
            )}
        </AbsoluteFill>
    );
};
