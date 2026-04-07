import { ScrollArea } from '@/components/ui/scroll-area'
import { extractMarkdownHeadings, type MarkdownHeading } from '@/lib/markdown-headings'
import { cn } from '@/lib/utils'
import { ListTree } from 'lucide-react'

interface DocumentOutlineProps {
  markdown: string
  onJumpToHeading: (headingIndex: number) => void
}

export function DocumentOutline({ markdown, onJumpToHeading }: DocumentOutlineProps): React.JSX.Element {
  const headings: MarkdownHeading[] = extractMarkdownHeadings(markdown)

  return (
    <div className="flex h-full min-h-0 w-[220px] shrink-0 flex-col border-l border-border/50 bg-muted/15">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border/50 px-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <ListTree className="h-3.5 w-3.5" aria-hidden />
        Outline
      </div>
      <ScrollArea className="min-h-0 flex-1">
        {headings.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted-foreground">No headings in this file</p>
        ) : (
          <ul className="p-2">
            {headings.map((heading, index) => (
              <li key={`${heading.level}-${heading.text}-${index}`}>
                <button
                  type="button"
                  className={cn(
                    'w-full rounded-md px-2 py-1.5 text-left text-[13px] leading-snug text-foreground/90 transition-colors hover:bg-accent/50',
                    heading.level === 1 && 'pl-2 font-medium',
                    heading.level === 2 && 'pl-3',
                    heading.level === 3 && 'pl-5',
                    heading.level >= 4 && 'pl-7 text-muted-foreground'
                  )}
                  onClick={() => {
                    onJumpToHeading(index)
                  }}
                >
                  {heading.text}
                </button>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  )
}
