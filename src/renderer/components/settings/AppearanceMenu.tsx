import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { useAppearanceStore } from '@/stores/appearance-store'
import { cn } from '@/lib/utils'
import { Palette } from 'lucide-react'

const THEME_OPTIONS: Array<{ value: 'light' | 'dark' | 'system'; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' }
]

const FONT_OPTIONS: Array<{ value: 'system' | 'serif' | 'mono'; label: string }> = [
  { value: 'system', label: 'Sans (system)' },
  { value: 'serif', label: 'Serif' },
  { value: 'mono', label: 'Monospace' }
]

export function AppearanceMenu(): React.JSX.Element {
  const themeMode = useAppearanceStore((s) => s.themeMode)
  const editorFontPreset = useAppearanceStore((s) => s.editorFontPreset)
  const editorFontSizePx = useAppearanceStore((s) => s.editorFontSizePx)
  const editorLineHeight = useAppearanceStore((s) => s.editorLineHeight)
  const setThemeMode = useAppearanceStore((s) => s.setThemeMode)
  const setEditorFontPreset = useAppearanceStore((s) => s.setEditorFontPreset)
  const setEditorFontSizePx = useAppearanceStore((s) => s.setEditorFontSizePx)
  const setEditorLineHeight = useAppearanceStore((s) => s.setEditorLineHeight)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          data-appearance-trigger
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Appearance and typography"
        >
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" className="w-[min(20rem,calc(100vw-2rem))] space-y-4 p-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Theme</p>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cn(
                  'rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors',
                  themeMode === opt.value
                    ? 'border-primary bg-accent text-accent-foreground'
                    : 'border-border/60 bg-background text-muted-foreground hover:bg-accent/30'
                )}
                onClick={() => setThemeMode(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Font</p>
          <select
            className={cn(
              'mt-2 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm',
              'outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            value={editorFontPreset}
            onChange={(event) => setEditorFontPreset(event.target.value as 'system' | 'serif' | 'mono')}
          >
            {FONT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="font-size-range">
              Editor size
            </label>
            <span className="text-xs tabular-nums text-muted-foreground">{editorFontSizePx}px</span>
          </div>
          <input
            id="font-size-range"
            type="range"
            min={13}
            max={22}
            step={1}
            value={editorFontSizePx}
            onChange={(event) => setEditorFontSizePx(Number(event.target.value))}
            className="mt-2 w-full accent-primary"
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="line-height-range">
              Line height
            </label>
            <span className="text-xs tabular-nums text-muted-foreground">{editorLineHeight.toFixed(2)}</span>
          </div>
          <input
            id="line-height-range"
            type="range"
            min={135}
            max={200}
            step={1}
            value={Math.round(editorLineHeight * 100)}
            onChange={(event) => setEditorLineHeight(Number(event.target.value) / 100)}
            className="mt-2 w-full accent-primary"
          />
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Reading time uses ~200 words per minute. Theme and typography are saved automatically.
        </p>
      </PopoverContent>
    </Popover>
  )
}
