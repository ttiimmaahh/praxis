'use client';

import type { PlateElementProps } from 'platejs/react';

import { PlateElement, useFocused, useSelected } from 'platejs/react';

import { cn } from '@/lib/utils';

export function ImageElement(props: PlateElementProps) {
  const { element } = props;
  const selected = useSelected();
  const focused = useFocused();

  return (
    <PlateElement {...props} className="py-2.5">
      <div contentEditable={false}>
        <img
          src={element.url as string}
          alt={(element.alt as string) || ''}
          className={cn(
            'block max-w-full rounded-sm',
            selected && focused && 'ring-2 ring-ring ring-offset-2'
          )}
        />
      </div>
      {props.children}
    </PlateElement>
  );
}
