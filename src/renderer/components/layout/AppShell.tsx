import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from '@/components/ui/resizable'
import { TitleBar } from './TitleBar'
import { Sidebar } from './Sidebar'
import { EditorArea } from './EditorArea'

export function AppShell(): React.JSX.Element {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      <TitleBar />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={25} minSize={15} maxSize={40} className="min-w-0">
          <Sidebar />
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={75} minSize={40} className="min-w-0">
          <EditorArea />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
