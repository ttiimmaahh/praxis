import { useRef } from 'react'
import { Crepe, CrepeFeature } from '@milkdown/crepe'
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react'

import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'

interface LessonReaderProps {
  content: string
}

function ReadOnlyCrepe({ content }: LessonReaderProps): React.JSX.Element {
  const contentRef = useRef(content)

  useEditor((root) => {
    const crepe = new Crepe({
      root,
      defaultValue: contentRef.current,
      features: {
        [CrepeFeature.CodeMirror]: true,
        [CrepeFeature.ListItem]: true,
        [CrepeFeature.LinkTooltip]: true,
        [CrepeFeature.ImageBlock]: true,
        [CrepeFeature.BlockEdit]: false,
        [CrepeFeature.Toolbar]: false,
        [CrepeFeature.Placeholder]: false,
        [CrepeFeature.Table]: true,
        [CrepeFeature.Cursor]: false,
        [CrepeFeature.Latex]: false,
        [CrepeFeature.TopBar]: false
      }
    })

    crepe.setReadonly(true)
    return crepe
  }, [])

  return <Milkdown />
}

export function LessonReader({ content }: LessonReaderProps): React.JSX.Element {
  return (
    <MilkdownProvider>
      <ReadOnlyCrepe content={content} />
    </MilkdownProvider>
  )
}
