interface MarkdownProps {
    content: string;
}

export default function Markdown({ content }: MarkdownProps) {
    // Simple markdown rendering
    const renderMarkdown = (text: string) => {
        let html = text
            // Escape HTML
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")

            // Code blocks
            .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
                return `<pre class="bg-[var(--kit-bg)] rounded-lg p-4 my-3 overflow-x-auto text-xs"><code class="text-green-400">${code}</code></pre>`;
            })

            // Inline code
            .replace(/`([^`]+)`/g, '<code class="bg-[var(--kit-bg)] px-1.5 py-0.5 rounded text-xs text-orange-400 font-mono">$1</code>')

            // Headings
            .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold text-white mt-4 mb-2">$1</h3>')
            .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-white mt-6 mb-3">$1</h2>')
            .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-white mt-8 mb-4">$1</h1>')

            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

            // Italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')

            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-orange-400 hover:text-orange-300" target="_blank" rel="noopener noreferrer">$1</a>')

            // Line breaks and paragraphs
            .split('\n\n')
            .map(para => `<p class="mb-3 text-sm text-[var(--kit-text)] leading-relaxed">${para}</p>`)
            .join('');

        return html;
    };

    return (
        <div className="prose prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
        </div>
    );
}
