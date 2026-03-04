interface MarkdownProps {
    content: string;
}

export default function Markdown({ content }: MarkdownProps) {
    const renderMarkdown = (text: string) => {
        // Normalize line endings
        let src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

        // Strip HTML tags (like <div>, </div>, etc.)
        src = src.replace(/<\/?[^>]+(>|$)/g, "");

        // Code blocks — extract first to protect from further processing
        const codeBlocks: string[] = [];
        src = src.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
            const idx = codeBlocks.length;
            codeBlocks.push(
                `<pre class="bg-[var(--kit-bg)] rounded-lg p-4 my-3 overflow-x-auto text-xs border border-[var(--kit-border)]"><code class="text-green-400">${escapeHtml(code.trimEnd())}</code></pre>`
            );
            return `%%CODEBLOCK_${idx}%%`;
        });

        // Process line by line
        const lines = src.split("\n");
        const output: string[] = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];

            // --- Tables ---
            if (line.includes("|") && i + 1 < lines.length && /^\|?[\s:]*-+[\s:]*(\|[\s:]*-+[\s:]*)*\|?$/.test(lines[i + 1])) {
                const tableLines: string[] = [];
                while (i < lines.length && lines[i].includes("|")) {
                    tableLines.push(lines[i]);
                    i++;
                }
                output.push(renderTable(tableLines));
                continue;
            }

            // --- Horizontal rule ---
            if (/^(\s*[-*_]\s*){3,}$/.test(line)) {
                output.push('<hr class="border-t border-[var(--kit-border)] my-6" />');
                i++;
                continue;
            }

            // --- Headings ---
            const h3 = line.match(/^### (.+)/);
            if (h3) { output.push(`<h3 class="text-lg font-bold text-white mt-5 mb-2">${inline(h3[1])}</h3>`); i++; continue; }
            const h2 = line.match(/^## (.+)/);
            if (h2) { output.push(`<h2 class="text-xl font-bold text-white mt-6 mb-3">${inline(h2[1])}</h2>`); i++; continue; }
            const h1 = line.match(/^# (.+)/);
            if (h1) { output.push(`<h1 class="text-2xl font-bold text-white mt-8 mb-4">${inline(h1[1])}</h1>`); i++; continue; }

            // --- Unordered list ---
            if (/^[\s]*[-*+] /.test(line)) {
                const items: string[] = [];
                while (i < lines.length && /^[\s]*[-*+] /.test(lines[i])) {
                    items.push(lines[i].replace(/^[\s]*[-*+] /, ""));
                    i++;
                }
                output.push(`<ul class="list-disc list-inside space-y-1 my-3 text-sm text-[var(--kit-text)] pl-2">${items.map(it => `<li>${inline(it)}</li>`).join("")}</ul>`);
                continue;
            }

            // --- Ordered list ---
            if (/^\s*\d+\. /.test(line)) {
                const items: string[] = [];
                while (i < lines.length && /^\s*\d+\. /.test(lines[i])) {
                    items.push(lines[i].replace(/^\s*\d+\. /, ""));
                    i++;
                }
                output.push(`<ol class="list-decimal list-inside space-y-1 my-3 text-sm text-[var(--kit-text)] pl-2">${items.map(it => `<li>${inline(it)}</li>`).join("")}</ol>`);
                continue;
            }

            // --- Blockquote ---
            if (line.startsWith("> ")) {
                const bqLines: string[] = [];
                while (i < lines.length && lines[i].startsWith("> ")) {
                    bqLines.push(lines[i].slice(2));
                    i++;
                }
                output.push(`<blockquote class="border-l-4 border-orange-500/50 pl-4 my-3 text-sm text-[var(--kit-text-muted)] italic">${bqLines.map(l => inline(l)).join("<br/>")}</blockquote>`);
                continue;
            }

            // --- Code block placeholder ---
            const cbMatch = line.match(/^%%CODEBLOCK_(\d+)%%$/);
            if (cbMatch) {
                output.push(codeBlocks[parseInt(cbMatch[1])]);
                i++;
                continue;
            }

            // --- Empty line ---
            if (line.trim() === "") {
                i++;
                continue;
            }

            // --- Paragraph ---
            const paraLines: string[] = [];
            while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("#") && !lines[i].startsWith(">") && !/^[\s]*[-*+] /.test(lines[i]) && !/^\s*\d+\. /.test(lines[i]) && !/^(\s*[-*_]\s*){3,}$/.test(lines[i]) && !lines[i].match(/^%%CODEBLOCK_\d+%%$/) && !(lines[i].includes("|") && i + 1 < lines.length && lines[i + 1] && /^\|?[\s:]*-+/.test(lines[i + 1]))) {
                paraLines.push(lines[i]);
                i++;
            }
            if (paraLines.length > 0) {
                output.push(`<p class="mb-3 text-sm text-[var(--kit-text)] leading-relaxed">${inline(paraLines.join(" "))}</p>`);
            }
        }

        return output.join("\n");
    };

    return (
        <div className="prose prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
        </div>
    );
}

function escapeHtml(str: string): string {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Inline formatting: bold, italic, code, links, images */
function inline(text: string): string {
    return escapeHtml(text)
        // Images
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg max-w-full my-2" />')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-orange-400 hover:text-orange-300" target="_blank" rel="noopener noreferrer">$1</a>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code class="bg-[var(--kit-bg)] px-1.5 py-0.5 rounded text-xs text-orange-400 font-mono">$1</code>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        // Italic
        .replace(/\*(.*?)\*/g, "<em>$1</em>");
}

/** Render a markdown table */
function renderTable(lines: string[]): string {
    const parseRow = (line: string) =>
        line.split("|").map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - (line.endsWith("|") ? 1 : 0) || (!line.startsWith("|") && i >= 0));

    const cleanRow = (line: string) => {
        const cells = line.split("|").map(c => c.trim());
        // Remove empty first/last from leading/trailing pipes
        if (cells[0] === "") cells.shift();
        if (cells[cells.length - 1] === "") cells.pop();
        return cells;
    };

    if (lines.length < 2) return "";

    const headerCells = cleanRow(lines[0]);
    const bodyRows = lines.slice(2); // skip header + separator

    let html = '<div class="overflow-x-auto my-4"><table class="w-full text-sm border-collapse">';
    html += '<thead><tr class="border-b border-[var(--kit-border)]">';
    for (const cell of headerCells) {
        html += `<th class="text-left px-3 py-2 text-[var(--kit-text-muted)] font-semibold text-xs uppercase tracking-wider">${inline(cell)}</th>`;
    }
    html += "</tr></thead><tbody>";

    for (const row of bodyRows) {
        if (!row.includes("|")) continue;
        const cells = cleanRow(row);
        html += '<tr class="border-b border-[var(--kit-border)]/50 hover:bg-white/[0.02]">';
        for (const cell of cells) {
            html += `<td class="px-3 py-2 text-[var(--kit-text)]">${inline(cell)}</td>`;
        }
        html += "</tr>";
    }

    html += "</tbody></table></div>";
    return html;
}
