import React, { FC, ReactElement, Fragment, useState } from 'react'

type ParserResult = ReactElement[]

interface FormData {
  [key: string]: string
}

interface LatexEditorProps {
  latexTemplate: string
  autoCompile: boolean
  setLatexSource: React.Dispatch<React.SetStateAction<string>>
}

const VisualEditor: FC<LatexEditorProps> = ({ latexTemplate, autoCompile, setLatexSource }) => {
  const [formData, setFormData] = useState<FormData>({})

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => {
      const newFormData = { ...prev, [key]: value }
      if (autoCompile) {
        const newLatexSource = generateLatexSource(latexTemplate, newFormData)
        setLatexSource(newLatexSource)
      }
      return newFormData
    })
  }

  const generateLatexSource = (template: string, data: FormData): string => {
    let result = template
    Object.keys(data).forEach((key) => {
      result = result.replace(new RegExp(`\\\\hspace\\{[^}]+\\}`, 'g'), data[key])
    })
    return result
  }

  function parseLatexToJSXElements(latexString: string): ParserResult {
    let elementKey = 0
    const inputKeys: string[] = []

    const getKey = (): string => `latex-element-${elementKey++}`

    // Function to render a page break
    const renderPageBreak = () => {
      return (
        <div key={getKey()} className='w-full h-px bg-gray-300 my-16 text-center relative'>
          <span className='absolute bg-white px-2 text-gray-600 text-xs top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
            Page Break
          </span>
        </div>
      )
    }

    // Parse a LaTeX document section by section
    const parseDocument = (latex: string): ParserResult => {
      const docStart = latex.indexOf('\\begin{document}')
      if (docStart !== -1) {
        latex = latex.substring(docStart + '\\begin{document}'.length)
      }

      // Remove document end
      const docEnd = latex.indexOf('\\end{document}')
      if (docEnd !== -1) {
        latex = latex.substring(0, docEnd)
      }

      return parseContent(latex)
    }

    // Parse a section of content
    const parseContent = (content: string): ParserResult => {
      const result: ReactElement[] = []
      let currentText = ''
      let i = 0

      // Helper to push accumulated text as a text node
      const pushText = () => {
        if (currentText) {
          result.push(<Fragment key={getKey()}>{currentText}</Fragment>)
          currentText = ''
        }
      }

      while (i < content.length) {
        // Handle LaTeX commands
        if (content[i] === '\\') {
          pushText()

          // Extract command name
          let j = i + 1
          let command = ''
          while (j < content.length && /[a-zA-Z]/.test(content[j])) {
            command += content[j]
            j++
          }

          // Handle specific commands
          if (command === 'begin') {
            const envMatch = content.substring(j).match(/^\{([^}]+)\}/)
            if (envMatch) {
              const environment = envMatch[1]
              j += envMatch[0].length

              // Find the end of this environment
              const endTag = `\\end{${environment}}`
              const endPos = content.indexOf(endTag, j)

              if (endPos !== -1) {
                const environmentContent = content.substring(j, endPos)

                // Handle different environments
                if (environment === 'center') {
                  result.push(
                    <div key={getKey()} style={{ textAlign: 'center' }}>
                      {parseContent(environmentContent)}
                    </div>
                  )
                } else if (environment === 'flushright') {
                  result.push(
                    <div key={getKey()} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {parseContent(environmentContent)}
                    </div>
                  )
                } else if (environment === 'table') {
                  result.push(parseTable(environmentContent))
                } else if (environment === 'tabular') {
                  result.push(parseTabular(environmentContent, false))
                } else {
                  // Generic environment handling
                  result.push(
                    <div key={getKey()} className={`latex-env-${environment}`}>
                      {parseContent(environmentContent)}
                    </div>
                  )
                }

                i = endPos + endTag.length
                continue
              }
            }
          } else if (command === 'textbf') {
            const contentMatch = extractBracedContent(content.substring(j))
            if (contentMatch) {
              result.push(<strong key={getKey()}>{parseContent(contentMatch.content)}</strong>)
              j += contentMatch.length
            }
          } else if (command === 'textit') {
            const contentMatch = extractBracedContent(content.substring(j))
            if (contentMatch) {
              result.push(<i key={getKey()}>{parseContent(contentMatch.content)}</i>)
              j += contentMatch.length
            }
          } else if (command === 'textsuperscript') {
            const contentMatch = extractBracedContent(content.substring(j))
            if (contentMatch) {
              result.push(<sup key={getKey()}>{parseContent(contentMatch.content)}</sup>)
              j += contentMatch.length
            }
          } else if (command === 'vspace') {
            // Extract size parameter but just render a break
            const contentMatch = extractBracedContent(content.substring(j))
            if (contentMatch) {
              result.push(<br key={getKey()} />)
              j += contentMatch.length
            }
          } else if (command === 'hspace') {
            // Extract size parameter
            const contentMatch = extractBracedContent(content.substring(j))
            if (contentMatch) {
              // Convert LaTeX size to approximate CSS
              const size = contentMatch.content.trim()
              const cssSize = convertLatexSizeToCss(size)
              const inputKey = `input-${inputKeys.length}`
              inputKeys.push(inputKey)

              result.push(
                <input
                  key={getKey()}
                  type='text'
                  value={formData[inputKey] || ''}
                  onChange={(e) => handleInputChange(inputKey, e.target.value)}
                  style={{
                    width: cssSize,
                    border: 'none',
                    outline: 'none',
                    borderBottom: '1px solid #000',
                    display: 'inline-block',
                    verticalAlign: 'bottom',
                    padding: '0 2px',
                    margin: '0 2px'
                  }}
                />
              )
              j += contentMatch.length
            }
          } else if (command === 'noindent') {
            // No specific handling needed, just skip command
            // In React, paragraphs don't have automatic indentation
          } else if (command === '') {
            // Line break - \\
            if (content[j] === '\\') {
              result.push(<br key={getKey()} />)
              j++
            }
          } else if (command === 'renewcommand') {
            // Skip LaTeX command definitions
            const braceContent = extractBracedContent(content.substring(j))
            if (braceContent) {
              j += braceContent.length
              const secondBraceContent = extractBracedContent(content.substring(j))
              if (secondBraceContent) {
                j += secondBraceContent.length
              }
            }
          } else if (command === 'newpage') {
            // Handle page break
            result.push(renderPageBreak())
            i = j
            continue
          } else {
            // Unknown command
            currentText += `\\${command}`
          }

          i = j
        } else if (content[i] === '\n') {
          // Handle newlines - in LaTeX, simple newlines are not line breaks
          // But consecutive newlines can indicate paragraph breaks
          if (i > 0 && content[i - 1] === '\n') {
            pushText()
            result.push(<p key={getKey()}></p>)
          } else {
            currentText += ' '
          }
          i++
        } else {
          // Regular text
          currentText += content[i]
          i++
        }
      }

      pushText()
      return result
    }

    // Helper function to extract content between braces
    const extractBracedContent = (text: string): { content: string; length: number } | null => {
      if (!text.startsWith('{')) return null

      let braceLevel = 0
      let content = ''
      let i = 0

      for (i = 0; i < text.length; i++) {
        if (text[i] === '{') {
          braceLevel++
          if (braceLevel === 1) continue // Skip the opening brace
        } else if (text[i] === '}') {
          braceLevel--
          if (braceLevel === 0) break // End of content
        }

        if (braceLevel > 0) {
          content += text[i]
        }
      }

      return { content, length: i + 1 }
    }

    // Helper to count and skip braced content (for skipping commands)
    // const countBraces = (text: string): number => {
    //   let braceLevel = 0
    //   let i = 0

    //   for (i = 0; i < text.length; i++) {
    //     if (text[i] === '{') {
    //       braceLevel++
    //     } else if (text[i] === '}') {
    //       braceLevel--
    //       if (braceLevel === 0) return i + 1
    //     }
    //   }

    //   return i
    // }

    // Convert LaTeX size notation to CSS
    const convertLatexSizeToCss = (latexSize: string): string => {
      // Simple conversion - could be expanded
      if (latexSize.endsWith('cm')) {
        return latexSize
      } else if (latexSize.endsWith('pt')) {
        // Convert pt to px (approximate)
        const pt = parseFloat(latexSize)
        return `${pt * 1.33}px`
      } else {
        return '1em' // Default
      }
    }

    // Parse a table environment
    const parseTable = (content: string): ReactElement => {
      // Find and parse the tabular environment inside
      const tabStart = content.indexOf('\\begin{tabular}')
      const tabEnd = content.indexOf('\\end{tabular}')

      if (tabStart !== -1 && tabEnd !== -1) {
        const tabularContent = content.substring(tabStart + '\\begin{tabular}'.length, tabEnd)

        return (
          <table
            key={getKey()}
            className='latex-table'
            style={{ borderCollapse: 'collapse', width: '100%' }}
          >
            {parseTabular(tabularContent, true)}
          </table>
        )
      }

      // Fallback if tabular not found
      return <table key={getKey()}>{parseContent(content)}</table>
    }

    // Parse a tabular environment
    const parseTabular = (content: string, isInsideTable: boolean = false): ReactElement => {
      // Extract column specification
      const colSpecMatch = extractBracedContent(content)
      if (!colSpecMatch) {
        return <tbody key={getKey()}></tbody>
      }

      // Process column specifications (l=left, c=center, r=right)
      const colSpecs = colSpecMatch.content
        .split('')
        .filter((char) => ['l', 'c', 'r', 'p', '|'].includes(char))
        .filter((char) => char !== '|') // Remove vertical line markers

      // Skip column spec
      content = content.substring(colSpecMatch.length)

      const rows: ReactElement[] = []
      const lines = content.split('\\\\').map((line) => line.trim())

      lines.forEach((line, index) => {
        if (!line) return

        // Handle \hline
        if (line.startsWith('\\hline')) {
          line = line.substring('\\hline'.length).trim()
        }

        // Split into cells
        const cells = line.split('&').map((cell) => cell.trim())

        // Create row with cells
        const rowCells = cells.map((cell, cellIndex) => {
          // Get alignment for this cell (or default to left)
          const alignment =
            cellIndex < colSpecs.length
              ? colSpecs[cellIndex] === 'c'
                ? 'center'
                : colSpecs[cellIndex] === 'r'
                ? 'right'
                : 'left'
              : 'left'

          // Check for multirow
          const multirowMatch = cell.match(/\\multirow\{(\d+)\}\{[^}]*\}\{([^}]+)\}/)
          if (multirowMatch) {
            const rowspan = parseInt(multirowMatch[1])
            const cellContent = multirowMatch[2]

            return (
              <td
                key={`cell-${index}-${cellIndex}`}
                rowSpan={rowspan}
                style={{
                  ...(isInsideTable ? { border: '1px solid black', padding: '4px' } : {}),
                  textAlign: alignment
                }}
              >
                {parseContent(cellContent)}
              </td>
            )
          }

          return (
            <td
              key={`cell-${index}-${cellIndex}`}
              style={{
                ...(isInsideTable ? { border: '1px solid black', padding: '4px' } : {}),
                textAlign: alignment
              }}
            >
              {parseContent(cell)}
            </td>
          )
        })

        rows.push(<tr key={`row-${index}`}>{rowCells}</tr>)
      })

      return <tbody key={getKey()}>{rows}</tbody>
    }

    // Start parsing the document
    return parseDocument(latexString)
  }

  const renderedContent = parseLatexToJSXElements(latexTemplate)

  return (
    <div className='flex h-full w-full overflow-auto p-4 px-12'>
      <div
        className='max-w-[650px] mx-auto h-full'
        style={{ fontFamily: 'Times New Roman', fontSize: '11pt' }}
      >
        {renderedContent}
        <div className='h-[50vh]' />
      </div>
    </div>
  )
}

export default VisualEditor
