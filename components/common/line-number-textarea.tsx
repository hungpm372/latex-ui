'use client'

import { Textarea } from '@/components/ui/textarea'
import React, { forwardRef, useEffect, useRef, useState } from 'react'

interface LineNumberTextareaProps extends React.ComponentProps<'textarea'> {
  value: string
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>
}

const LineNumberTextarea = forwardRef<HTMLTextAreaElement, LineNumberTextareaProps>(
  ({ value, onChange, className = '', ...props }, ref) => {
    const [lineCount, setLineCount] = useState<number>(1)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const lineNumbersRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (value) {
        const lines = value.split('\n').length
        setLineCount(lines < 1 ? 1 : lines)
      } else {
        setLineCount(1)
      }
    }, [value])

    const handleScroll = () => {
      if (textareaRef.current && lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
      }
    }

    return (
      <div className='flex h-full w-full'>
        <div
          ref={lineNumbersRef}
          className='h-full overflow-hidden py-2 text-right pr-2 text-gray-500 select-none bg-gray-50 border rounded-l-md'
          style={{
            width: '40px',
            fontFamily: 'monospace',
            lineHeight: '1.5rem'
          }}
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i} className='text-xs leading-5'>
              {i + 1}
            </div>
          ))}
        </div>

        <Textarea
          ref={(el) => {
            if (textareaRef && 'current' in textareaRef) {
              ;(textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el
            }
            if (typeof ref === 'function') {
              ref(el)
            } else if (ref) {
              ref.current = el
            }
          }}
          value={value}
          onChange={onChange}
          onScroll={handleScroll}
          className={`flex-1 h-full font-mono border-l-0 rounded-l-none leading-5 ${className}`}
          {...props}
          spellCheck='false'
        />
      </div>
    )
  }
)

LineNumberTextarea.displayName = 'LineNumberTextarea'

export default LineNumberTextarea
