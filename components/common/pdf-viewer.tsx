'use client'

import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'
import { Button } from '../ui/button'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const PdfViewer = ({ pdfUrl }: { pdfUrl: string }) => {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.2)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setPageNumber(1)
  }

  return (
    <div className='pdf-viewer-container border rounded-lg shadow-sm bg-white'>
      <div className='pdf-toolbar flex items-center justify-between p-2 bg-gray-50 border-b'>
        <div className='flex space-x-2'>
          <Button
            variant='ghost'
            size='sm'
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
          >
            Trước
          </Button>
          <span className='flex items-center px-3 text-sm'>
            Trang {pageNumber} / {numPages || 0}
          </span>
          <Button
            variant='ghost'
            size='sm'
            disabled={!!(numPages && pageNumber >= numPages)}
            onClick={() => setPageNumber((prev) => Math.min(prev + 1, numPages || prev + 1))}
          >
            Tiếp theo
          </Button>
        </div>
        <div className='flex items-center space-x-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setScale((prev) => Math.max(0.5, prev - 0.25))}
            disabled={scale <= 0.5}
          >
            -
          </Button>
          <span className='text-sm w-12 text-center'>{Math.round(scale * 100)}%</span>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setScale((prev) => Math.min(2.0, prev + 0.25))}
            disabled={scale >= 2.0}
          >
            +
          </Button>
        </div>
        <Button variant='ghost' size='sm' onClick={() => window.open(pdfUrl, '_blank')}>
          Mở trong tab mới
        </Button>
      </div>

      <div className='pdf-content overflow-auto p-4 flex-1'>
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className='flex justify-center p-8'>Đang tải PDF...</div>}
          error={
            <div className='text-red-500 p-4'>Đã xảy ra lỗi khi tải PDF. Vui lòng thử lại sau.</div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className='border'
          />
        </Document>
      </div>
      <div className='h-4 bg-[#f9f9f9]' />
    </div>
  )
}

export default PdfViewer
