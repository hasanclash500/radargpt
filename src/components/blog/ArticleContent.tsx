import type { ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return tokens.filter(Boolean).map((token, index) => {
    const bold = token.match(/^\*\*(.+)\*\*$/);
    if (bold) return <strong key={index}>{bold[1]}</strong>;

    const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a
          key={index}
          href={link[2]}
          className="font-bold text-primary underline decoration-primary/30 underline-offset-4"
          target={link[2].startsWith("http") ? "_blank" : undefined}
          rel={link[2].startsWith("http") ? "noreferrer" : undefined}
        >
          {link[1]}
        </a>
      );
    }

    return token;
  });
}

export function ArticleContent({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const nodes: ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (!bullets.length) return;
    nodes.push(
      <ul key={`ul-${nodes.length}`} className="my-5 space-y-2 pr-5 text-[15px] leading-8 text-foreground/85">
        {bullets.map((item, i) => (
          <li key={i} className="list-disc marker:text-primary">
            {renderInline(item)}
          </li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  lines.forEach((raw, index) => {
    const line = raw.trim();

    if (line.startsWith("- ")) {
      bullets.push(line.slice(2));
      return;
    }

    flushBullets();

    if (!line) {
      nodes.push(<div key={`space-${index}`} className="h-2" />);
      return;
    }

    if (line.startsWith("### ")) {
      nodes.push(
        <h3 key={index} className="mb-3 mt-8 text-lg font-extrabold tracking-tight sm:text-xl">
          {renderInline(line.slice(4))}
        </h3>,
      );
      return;
    }

    if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={index} className="mb-3 mt-10 text-xl font-extrabold tracking-tight sm:text-2xl">
          {renderInline(line.slice(3))}
        </h2>,
      );
      return;
    }

    if (line.startsWith("> ")) {
      nodes.push(
        <blockquote
          key={index}
          className="my-6 rounded-e-2xl border-r-4 border-primary bg-primary/8 px-5 py-4 text-sm leading-8 text-foreground/80"
        >
          {renderInline(line.slice(2))}
        </blockquote>,
      );
      return;
    }

    nodes.push(
      <p key={index} className="my-3 text-[15px] leading-8 text-foreground/80 sm:text-base sm:leading-9">
        {renderInline(line)}
      </p>,
    );
  });

  flushBullets();

  return <div className="blog-content">{nodes}</div>;
}
