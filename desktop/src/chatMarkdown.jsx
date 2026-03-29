import React from "react";

function normalizeMarkdownSource(text = "") {
  return String(text || "").replace(/\r\n?/g, "\n");
}

function isBlankLine(line = "") {
  return !String(line || "").trim();
}

function parseListMarker(line = "") {
  const orderedMatch = /^(\s*)(\d+)\.\s+(.*)$/.exec(line);
  if (orderedMatch) {
    return {
      kind: "ol",
      indent: orderedMatch[1].length,
      content: orderedMatch[3],
    };
  }
  const unorderedMatch = /^(\s*)[-*+]\s+(.*)$/.exec(line);
  if (unorderedMatch) {
    return {
      kind: "ul",
      indent: unorderedMatch[1].length,
      content: unorderedMatch[2],
    };
  }
  return null;
}

function isBlockStarter(line = "") {
  return Boolean(
    /^```/.test(line)
    || /^(#{1,4})\s+/.test(line)
    || /^>\s?/.test(line)
    || parseListMarker(line),
  );
}

function parseInlineMarkdown(text = "", keyPrefix = "inline") {
  const source = String(text || "");
  const tokenPattern = /(`[^`]+`)|(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(__([^_]+)__)|(\*([^*]+)\*)|(_([^_]+)_)/g;
  const nodes = [];
  let lastIndex = 0;
  let match;

  while ((match = tokenPattern.exec(source)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(source.slice(lastIndex, match.index));
    }

    const key = `${keyPrefix}-${match.index}`;
    if (match[1]) {
      nodes.push(<code key={key} className="sidebar-chat-markdown__inline-code">{match[1].slice(1, -1)}</code>);
    } else if (match[2]) {
      const label = match[3];
      const href = String(match[4] || "").trim();
      if (/^https?:\/\//i.test(href)) {
        nodes.push(
          <a key={key} className="sidebar-chat-markdown__link" href={href} rel="noreferrer" target="_blank">
            {label}
          </a>,
        );
      } else {
        nodes.push(label);
      }
    } else if (match[5] || match[7]) {
      const value = match[6] || match[8] || "";
      nodes.push(<strong key={key}>{value}</strong>);
    } else if (match[9] || match[11]) {
      const value = match[10] || match[12] || "";
      nodes.push(<em key={key}>{value}</em>);
    }

    lastIndex = tokenPattern.lastIndex;
  }

  if (lastIndex < source.length) {
    nodes.push(source.slice(lastIndex));
  }

  return nodes;
}

export function parseChatMarkdown(text = "") {
  const lines = normalizeMarkdownSource(text).split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const currentLine = lines[index];

    if (isBlankLine(currentLine)) {
      index += 1;
      continue;
    }

    const fenceMatch = /^```([a-zA-Z0-9_-]+)?\s*$/.exec(currentLine);
    if (fenceMatch) {
      const language = String(fenceMatch[1] || "").trim().toLowerCase();
      const codeLines = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length && /^```/.test(lines[index])) {
        index += 1;
      }
      blocks.push({
        type: "code",
        language,
        text: codeLines.join("\n"),
      });
      continue;
    }

    const headingMatch = /^(#{1,4})\s+(.*)$/.exec(currentLine);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: Math.min(4, headingMatch[1].length),
        text: headingMatch[2],
      });
      index += 1;
      continue;
    }

    if (/^>\s?/.test(currentLine)) {
      const quoteLines = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({
        type: "blockquote",
        text: quoteLines.join("\n"),
      });
      continue;
    }

    const listMarker = parseListMarker(currentLine);
    if (listMarker) {
      const items = [];
      const listType = listMarker.kind;
      while (index < lines.length) {
        const marker = parseListMarker(lines[index]);
        if (!marker || marker.kind !== listType) {
          break;
        }

        const itemLines = [marker.content];
        index += 1;
        while (index < lines.length) {
          const continuation = lines[index];
          if (isBlankLine(continuation)) {
            break;
          }
          if (isBlockStarter(continuation)) {
            break;
          }
          if (continuation.length > marker.indent) {
            itemLines.push(continuation.trimEnd());
            index += 1;
            continue;
          }
          break;
        }
        items.push(itemLines.join("\n"));

        while (index < lines.length && isBlankLine(lines[index])) {
          if (parseListMarker(lines[index + 1])?.kind === listType) {
            index += 1;
            break;
          }
          break;
        }
      }
      blocks.push({
        type: listType,
        items,
      });
      continue;
    }

    const paragraphLines = [currentLine];
    index += 1;
    while (index < lines.length && !isBlankLine(lines[index]) && !isBlockStarter(lines[index])) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    blocks.push({
      type: "paragraph",
      text: paragraphLines.join("\n"),
    });
  }

  return blocks;
}

function renderMarkdownBlock(block, index) {
  if (block.type === "heading") {
    const TagName = `h${block.level}`;
    return <TagName key={`heading-${index}`} className="sidebar-chat-markdown__heading">{parseInlineMarkdown(block.text, `heading-${index}`)}</TagName>;
  }
  if (block.type === "blockquote") {
    return <blockquote key={`quote-${index}`} className="sidebar-chat-markdown__quote">{parseInlineMarkdown(block.text, `quote-${index}`)}</blockquote>;
  }
  if (block.type === "code") {
    return (
      <pre key={`code-${index}`} className="sidebar-chat-markdown__pre">
        <code className={block.language ? `language-${block.language}` : undefined}>{block.text}</code>
      </pre>
    );
  }
  if (block.type === "ul" || block.type === "ol") {
    const ListTag = block.type;
    return (
      <ListTag key={`list-${index}`} className="sidebar-chat-markdown__list">
        {block.items.map((item, itemIndex) => (
          <li key={`list-item-${index}-${itemIndex}`}>{parseInlineMarkdown(item, `list-${index}-${itemIndex}`)}</li>
        ))}
      </ListTag>
    );
  }
  return <p key={`paragraph-${index}`}>{parseInlineMarkdown(block.text, `paragraph-${index}`)}</p>;
}

export function ChatMessageContent({ role = "assistant", text = "" }) {
  const normalizedRole = String(role || "assistant").trim().toLowerCase();
  const content = String(text || "");
  if (normalizedRole === "user") {
    return <p className="sidebar-chat-bubble__content sidebar-chat-bubble__content--plain">{content}</p>;
  }

  const blocks = parseChatMarkdown(content);
  if (!blocks.length) {
    return <p className="sidebar-chat-bubble__content sidebar-chat-bubble__content--plain">{content}</p>;
  }

  return (
    <div className="sidebar-chat-bubble__content sidebar-chat-bubble__content--markdown">
      {blocks.map(renderMarkdownBlock)}
    </div>
  );
}
