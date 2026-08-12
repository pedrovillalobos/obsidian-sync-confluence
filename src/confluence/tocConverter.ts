const TOC_MARKER = 'CONFLUENCE_TOC';

const TOC_CALLOUT_RE =
	/^>[ \t]*\[!summary\][+-]?[ \t]+目录[ \t]*(?:\r?\n|$)(?:^>[^\r\n]*(?:\r?\n|$))*/gim;

const WIKILINK_HEADING_RE = /\[\[#(?!\^)[^\]\r\n]+\]\]/;
const MARKDOWN_HEADING_RE = /\[[^\]\r\n]+\]\((?:<#[^>\r\n]+>|#[^\s)\r\n]+)\)/;
const TOC_PARAGRAPH_RE = new RegExp(`<p>\\s*${TOC_MARKER}\\s*</p>`, 'g');

const CONFLUENCE_TOC_MACRO =
	'<ac:structured-macro ac:name="toc">' +
	'<ac:parameter ac:name="minLevel">2</ac:parameter>' +
	'<ac:parameter ac:name="maxLevel">3</ac:parameter>' +
	'</ac:structured-macro>';

/**
 * 把 Obsidian 中用于本地阅读的手写目录 callout 换成私有标记。
 *
 * 仅匹配标题为“目录”的 summary callout，且正文必须包含同页标题链接；
 * 这样普通 summary callout 不会被误判。调用方应先屏蔽代码区，避免代码
 * 示例中的 callout 语法被转换。
 */
export function replaceMarkdownTocCallouts(markdown: string): string {
	return markdown.replace(TOC_CALLOUT_RE, (block) => {
		if (!WIKILINK_HEADING_RE.test(block) && !MARKDOWN_HEADING_RE.test(block)) {
			return block;
		}
		const trailingNewline = block.endsWith('\r\n') ? '\r\n' : block.endsWith('\n') ? '\n' : '';
		return TOC_MARKER + trailingNewline;
	});
}

/** 把经 markdown-it 渲染后的目录标记替换成 Confluence 官方 TOC 宏。 */
export function replaceTocMarkersWithMacros(html: string): string {
	return html.replace(TOC_PARAGRAPH_RE, CONFLUENCE_TOC_MACRO);
}
