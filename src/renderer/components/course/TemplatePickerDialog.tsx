import { useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { BookTemplate, Check } from 'lucide-react'

interface TemplatePickerDialogProps {
  open: boolean
  /** Whether to show the course name input (hidden for 'scaffold in current folder' mode) */
  showNameInput?: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (templateId: string, courseName: string) => void
}

export function TemplatePickerDialog({
  open,
  showNameInput = true,
  onOpenChange,
  onSelect
}: TemplatePickerDialogProps): React.JSX.Element {
  const [templates, setTemplates] = useState<CourseTemplateMeta[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [courseName, setCourseName] = useState('')
  const [loading, setLoading] = useState(true)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setSelected(null)
    setCourseName('')
    window.electronAPI.listTemplates().then((list) => {
      setTemplates(list)
      if (list.length > 0) {
        setSelected(list[0].id)
      }
      setLoading(false)
      // Focus the name input after templates load
      if (showNameInput) {
        requestAnimationFrame(() => nameInputRef.current?.focus())
      }
    })
  }, [open, showNameInput])

  const canCreate = selected && (!showNameInput || courseName.trim().length > 0)

  function handleCreate(): void {
    if (!selected || !canCreate) return
    onOpenChange(false)
    onSelect(selected, courseName.trim())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New course</DialogTitle>
          <DialogDescription>
            Name your course and choose a starter template
          </DialogDescription>
        </DialogHeader>

        {showNameInput && (
          <div>
            <label className="text-[12px] font-medium text-muted-foreground" htmlFor="course-name">
              Course name
            </label>
            <Input
              ref={nameInputRef}
              id="course-name"
              className="mt-1.5"
              placeholder="My First Course"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canCreate) handleCreate()
              }}
            />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Loading templates…
          </div>
        ) : templates.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            No templates found
          </div>
        ) : (
          <>
            <label className="text-[12px] font-medium text-muted-foreground">
              Template
            </label>
            <ScrollArea className="max-h-[260px]">
              <div className="space-y-2 pr-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                      selected === t.id
                        ? 'border-primary bg-accent'
                        : 'border-border/60 bg-background hover:bg-accent/30'
                    )}
                    onClick={() => setSelected(t.id)}
                    onDoubleClick={() => {
                      setSelected(t.id)
                      handleCreate()
                    }}
                  >
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                      {selected === t.id ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <BookTemplate className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{t.name}</span>
                        {t.builtIn && (
                          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            Built-in
                          </span>
                        )}
                      </div>
                      {t.description && (
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {t.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={!canCreate} onClick={handleCreate}>
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
