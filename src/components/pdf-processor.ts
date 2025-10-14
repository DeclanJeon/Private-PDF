// Client-side only PDF processor - completely isolated from SSR
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
  password?: string
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

  async initializePDFJS(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('PDF 처리는 브라우저에서만 사용 가능합니다')
    }

    if (this.isInitialized) return

    try {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.async = true
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('PDF.js 로딩 시간 초과'))
        }, 10000)

        script.onload = () => {
          clearTimeout(timeout)
          resolve(null)
        }
        script.onerror = () => {
          clearTimeout(timeout)
          reject(new Error('PDF.js 스크립트 로드 실패'))
        }
        
        document.head.appendChild(script)
      })

      let attempts = 0
      while (!window.pdfjsLib && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 50))
        attempts++
      }

      if (!window.pdfjsLib) {
        throw new Error('PDF.js를 로드한 후에도 사용할 수 없습니다')
      }

      this.pdfjsLib = window.pdfjsLib
      this.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      
      this.isInitialized = true
      
    } catch (error: any) {
      throw new Error('PDF.js 초기화 실패: ' + error.message)
    }
  }

  async loadPDF(file: File, password?: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initializePDFJS()
    }

    try {
      const arrayBuffer = await file.arrayBuffer()
      const bufferCopy = arrayBuffer.slice(0)
      
      const loadingTask = this.pdfjsLib.getDocument({
        data: bufferCopy,
        password: password,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true,
        disableAutoFetch: true,
        disableStream: true
      })
      
      this.pdfDoc = await loadingTask.promise
      this.pages = []
      
      for (let i = 1; i <= this.pdfDoc.numPages; i++) {
        try {
          const page = await this.pdfDoc.getPage(i)
          this.pages.push(page)
        } catch (pageError) {
          console.warn(`페이지 ${i} 로드 실패:`, pageError)
        }
      }

      const bufferCopy2 = arrayBuffer.slice(0)
      this.pdfLibDoc = await PDFDocument.load(bufferCopy2, {
        ignoreEncryption: false
      })

    } catch (error: any) {
      if (error.message?.includes('password') || error.name === 'PasswordException') {
        throw new Error('PDF 비밀번호가 필요하거나 잘못되었습니다.')
      }
      if (error.message?.includes('Invalid PDF')) {
        throw new Error('유효하지 않은 PDF 파일입니다.')
      }
      throw new Error('PDF 로드 중 오류 발생: ' + error.message)
    }
  }

  async prepareForRendering(): Promise<void> {
    if (!this.pages.length) throw new Error('PDF가 로드되지 않았습니다.')

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
        console.warn(`페이지 ${i} 렌더링 실패:`, renderError)
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

  /**
   * 마스킹 영역 추가
   */
  addMaskArea(area: Omit<MaskArea, 'id'>): string {
    const id = `mask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const maskArea: MaskArea = { ...area, id }
    this.maskAreas.push(maskArea)
    return id
  }

  /**
   * 특정 마스킹 영역 삭제
   */
  removeMaskArea(id: string): void {
    this.maskAreas = this.maskAreas.filter(area => area.id !== id)
  }

  /**
   * 모든 마스킹 영역 초기화
   */
  clearAllMaskAreas(): void {
    this.maskAreas = []
  }

  /**
   * 마스킹 영역 위치 업데이트
   */
  updateMaskAreaPosition(id: string, x: number, y: number): void {
    const area = this.maskAreas.find(a => a.id === id)
    if (area) {
      area.x = x
      area.y = y
    }
  }

  /**
   * 마스킹 영역 크기 업데이트
   */
  updateMaskAreaSize(id: string, width: number, height: number): void {
    const area = this.maskAreas.find(a => a.id === id)
    if (area) {
      area.width = Math.max(10, width)
      area.height = Math.max(10, height)
    }
  }

  /**
   * 마스킹 영역 전체 업데이트
   */
  updateMaskArea(id: string, updates: Partial<Omit<MaskArea, 'id' | 'page'>>): void {
    const area = this.maskAreas.find(a => a.id === id)
    if (area) {
      if (updates.x !== undefined) area.x = updates.x
      if (updates.y !== undefined) area.y = updates.y
      if (updates.width !== undefined) area.width = Math.max(10, updates.width)
      if (updates.height !== undefined) area.height = Math.max(10, updates.height)
    }
  }

  /**
   * ID로 마스킹 영역 찾기
   */
  getMaskAreaById(id: string): MaskArea | undefined {
    return this.maskAreas.find(area => area.id === id)
  }

  /**
   * 모든 마스킹 영역 가져오기
   */
  getMaskAreas(): MaskArea[] {
    return this.maskAreas
  }

  /**
   * 특정 페이지에 마스킹이 있는지 확인
   */
  hasPageMasking(pageIndex: number): boolean {
    return this.maskAreas.some(area => area.page === pageIndex)
  }

  /**
   * 마스킹이 적용된 페이지를 이미지로 변환
   */
  private async renderPageWithMasking(pageIndex: number): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    // 원본 페이지 렌더링
    const originalCanvas = this.renderPages[pageIndex]
    canvas.width = originalCanvas.width
    canvas.height = originalCanvas.height
    
    // 원본 이미지 그리기
    ctx.drawImage(originalCanvas, 0, 0)
    
    // 마스킹 영역 그리기
    const pageMasks = this.maskAreas.filter(area => area.page === pageIndex)
    pageMasks.forEach(area => {
      ctx.fillStyle = 'rgba(0, 0, 0, 1.0)' // 완전 불투명
      ctx.fillRect(area.x, area.y, area.width, area.height)
    })
    
    return canvas
  }

  async exportPDF(options: ExportOptions = {}): Promise<Blob> {
    if (!this.pdfLibDoc) throw new Error('PDF가 로드되지 않았습니다.')

    try {
      const newPdf = await PDFDocument.create()
      
      // 페이지별로 처리
      for (let i = 0; i < this.pdfLibDoc.getPageCount(); i++) {
        const hasMasking = this.hasPageMasking(i)
        
        if (hasMasking) {
          // 마스킹이 있는 페이지: 이미지로 변환하여 삽입
          console.log(`페이지 ${i + 1}: 마스킹 감지 - 이미지로 변환`)
          
          // 마스킹이 적용된 캔버스 생성
          const maskedCanvas = await this.renderPageWithMasking(i)
          
          // 캔버스를 PNG로 변환
          const pngDataUrl = maskedCanvas.toDataURL('image/png')
          const pngImageBytes = await fetch(pngDataUrl).then(res => res.arrayBuffer())
          
          // PNG 이미지를 PDF에 임베드
          const pngImage = await newPdf.embedPng(pngImageBytes)
          
          // 원본 페이지 크기 가져오기
          const originalPage = this.pdfLibDoc.getPage(i)
          const { width, height } = originalPage.getSize()
          
          // 새 페이지 생성 및 이미지 삽입
          const page = newPdf.addPage([width, height])
          page.drawImage(pngImage, {
            x: 0,
            y: 0,
            width: width,
            height: height,
          })
          
          console.log(`페이지 ${i + 1}: 이미지 변환 완료 (${width}x${height})`)
        } else {
          // 마스킹이 없는 페이지: 원본 그대로 복사
          console.log(`페이지 ${i + 1}: 마스킹 없음 - 원본 복사`)
          const [copiedPage] = await newPdf.copyPages(this.pdfLibDoc, [i])
          newPdf.addPage(copiedPage)
        }
      }

      // 워터마크 추가
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

      // 비밀번호 보호 - pdf-lib does not support encryption, so we skip this functionality
      if (options.password) {
        console.warn('비밀번호 보호는 현재 pdf-lib에서 지원되지 않습니다.')
      }

      // 메타데이터 제거
      newPdf.setTitle('')
      newPdf.setAuthor('')
      newPdf.setSubject('')
      newPdf.setCreator('PrivacyPDF')
      newPdf.setProducer('PrivacyPDF')
      newPdf.setKeywords([])

      const pdfBytes = await newPdf.save()
      console.log('PDF 내보내기 완료, 크기:', pdfBytes.length)
      return new Blob([pdfBytes], { type: 'application/pdf' })

    } catch (error: any) {
      console.error('PDF 내보내기 오류:', error)
      throw new Error('PDF 내보내기 중 오류 발생: ' + error.message)
    }
  }
}

declare global {
  interface Window {
    pdfjsLib?: any
  }
}
