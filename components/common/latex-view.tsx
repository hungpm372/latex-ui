import React, { useState, useRef } from 'react'
import { BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import { Bold, Italic, Underline, Heading, List, MSquare } from 'lucide-react'

const latexCommands = [
  { name: '\\textbf{Bold}', icon: <Bold size={16} /> },
  { name: '\\textit{Italic}', icon: <Italic size={16} /> },
  { name: '\\underline{Underline}', icon: <Underline size={16} /> },
  { name: '\\section{Heading}', icon: <Heading size={16} /> },
  {
    name: '\\begin{itemize}\n\\item Item 1\n\\item Item 2\n\\end{itemize}',
    icon: <List size={16} />
  },
  { name: '\\int_{a}^{b} f(x) dx', icon: <MSquare size={16} /> }
]

export default function LatexVisualEditor() {
  const [latex, setLatex] = useState(`
\\documentclass{article}
\\begin{document}

Hello, \\textbf{World}!

\\end{document}
  `)
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleInsertCommand = (command: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newLatex = latex.slice(0, start) + command + latex.slice(end)

    setLatex(newLatex)
    setCursorPosition(start + command.length)

    // Focus back to textarea
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + command.length, start + command.length)
    }, 0)
  }

  return (
    <div className='flex flex-col p-4 max-w-4xl mx-auto'>
      <div className='flex mb-4 space-x-2 bg-gray-100 p-2 rounded'>
        {latexCommands.map((cmd, index) => (
          <button
            key={index}
            onClick={() => handleInsertCommand(cmd.name)}
            className='p-2 hover:bg-gray-200 rounded flex items-center'
            title={cmd.name}
          >
            {cmd.icon}
          </button>
        ))}
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div>
          <textarea
            ref={textareaRef}
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            className='w-full h-96 p-2 border rounded font-mono'
            placeholder='Enter LaTeX here...'
          />
        </div>
        <div>
          <div className='border rounded p-2 h-96 overflow-auto'>
            <BlockMath>{latex}</BlockMath>
          </div>
        </div>
      </div>
    </div>
  )
}
