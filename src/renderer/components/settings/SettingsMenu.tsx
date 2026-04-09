import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { useAppearanceStore } from '@/stores/appearance-store'
import { useExportStore } from '@/stores/export-store'
import { useUpdateStore } from '@/stores/update-store'
import { cn } from '@/lib/utils'
import { FolderOpen, RefreshCw, RotateCcw, Settings } from 'lucide-react'

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

const EXPORT_THEME_OPTIONS: Array<{ value: ExportTheme; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
]

const EXPORT_PAGE_SIZE_OPTIONS: Array<{ value: ExportPageSize; label: string }> = [
  { value: 'letter', label: 'Letter' },
  { value: 'a4', label: 'A4' }
]

const EXPORT_ORIENTATION_OPTIONS: Array<{ value: ExportOrientation; label: string }> = [
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' }
]

export function SettingsMenu(): React.JSX.Element {
  const themeMode = useAppearanceStore((s) => s.themeMode)
  const editorFontPreset = useAppearanceStore((s) => s.editorFontPreset)
  const editorFontSizePx = useAppearanceStore((s) => s.editorFontSizePx)
  const editorLineHeight = useAppearanceStore((s) => s.editorLineHeight)
  const setThemeMode = useAppearanceStore((s) => s.setThemeMode)
  const setEditorFontPreset = useAppearanceStore((s) => s.setEditorFontPreset)
  const setEditorFontSizePx = useAppearanceStore((s) => s.setEditorFontSizePx)
  const setEditorLineHeight = useAppearanceStore((s) => s.setEditorLineHeight)

  const exportTheme = useExportStore((s) => s.exportTheme)
  const exportPageSize = useExportStore((s) => s.exportPageSize)
  const exportOrientation = useExportStore((s) => s.exportOrientation)
  const setExportTheme = useExportStore((s) => s.setExportTheme)
  const setExportPageSize = useExportStore((s) => s.setExportPageSize)
  const setExportOrientation = useExportStore((s) => s.setExportOrientation)

  const [reopenLastFolder, setReopenLastFolder] = useState(false)
  const [templatesDir, setTemplatesDir] = useState('')
  const [isCustomDir, setIsCustomDir] = useState(false)
  const [appVersion, setAppVersion] = useState('')
  const [checking, setChecking] = useState(false)
  const updateStatus = useUpdateStore((s) => s.status)

  useEffect(() => {
    window.electronAPI.getSession().then((session) => {
      setReopenLastFolder(session.reopenLastFolder ?? false)
      setIsCustomDir(!!session.templatesDir)
    })
    window.electronAPI.getTemplatesDir().then(setTemplatesDir)
    window.electronAPI.getVersion().then(setAppVersion)
  }, [])

  function handleReopenToggle(checked: boolean): void {
    setReopenLastFolder(checked)
    window.electronAPI.saveSession({ reopenLastFolder: checked })
  }

  async function handleChangeTemplatesDir(): Promise<void> {
    const result = await window.electronAPI.openFolder()
    if (!result) return
    await window.electronAPI.setTemplatesDir(result)
    await window.electronAPI.saveSession({ templatesDir: result })
    setTemplatesDir(result)
    setIsCustomDir(true)
  }

  async function handleResetTemplatesDir(): Promise<void> {
    await window.electronAPI.setTemplatesDir(null)
    await window.electronAPI.saveSession({ templatesDir: undefined })
    const dir = await window.electronAPI.getTemplatesDir()
    setTemplatesDir(dir)
    setIsCustomDir(false)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          data-settings-trigger
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" className="w-[min(20rem,calc(100vw-2rem))] max-h-[calc(100vh-5rem)] overflow-y-auto space-y-4 p-4">
        {/* ── Appearance ── */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Appearance</p>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
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

        {/* ── Typography ── */}
        <Separator />

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Typography</p>
          <select
            className={cn(
              'mt-3 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm',
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

          <div className="mt-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[12px] text-muted-foreground" htmlFor="font-size-range">
                Font size
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
              className="mt-1 w-full accent-primary"
            />
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[12px] text-muted-foreground" htmlFor="line-height-range">
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
              className="mt-1 w-full accent-primary"
            />
          </div>
        </div>

        {/* ── General ── */}
        <Separator />

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">General</p>
          <label className="mt-3 flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={reopenLastFolder}
              onCheckedChange={(checked) => handleReopenToggle(checked === true)}
            />
            <span className="text-[13px] text-foreground">Reopen last folder on launch</span>
          </label>
        </div>

        {/* ── Templates ── */}
        <Separator />

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Templates</p>
          <p className="mt-2 break-all text-[11px] leading-snug text-muted-foreground/70">
            {templatesDir}
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => void window.electronAPI.openTemplatesDir()}
            >
              <FolderOpen className="h-3 w-3" />
              Open
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => void handleChangeTemplatesDir()}
            >
              Change…
            </Button>
            {isCustomDir && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground"
                onClick={() => void handleResetTemplatesDir()}
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* ── Export ── */}
        <Separator />

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Export</p>

          <div className="mt-3">
            <p className="text-[12px] text-muted-foreground">Theme</p>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {EXPORT_THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={cn(
                    'rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors',
                    exportTheme === opt.value
                      ? 'border-primary bg-accent text-accent-foreground'
                      : 'border-border/60 bg-background text-muted-foreground hover:bg-accent/30'
                  )}
                  onClick={() => setExportTheme(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <p className="text-[12px] text-muted-foreground">Page size</p>
            <select
              className={cn(
                'mt-1.5 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm',
                'outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
              value={exportPageSize}
              onChange={(event) => setExportPageSize(event.target.value as ExportPageSize)}
            >
              {EXPORT_PAGE_SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3">
            <p className="text-[12px] text-muted-foreground">Orientation</p>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {EXPORT_ORIENTATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={cn(
                    'rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors',
                    exportOrientation === opt.value
                      ? 'border-primary bg-accent text-accent-foreground'
                      : 'border-border/60 bg-background text-muted-foreground hover:bg-accent/30'
                  )}
                  onClick={() => setExportOrientation(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── About ── */}
        <Separator />

        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] text-muted-foreground">
            Praxis v{appVersion}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-muted-foreground"
            disabled={
              checking ||
              updateStatus === 'available' ||
              updateStatus === 'downloading' ||
              updateStatus === 'ready'
            }
            onClick={() => {
              setChecking(true)
              useUpdateStore.getState().setManualCheckPending(true)
              window.electronAPI.checkForUpdates().finally(() => setChecking(false))
            }}
          >
            <RefreshCw className={cn('h-3 w-3', checking && 'animate-spin')} />
            {updateStatus === 'ready'
              ? 'Update ready'
              : updateStatus === 'downloading'
                ? 'Downloading…'
                : updateStatus === 'available'
                  ? 'Update available'
                  : checking
                    ? 'Checking…'
                    : 'Check for updates'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
