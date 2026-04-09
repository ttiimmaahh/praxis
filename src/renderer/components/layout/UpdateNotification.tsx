import { useUpdateStore } from '@/stores/update-store'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'

export function UpdateNotification(): React.JSX.Element | null {
  const status = useUpdateStore((s) => s.status)
  const newVersion = useUpdateStore((s) => s.newVersion)
  const dismissed = useUpdateStore((s) => s.dismissed)
  const dismiss = useUpdateStore((s) => s.dismiss)

  if (dismissed || (status !== 'downloading' && status !== 'ready')) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 w-72 rounded-lg border bg-card p-3 shadow-lg">
      <div className="flex items-start gap-2.5">
        <Download className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium">
            {status === 'downloading'
              ? `Downloading v${newVersion}...`
              : `Praxis v${newVersion} is ready`}
          </p>
          <p className="text-xs text-muted-foreground">
            {status === 'downloading'
              ? 'Downloading in the background.'
              : 'Restart to apply the update.'}
          </p>
          {status === 'ready' && (
            <div className="flex gap-2 pt-1">
              <Button size="xs" onClick={() => window.electronAPI.quitAndInstall()}>
                Restart now
              </Button>
              <Button size="xs" variant="ghost" onClick={dismiss}>
                Later
              </Button>
            </div>
          )}
        </div>
        <button
          onClick={dismiss}
          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
