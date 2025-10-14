// src/components/pdf-processor.ts
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'

interface MaskArea {
  page: number
  x: number
  y: number
  width: number
  height: number
  id: string
}

interface ExportOptions {
  watermark?: string
}

export class PDFProcessor {
  private pdfDoc: any = null
  private pdfLibDoc: PDFDocument | null = null
  private pages: any[] = []
  private maskAreas: MaskArea[] = []
  private renderPages: HTMLCanvasElement[] = []
  private pdfjsLib: any = null
  private isInitialized = false

  /**
   * PDF.js 초기화
   */
  async initializePDFJS(): Promise<void> {
    // 브라우저 환경 체크
    if (typeof window === 'undefined') {
      throw new Error('PDF 처리는 브라우저 환경에서만 가능합니다.')
    }

    // 이미 초기화되었으면 스킵
    if (this.isInitialized && window.pdfjsLib) {
      this.pdfjsLib = window.pdfjsLib
      return
    }

    try {
      // 이미 로드된 경우
      if (window.pdfjsLib) {
        this.pdfjsLib = window.pdfjsLib
        this.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        this.isInitialized = true
        return
      }

      // 스크립트 로드
      const script = document.createElement('script')
      script.id = 'pdfjs-script'
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.async = true
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('PDF.js 로딩 시간 초과 (10초)'))
        }, 10000)

        script.onload = () => {
          clearTimeout(timeout)
          resolve()
        }
        
        script.onerror = () => {
          clearTimeout(timeout)
          reject(new Error('PDF.js 스크립트 로딩 실패'))
        }
        
        document.head.appendChild(script)
      })

      // 라이브러리 로드 대기
      let attempts = 0
      const maxAttempts = 100
      
      while (!window.pdfjsLib && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 50))
        attempts++
      }

      if (!window.pdfjsLib) {
        throw new Error('PDF.js 라이브러리를 로드할 수 없습니다.')
      }

      this.pdfjsLib = window.pdfjsLib
      this.pdfjsLib.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      
      this.isInitialized = true
      console.log('PDF.js 초기화 완료')
      
    } catch (error: any) {
      console.error('PDF.js 초기화 실패:', error)
      throw new Error(`PDF.js 초기화 실패: ${error.message}`)
    }
  }

  /**
   * PDF 파일 로드 (비밀번호 보호 PDF 거부)
   */
  async loadPDF(file: File): Promise<void> {
    if (!this.isInitialized || !this.pdfjsLib) {
      await this.initializePDFJS()
    }

    try {
      const arrayBuffer = await file.arrayBuffer()
      const bufferCopy = arrayBuffer.slice(0)
      
      // PDF.js로 로드 시도
      const loadingTask = this.pdfjsLib.getDocument({
        data: bufferCopy,
        password: '',
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true,
        disableAutoFetch: true,
        disableStream: true
      })
      
      this.pdfDoc = await loadingTask.promise
      this.pages = []
      
      // 모든 페이지 로드
      for (let i = 1; i <= this.pdfDoc.numPages; i++) {
        try {
          const page = await this.pdfDoc.getPage(i)
          this.pages.push(page)
        } catch (pageError) {
          console.warn(`페이지 ${i} 로드 실패:`, pageError)
        }
      }

      // pdf-lib로 로드
      const bufferCopy2 = arrayBuffer.slice(0)
      this.pdfLibDoc = await PDFDocument.load(bufferCopy2, {
        ignoreEncryption: false
      })

    } catch (error: any) {
      // 비밀번호 에러 감지
      if (
        error.message?.includes('password') || 
        error.name === 'PasswordException' ||
        error.message?.includes('encrypted') ||
        error.message?.includes('암호화')
      ) {
        throw new Error('이 PDF는 비밀번호로 보호되어 있습니다. PDF 파일의 비밀번호를 먼저 제거한 후 다시 업로드해주세요.')
      }
      
      if (error.message?.includes('Invalid PDF')) {
        throw new Error('유효하지 않은 PDF 파일입니다.')
      }
      
      throw new Error(`PDF 파일을 로드할 수 없습니다: ${error.message}`)
    }
  }

  async prepareForRendering(): Promise<void> {
    if (!this.pages.length) {
      throw new Error('PDF가 로드되지 않았습니다.')
    }

    this.renderPages = []
    
    for (let i = 0; i < this.pages.length; i++) {
      try {
        const page = this.pages[i]
        const viewport = page.getViewport({ scale: 1.5 })
        
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')!
        
        canvas.width = viewport.width
        canvas.height = viewport.height

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          enableWebGL: false,
          renderInteractiveForms: false
        }

        await page.render(renderContext).promise
        this.renderPages.push(canvas)
        
      } catch (renderError) {
        console.warn(`페이지 ${i + 1} 렌더링 실패:`, renderError)
        
        // 에러 페이지 생성
        const canvas = document.createElement('canvas')
        canvas.width = 600
        canvas.height = 800
        const context = canvas.getContext('2d')!
        context.fillStyle = '#f5f5f5'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.fillStyle = '#666'
        context.font = '16px Arial'
        context.textAlign = 'center'
        context.fillText(`페이지 ${i + 1} 렌더링 실패`, canvas.width / 2, canvas.height / 2)
        this.renderPages.push(canvas)
      }
    }
  }

  getRenderedPages(): HTMLCanvasElement[] {
    return this.renderPages
  }

  addMaskArea(area: Omit<MaskArea, 'id'>): string {
    const id = `mask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const maskArea: MaskArea = { ...area, id }
    this.maskAreas.push(maskArea)
    return id
  }

  removeMaskArea(id: string): void {
    this.maskAreas = this.maskAreas.filter(area => area.id !== id)
  }

  clearAllMaskAreas(): void {
    this.maskAreas = []
  }

  updateMaskAreaPosition(id: string, x: number, y: number): void {
    const area = this.maskAreas.find(a => a.id === id)
    if (area) {
      area.x = x
      area.y = y
    }
  }

  updateMaskAreaSize(id: string, width: number, height: number): void {
    const area = this.maskAreas.find(a => a.id === id)
    if (area) {
      area.width = Math.max(10, width)
      area.height = Math.max(10, height)
    }
  }

  updateMaskArea(id: string, updates: Partial<Omit<MaskArea, 'id' | 'page'>>): void {
    const area = this.maskAreas.find(a => a.id === id)
    if (area) {
      if (updates.x !== undefined) area.x = updates.x
      if (updates.y !== undefined) area.y = updates.y
      if (updates.width !== undefined) area.width = Math.max(10, updates.width)
      if (updates.height !== undefined) area.height = Math.max(10, updates.height)
    }
  }

  getMaskAreaById(id: string): MaskArea | undefined {
    return this.maskAreas.find(area => area.id === id)
  }

  getMaskAreas(): MaskArea[] {
    return this.maskAreas
  }

  hasPageMasking(pageIndex: number): boolean {
    return this.maskAreas.some(area => area.page === pageIndex)
  }

  private async renderPageWithMasking(pageIndex: number): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    const originalCanvas = this.renderPages[pageIndex]
    canvas.width = originalCanvas.width
    canvas.height = originalCanvas.height
    
    ctx.drawImage(originalCanvas, 0, 0)
    
    const pageMasks = this.maskAreas.filter(area => area.page === pageIndex)
    pageMasks.forEach(area => {
      ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'
      ctx.fillRect(area.x, area.y, area.width, area.height)
    })
    
    return canvas
  }

  async exportPDF(options: ExportOptions = {}): Promise<Blob> {
    if (!this.pdfLibDoc) {
      throw new Error('PDF가 로드되지 않았습니다.')
    }

    try {
      const newPdf = await PDFDocument.create()
      
      for (let i = 0; i < this.pdfLibDoc.getPageCount(); i++) {
        const hasMasking = this.hasPageMasking(i)
        
        if (hasMasking) {
          const maskedCanvas = await this.renderPageWithMasking(i)
          const pngDataUrl = maskedCanvas.toDataURL('image/png')
          const pngImageBytes = await fetch(pngDataUrl).then(res => res.arrayBuffer())
          const pngImage = await newPdf.embedPng(pngImageBytes)
          
          const originalPage = this.pdfLibDoc.getPage(i)
          const { width, height } = originalPage.getSize()
          
          const page = newPdf.addPage([width, height])
          page.drawImage(pngImage, {
            x: 0,
            y: 0,
            width: width,
            height: height,
          })
        } else {
          const [copiedPage] = await newPdf.copyPages(this.pdfLibDoc, [i])
          newPdf.addPage(copiedPage)
        }
      }

      // 워터마크
      if (options.watermark) {
        try {
          const font = await newPdf.embedFont(StandardFonts.Helvetica)
          const fontSize = 48
          
          for (let i = 0; i < newPdf.getPageCount(); i++) {
            const page = newPdf.getPage(i)
            const { width, height } = page.getSize()
            
            page.drawText(options.watermark, {
              x: width / 2 - (options.watermark.length * fontSize * 0.3) / 2,
              y: height / 2,
              size: fontSize,
              font: font,
              color: rgb(0.7, 0.7, 0.7),
              rotate: degrees(-45),
              opacity: 0.3
            })
          }
        } catch (error) {
          console.warn('워터마크 추가 실패:', error)
        }
      }

      // 메타데이터 제거
      newPdf.setTitle('')
      newPdf.setAuthor('')
      newPdf.setSubject('')
      newPdf.setCreator('PrivacyPDF')
      newPdf.setProducer('PrivacyPDF')
      newPdf.setKeywords([])

      const pdfBytes = await newPdf.save()
      return new Blob([pdfBytes], { type: 'application/pdf' })

    } catch (error: any) {
      console.error('PDF 내보내기 실패:', error)
      throw new Error(`PDF를 내보낼 수 없습니다: ${error.message}`)
    }
  }
}

declare global {
  interface Window {
    pdfjsLib?: any
  }
}