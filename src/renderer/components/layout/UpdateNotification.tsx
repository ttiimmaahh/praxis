import { useUpdateStore } from '@/stores/update-store'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Download, X } from 'lucide-react'

export function UpdateNotification(): React.JSX.Element | null {
  const status = useUpdateStore((s) => s.status)
  const newVersion = useUpdateStore((s) => s.newVersion)
  const errorMessage = useUpdateStore((s) => s.errorMessage)
  const dismissed = useUpdateStore((s) => s.dismissed)
  const startDownload = useUpdateStore((s) => s.startDownload)
  const dismiss = useUpdateStore((s) => s.dismiss)

  if (dismissed) return null
  if (status !== 'available' && status !== 'downloading' && status !== 'ready' && status !== 'error') {
    return null
  }

  const handleDownload = (): void => {
    startDownload()
    window.electronAPI.downloadUpdate().catch((err) => {
      console.error('[updater] downloadUpdate failed', err)
    })
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-72 rounded-lg border bg-card p-3 shadow-lg">
      <div className="flex items-start gap-2.5">
        {status === 'error' ? (
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
        ) : (
          <Download className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        )}
        <div className="flex-1 space-y-1">
          {status === 'available' && (
            <>
              <p className="text-sm font-medium">Praxis v{newVersion} is available</p>
              <p className="text-xs text-muted-foreground">
                Download now, then restart when you&apos;re ready.
              </p>
              <div className="flex gap-2 pt-1">
                <Button size="xs" onClick={handleDownload}>
                  Download
                </Button>
                <Button size="xs" variant="ghost" onClick={dismiss}>
                  Later
                </Button>
              </div>
            </>
          )}

          {status === 'downloading' && (
            <>
              <p className="text-sm font-medium">Downloading v{newVersion}…</p>
              <p className="text-xs text-muted-foreground">Downloading in the background.</p>
            </>
          )}

          {status === 'ready' && (
            <>
              <p className="text-sm font-medium">Praxis v{newVersion} is ready</p>
              <p className="text-xs text-muted-foreground">Restart to apply the update.</p>
              <div className="flex gap-2 pt-1">
                <Button size="xs" onClick={() => window.electronAPI.quitAndInstall()}>
                  Restart now
                </Button>
                <Button size="xs" variant="ghost" onClick={dismiss}>
                  Later
                </Button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <p className="text-sm font-medium">Update failed</p>
              <p className="text-xs break-words text-muted-foreground">
                {errorMessage ?? 'An unknown error occurred while updating.'}
              </p>
            </>
          )}
        </div>
        <button
          onClick={dismiss}
          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
