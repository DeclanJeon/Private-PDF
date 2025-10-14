'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { 
  Upload, 
  Shield, 
  Download, 
  Eye, 
  Lock, 
  Unlock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Zap
} from 'lucide-react'

const PDFViewer = dynamic(() => import('@/components/pdf-viewer').then(mod => ({ default: mod.PDFViewer })), {
  ssr: false,
  loading: () => <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})

const WatermarkSettings = dynamic(() => import('@/components/watermark-settings').then(mod => ({ default: mod.WatermarkSettings })), {
  ssr: false,
  loading: () => <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})

export default function PrivacyPDF() {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfPassword, setPdfPassword] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedPdf, setProcessedPdf] = useState<Blob | null>(null)
  const [activeTab, setActiveTab] = useState('upload')
  const [processingProgress, setProcessingProgress] = useState(0)
  const [watermarkEnabled, setWatermarkEnabled] = useState(false)
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL')
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [isClient, setIsClient] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfProcessorRef = useRef<any>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const initializeProcessor = useCallback(async () => {
    if (!isClient) return null
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (document.getElementById('pdfjs-script')) {
        let attempts = 0
        while (!window.pdfjsLib && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100))
          attempts++
        }
      }
      
      const { PDFProcessor } = await import('@/components/pdf-processor')
      const processor = new PDFProcessor()
      
      try {
        await processor.initializePDFJS()
      } catch (initError: any) {
        console.error('PDF.js 초기화 실패:', initError)
        throw new Error('PDF.js 초기화 실패: ' + initError.message)
      }
      
      return processor
    } catch (error: any) {
      console.error('PDF 프로세서 초기화 실패:', error)
      setError('PDF 프로세서 초기화 실패: ' + error.message)
      return null
    }
  }, [isClient])

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || file.type !== 'application/pdf') {
      setError('PDF 파일만 업로드 가능합니다.')
      return
    }

    setPdfFile(file)
    setError('')
    setSuccess('')
    setActiveTab('processing')
  }, [])

  const handlePasswordSubmit = useCallback(async () => {
    if (!pdfFile) return

    try {
      setIsProcessing(true)
      setProcessingProgress(10)

      const processor = await initializeProcessor()
      if (!processor) {
        throw new Error('PDF 프로세서를 초기화할 수 없습니다.')
      }
      
      pdfProcessorRef.current = processor
      setProcessingProgress(30)
      
      await processor.loadPDF(pdfFile, pdfPassword)
      setProcessingProgress(50)

      await processor.prepareForRendering()
      setProcessingProgress(90)

      setSuccess('PDF가 성공적으로 로드되었습니다.')
      setActiveTab('masking')
      setProcessingProgress(100)

    } catch (error: any) {
      console.error('PDF 처리 오류:', error)
      setError(error.message || 'PDF 처리 중 오류가 발생했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }, [pdfFile, pdfPassword, initializeProcessor])

  const handleDownload = useCallback(async () => {
    if (!pdfProcessorRef.current) {
      setError('PDF 프로세서가 초기화되지 않았습니다.')
      return
    }

    try {
      setIsProcessing(true)
      
      const blob = await pdfProcessorRef.current.exportPDF({
        password: pdfPassword,
        watermark: watermarkEnabled ? watermarkText : undefined
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `masked_${pdfFile?.name || 'document.pdf'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccess('마스킹된 PDF가 다운로드되었습니다.')
    } catch (error: any) {
      console.error('다운로드 오류:', error)
      setError(error.message || 'PDF 다운로드 중 오류가 발생했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }, [pdfFile, pdfPassword, watermarkEnabled, watermarkText])

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>로딩 중...</p>
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
            수동 마스킹으로 문서 보안 강화
          </p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            민감한 정보를 직접 선택하여 마스킹하세요. 
            모든 처리는 100% 로컬에서 이루어지며, 파일이 서버로 전송되지 않습니다.
          </p>
        </div>

        {/* 메인 콘텐츠 */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              PDF 마스킹 도구
            </CardTitle>
            <CardDescription>
              민감한 정보를 수동으로 선택하여 마스킹하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 에러/성공 메시지 */}
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 dark:text-red-300">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  업로드
                </TabsTrigger>
                <TabsTrigger value="processing" disabled={!pdfFile} className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  처리
                </TabsTrigger>
                <TabsTrigger value="masking" disabled={!pdfProcessorRef.current} className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  마스킹
                </TabsTrigger>
                <TabsTrigger value="download" disabled={!pdfProcessorRef.current} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  다운로드
                </TabsTrigger>
              </TabsList>

              {/* 업로드 탭 */}
              <TabsContent value="upload" className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">PDF 파일 업로드</h3>
                  <p className="text-muted-foreground mb-4">
                    마스킹할 PDF 파일을 선택하세요
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    파일 선택
                  </Button>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    주요 기능
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>✓ 수동 영역 선택 마스킹</li>
                    <li>✓ 마스킹 영역 드래그 이동</li>
                    <li>✓ 개별/전체 마스킹 삭제</li>
                    <li>✓ 로컬 처리로 완벽한 보안</li>
                  </ul>
                </div>
              </TabsContent>

              {/* 처리 탭 */}
              <TabsContent value="processing" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="password" className="flex items-center gap-2 mb-2">
                      {pdfPassword ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      PDF 비밀번호 (선택사항)
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="비밀번호 입력"
                      value={pdfPassword}
                      onChange={(e) => setPdfPassword(e.target.value)}
                    />
                  </div>

                  {isProcessing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>처리 중...</span>
                        <span>{processingProgress}%</span>
                      </div>
                      <Progress value={processingProgress} className="w-full" />
                    </div>
                  )}

                  <Button 
                    onClick={handlePasswordSubmit}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Zap className="w-4 h-4 mr-2 animate-spin" />
                        처리 중...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        PDF 로드하기
                      </>
                    )}
                  </Button>
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
                <div className="space-y-4">
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
                      처리 완료 내역
                    </h4>
                    <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                      <li>✓ 선택한 영역 마스킹 완료</li>
                      <li>✓ 메타데이터 제거</li>
                      <li>✓ 로컬 처리 완료</li>
                      {watermarkEnabled && <li>✓ 워터마크 추가됨</li>}
                      <li>✓ 다운로드 준비 완료</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 푸터 */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>PrivacyPDF - 수동 마스킹으로 문서 보안 강화</p>
          <p className="mt-1">모든 처리는 로컬에서 이루어집니다</p>
        </div>
      </div>
    </div>
  )
}
