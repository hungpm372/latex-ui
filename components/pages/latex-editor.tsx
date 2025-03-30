'use client'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import axios from 'axios'
import { Download, Play, Save, Settings } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Switch } from '../ui/switch'
const PdfViewer = dynamic(() => import('@/components/common/pdf-viewer'), { ssr: false })
const VisualEditor = dynamic(() => import('@/components/common/visual-editor'), { ssr: false })

export interface FormData {
  [key: string]: string
}

export default function LatexEditor() {
  const latexTemplate = `\\documentclass[11pt, letterpaper, oneside]{article}
                          \\usepackage[utf8]{vietnam}
                          \\usepackage{times}
                          \\usepackage[showframe=false, left=2.54cm, right=2.54cm, top=2.54cm, bottom=2.54cm]{geometry}
                          \\usepackage{amsmath}
                          \\usepackage{setspace}
                          \\usepackage{array}
                          \\usepackage{multirow}
                          \\pagestyle{empty}
                          \\linespread{1.08}
                          \\begin{document}

                          \\begin{center}
                              \\textbf{CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM} \\\\
                              \\textbf{Độc lập – Tự do – Hạnh phúc} \\\\
                              \\textbf{--------------------} \\\\
                              \\vspace{8pt}
                              \\textbf{ĐƠN ĐỀ NGHỊ ĐƯỢC LÀM VIỆC CHÍNH THỨC} \\\\
                              \\vspace{8pt}
                              \\textbf{Kính gửi:} \\hspace{3.5cm}\\textsuperscript{\\textit{(1)}}
                          \\end{center}

                          \\noindent
                          Tên tôi là: \\hspace{8cm} 
                          \\vspace{8pt}

                          \\noindent
                          Số định danh cá nhân/CMND/Hộ chiếu: \\hspace{2cm} Nơi cấp: \\hspace{2cm} Ngày cấp: \\hspace{2cm} 
                          \\vspace{8pt}

                          \\noindent
                          Điện thoại: \\hspace{8cm} 
                          \\vspace{8pt}

                          \\noindent
                          Nơi ở hiện tại: \\hspace{8cm} 
                          \\vspace{8pt}

                          \\noindent
                          Trình độ và chuyên ngành đào tạo: \\hspace{8cm} 
                          \\vspace{8pt}

                          \\noindent
                          Quá trình đào tạo \\textit{(kể cả các khóa đào tạo ngắn hạn có liên quan)}:
                          \\renewcommand{\\arraystretch}{1.5}
                          \\begin{table}[htbp]
                          \\begin{tabular}{|p{4.71cm}|p{4.77cm}|p{4.95cm}|}
                          \\hline
                          \\multirow{1}{*}{\\textbf{Từ ……………………..}} & \\multirow{2}{*}{\\textbf{Ngành, lĩnh vực đào tạo}} & \\multirow{2}{*}{\\textbf{Nơi đào tạo}} \\\\
                          \\textbf{Đến ……………………} & & \\textit{(Tên trường, quốc gia)} \\\\
                          \\hline
                          & &  \\\\
                          \\hline
                          \\end{tabular}
                          \\end{table}

                          \\noindent
                          Quá trình công tác:
                          \\renewcommand{\\arraystretch}{1.5}
                          \\begin{table}[htbp]
                          \\begin{tabular}{|p{3.52cm}|p{2.36cm}|p{4.36cm}|p{4.2cm}|}
                          \\hline
                          \\textbf{Từ ………………} & \\multirow{2}{*}{\\textbf{Chức vụ}} & \\multirow{2}{*}{\\textbf{Lĩnh vực chuyên môn}} & \\multirow{2}{*}{\\textbf{Nơi công tác}} \\\\
                          \\textbf{Đến ………….......} & \\textit{(nếu có)} & & \\\\
                          \\hline
                          & & & \\\\
                          \\hline
                          \\end{tabular}
                          \\end{table}

                          \\noindent
                          Sau khi nghiên cứu Điều lệ tổ chức và hoạt động của \\hspace{1cm} \\textsuperscript{\\textit{(1)}}, tôi thấy khả năng, trình độ và điều kiện của mình phù hợp với vị trí làm việc chính thức.
                          \\vspace{8pt}

                          \\noindent
                          Vậy tôi làm đơn này xin được làm việc chính thức và chỉ làm việc chính thức tại \\hspace{1cm} \\textsuperscript{\\textit{(1)}} kể từ khi tổ chức bắt đầu hoạt động.
                          \\vspace{8pt}

                          \\noindent
                          Nếu được chấp nhận, tôi xin hứa sẽ chấp hành nghiêm chỉnh mọi nội quy, quy chế của tổ chức, hoàn thành tốt nhiệm vụ được giao và thực hiện đúng các quy định của pháp luật có liên quan.

                          \\renewcommand{\\arraystretch}{1.08}
                          \\begin{flushright}
                              \\begin{tabular}{c}
                                  \\textit{\\hspace{1cm}, ngày \\hspace{0.5cm} tháng \\hspace{0.5cm} năm} \\hspace{0.5cm} \\\\
                                  \\textbf{NGƯỜI VIẾT ĐƠN} \\\\
                                  \\textit{(ký và ghi rõ họ tên)}
                              \\end{tabular}
                          \\end{flushright}

                          \\newpage
                          \\noindent
                          \\textsuperscript{\\textit{(1)}}
                          \\textit{Ghi tên tổ chức khoa học và công nghệ nơi cá nhân xin làm việc chính thức.}

                          \\end{document}`
  const [compiledPdf, setCompiledPdf] = useState<string>('')
  const [autoCompile, setAutoCompile] = useState<boolean>(true)
  const [latexSource, setLatexSource] = useState<string>(latexTemplate)
  const [compilationStatus, setCompilationStatus] = useState<{
    loading: boolean
    error: string | null
  }>({
    loading: false,
    error: null
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCompile = useCallback(async () => {
    setCompilationStatus({ loading: true, error: null })
    try {
      const response = await axios.post(
        'http://localhost:5000/api/compile-latex',
        { content: latexSource },
        { responseType: 'blob' }
      )

      const pdfBlob = new Blob([response.data], { type: 'application/pdf' })
      setCompiledPdf(URL.createObjectURL(pdfBlob))
      setCompilationStatus({ loading: false, error: null })
    } catch (error) {
      console.error('Compilation error:', error)
      setCompilationStatus({
        loading: false,
        error: 'Biên dịch không thành công'
      })
      setCompiledPdf('')
    }
  }, [latexSource])

  const handleDownload = () => {
    if (compiledPdf) {
      const link = document.createElement('a')
      link.href = compiledPdf
      link.download = 'document.pdf'
      link.click()
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setLatexSource(e.target?.result as string)
      }
      reader.readAsText(file)
    }
  }

  const handleSave = () => {
    const blob = new Blob([latexSource], { type: 'text/plain' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'document.tex'
    link.click()
  }

  useEffect(() => {
    if (autoCompile && latexSource.trim() !== '') {
      const timeout = setTimeout(() => {
        handleCompile()
      }, 500)

      return () => clearTimeout(timeout)
    }
  }, [latexSource, autoCompile, handleCompile])

  return (
    <div className='flex flex-col h-screen'>
      <header className='bg-gray-100 p-4 flex justify-between items-center'>
        <div className='flex space-x-2'>
          <Button onClick={handleCompile} variant='outline' disabled={compilationStatus.loading}>
            <Play className='mr-2 h-4 w-4' />
            {compilationStatus.loading ? 'Đang biên dịch...' : 'Biên dịch'}
          </Button>
          <Button onClick={handleDownload} disabled={!compiledPdf} variant='outline'>
            <Download className='mr-2 h-4 w-4' /> Tải PDF
          </Button>
          <Button onClick={handleSave} variant='outline'>
            <Save className='mr-2 h-4 w-4' /> Lưu .tex
          </Button>
          <input
            type='file'
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept='.tex'
            className='hidden'
          />
          <Button variant='outline' onClick={() => fileInputRef.current?.click()}>
            Mở File
          </Button>
        </div>
        <div className='flex items-center space-x-4'>
          <div className='flex items-center space-x-2'>
            <Switch checked={autoCompile} onCheckedChange={setAutoCompile} />
            <label className='text-sm'>Tự động biên dịch</label>
          </div>

          <Button variant='ghost'>
            <Settings className='h-4 w-4' />
          </Button>
        </div>
      </header>

      <div className='flex flex-1 overflow-hidden'>
        <ResizablePanelGroup direction='horizontal'>
          <ResizablePanel className='border-r overflow-auto'>
            {/* <LineNumberTextarea
              value={latexContent}
              onChange={(e) => setLatexContent(e.target.value)}
              className='w-full h-full'
              placeholder='Nhập mã LaTeX của bạn tại đây...'
            /> */}
            {/* <LatexView /> */}
            <VisualEditor
              latexTemplate={latexTemplate}
              setLatexSource={setLatexSource}
              autoCompile={autoCompile}
            />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel className='p-4'>
            <Tabs defaultValue='preview' className='h-full'>
              <TabsList>
                <TabsTrigger value='preview'>Xem trước PDF</TabsTrigger>
                <TabsTrigger value='log'>Nhật ký biên dịch</TabsTrigger>
              </TabsList>
              <TabsContent value='preview' className='h-[calc(100%-44px)]'>
                {compilationStatus.error ? (
                  <div className='text-red-500 p-4'>{compilationStatus.error}</div>
                ) : compiledPdf ? (
                  <PdfViewer pdfUrl={compiledPdf} />
                ) : (
                  <div className='text-center text-gray-500'>
                    {'Nhấn "Biên dịch" để xem trước tài liệu'}
                  </div>
                )}
              </TabsContent>
              <TabsContent value='log'>
                {compilationStatus.error && (
                  <div className='text-red-500 p-4'>{compilationStatus.error}</div>
                )}
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
