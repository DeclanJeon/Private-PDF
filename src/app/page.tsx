'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  Shield, 
  Download, 
  Eye,
  AlertTriangle,
  CheckCircle,
  FileText,
  Info
} from 'lucide-react'

const PDFViewer = dynamic(
  () => import('@/components/pdf-viewer').then(mod => ({ default: mod.PDFViewer })), 
  { 
    ssr: false,
    loading: () => (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
)

const WatermarkSettings = dynamic(
  () => import('@/components/watermark-settings').then(mod => ({ default: mod.WatermarkSettings })), 
  { 
    ssr: false,
    loading: () => (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
)

export default function PrivacyPDF() {
  // 상태 관리
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedPdf, setProcessedPdf] = useState<Blob | null>(null)
  const [activeTab, setActiveTab] = useState('upload')
  const [processingProgress, setProcessingProgress] = useState(0)
  const [watermarkEnabled, setWatermarkEnabled] = useState(false)
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL')
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [isMounted, setIsMounted] = useState(false)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfProcessorRef = useRef<any>(null)

  // 컴포넌트 마운트 체크
  useEffect(() => {
    setIsMounted(true)
  }, [])

  /**
   * PDF 프로세서 초기화
   */
  const initializeProcessor = useCallback(async () => {
    // 브라우저 환경 확인
    if (typeof window === 'undefined') {
      throw new Error('브라우저 환경에서만 실행 가능합니다.')
    }

    try {
      console.log('=== PDF 프로세서 초기화 시작 ===')
      
      // PDFProcessor 동적 import
      const { PDFProcessor } = await import('@/components/pdf-processor')
      const processor = new PDFProcessor()
      
      // PDF.js 초기화
      await processor.initializePDFJS()
      
      console.log('=== PDF 프로세서 초기화 완료 ===')
      return processor
      
    } catch (error: any) {
      console.error('PDF 프로세서 초기화 실패:', error)
      throw new Error(`프로세서 초기화 실패: ${error.message}`)
    }
  }, [])

  /**
   * 파일 업로드 핸들러
   */
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    
    if (!file) return
    
    if (file.type !== 'application/pdf') {
      setError('PDF 파일만 업로드 가능합니다.')
      return
    }

    console.log('파일 선택:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`)
    
    setPdfFile(file)
    setError('')
    setSuccess('')
    
    // 파일 처리 시작
    await processFile(file)
  }, [])

  /**
   * PDF 파일 처리
   */
  const processFile = useCallback(async (file: File) => {
    try {
      console.log('=== PDF 처리 시작 ===')
      setIsProcessing(true)
      setProcessingProgress(0)
      setError('')

      // 1단계: 프로세서 초기화
      console.log('1/4: 프로세서 초기화 중...')
      setProcessingProgress(10)
      
      const processor = await initializeProcessor()
      pdfProcessorRef.current = processor
      setProcessingProgress(30)

      // 2단계: PDF 로드
      console.log('2/4: PDF 파일 로드 중...')
      setProcessingProgress(40)
      
      await processor.loadPDF(file)
      setProcessingProgress(60)

      // 3단계: 렌더링 준비
      console.log('3/4: PDF 렌더링 준비 중...')
      setProcessingProgress(70)
      
      await processor.prepareForRendering()
      setProcessingProgress(90)

      // 4단계: 완료
      console.log('4/4: PDF 처리 완료')
      setSuccess('PDF 파일이 성공적으로 로드되었습니다.')
      setActiveTab('masking')
      setProcessingProgress(100)
      
      console.log('=== PDF 처리 완료 ===')

    } catch (error: any) {
      console.error('PDF 처리 실패:', error)
      
      // 에러 메시지 분류
      let errorMessage = error.message || 'PDF 파일을 처리할 수 없습니다.'
      
      if (error.message?.includes('비밀번호로 보호')) {
        errorMessage = error.message
      } else if (error.message?.includes('PDF.js')) {
        errorMessage = '브라우저에서 PDF를 처리할 수 없습니다. 페이지를 새로고침한 후 다시 시도해주세요.'
      } else if (error.message?.includes('Invalid PDF')) {
        errorMessage = '유효하지 않은 PDF 파일입니다. 다른 파일을 선택해주세요.'
      } else if (error.message?.includes('초기화')) {
        errorMessage = `${error.message} 페이지를 새로고침한 후 다시 시도해주세요.`
      }
      
      setError(errorMessage)
      
      // 상태 초기화
      setActiveTab('upload')
      setPdfFile(null)
      pdfProcessorRef.current = null
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
    } finally {
      setIsProcessing(false)
      setTimeout(() => setProcessingProgress(0), 500)
    }
  }, [initializeProcessor])

  /**
   * PDF 다운로드
   */
  const handleDownload = useCallback(async () => {
    if (!pdfProcessorRef.current) {
      setError('PDF 파일이 로드되지 않았습니다.')
      return
    }

    try {
      console.log('=== PDF 다운로드 시작 ===')
      setIsProcessing(true)
      setError('')
      
      const blob = await pdfProcessorRef.current.exportPDF({
        watermark: watermarkEnabled ? watermarkText : undefined
      })
      
      console.log('PDF 생성 완료:', `${(blob.size / 1024 / 1024).toFixed(2)} MB`)
      
      // 다운로드
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `masked_${pdfFile?.name || 'document.pdf'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccess('마스킹된 PDF가 다운로드되었습니다.')
      console.log('=== PDF 다운로드 완료 ===')
      
    } catch (error: any) {
      console.error('다운로드 실패:', error)
      setError(`PDF를 다운로드할 수 없습니다: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }, [pdfFile, watermarkEnabled, watermarkText])

  /**
   * 새 파일 선택
   */
  const handleSelectNewFile = useCallback(() => {
    setPdfFile(null)
    pdfProcessorRef.current = null
    setError('')
    setSuccess('')
    setActiveTab('upload')
    setProcessedPdf(null)
    setProcessingProgress(0)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // 마운트 전 로딩 화면
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">PrivacyPDF</h1>
          </div>
          <p className="text-xl text-muted-foreground mb-2">
            민감한 정보를 안전하게 가리세요
          </p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            모든 처리는 브라우저에서 이루어집니다. 
            파일이 서버로 전송되지 않으므로 100% 안전합니다.
          </p>
        </div>

        {/* 메인 카드 */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                PDF 마스킹 도구
              </div>
              {pdfFile && !isProcessing && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSelectNewFile}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  다른 파일 선택
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              {pdfFile 
                ? `현재 파일: ${pdfFile.name} (${(pdfFile.size / 1024 / 1024).toFixed(2)} MB)`
                : 'PDF 파일을 업로드하여 민감한 정보를 가리세요'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* 에러 메시지 */}
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 dark:text-red-300">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            {/* 성공 메시지 */}
            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  업로드
                </TabsTrigger>
                <TabsTrigger 
                  value="masking" 
                  disabled={!pdfProcessorRef.current} 
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  마스킹
                </TabsTrigger>
                <TabsTrigger 
                  value="download" 
                  disabled={!pdfProcessorRef.current} 
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  다운로드
                </TabsTrigger>
              </TabsList>

              {/* 업로드 탭 */}
              <TabsContent value="upload" className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">PDF 파일 선택</h3>
                  <p className="text-muted-foreground mb-4">
                    클릭하여 PDF 파일을 선택하세요
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto"
                    disabled={isProcessing}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isProcessing ? '처리 중...' : '파일 선택'}
                  </Button>
                </div>

                {/* 진행률 표시 */}
                {isProcessing && processingProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>PDF 처리 중...</span>
                      <span>{processingProgress}%</span>
                    </div>
                    <Progress value={processingProgress} className="w-full" />
                  </div>
                )}
                
                {/* 안내 사항 */}
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        중요 안내
                      </h4>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• <strong>비밀번호로 보호된 PDF는 지원되지 않습니다</strong></li>
                        <li>• PDF 파일의 비밀번호를 먼저 제거한 후 업로드해주세요</li>
                        <li>• 모든 처리는 브라우저에서 진행되며 서버로 전송되지 않습니다</li>
                        <li>• 파일 크기가 클 경우 처리 시간이 다소 소요될 수 있습니다</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* 마스킹 탭 */}
              <TabsContent value="masking" className="space-y-4">
                {pdfProcessorRef.current && (
                  <PDFViewer 
                    processor={pdfProcessorRef.current}
                    onProcessed={(blob) => setProcessedPdf(blob)}
                  />
                )}
              </TabsContent>

              {/* 다운로드 탭 */}
              <TabsContent value="download" className="space-y-4">
                <WatermarkSettings
                  enabled={watermarkEnabled}
                  onEnabledChange={setWatermarkEnabled}
                  text={watermarkText}
                  onTextChange={setWatermarkText}
                />

                <Button 
                  onClick={handleDownload}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  마스킹된 PDF 다운로드
                </Button>

                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    다운로드 전 확인사항
                  </h4>
                  <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                    <li>• 모든 마스킹 영역이 올바르게 설정되었는지 확인하세요</li>
                    <li>• 마스킹된 영역은 영구적으로 가려집니다</li>
                    <li>• 원본 파일은 변경되지 않습니다</li>
                    {watermarkEnabled && <li>• 워터마크가 추가됩니다</li>}
                    <li>• 다운로드된 파일은 안전하게 보관하세요</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 푸터 */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>PrivacyPDF - 브라우저 기반 개인정보 보호 도구</p>
          <p className="mt-1">파일은 서버로 전송되지 않습니다</p>
        </div>
      </div>
    </div>
  )
}