'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Square, 
  Download,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  Trash2,
  RefreshCw,
  Maximize2
} from 'lucide-react'

interface MaskArea {
  page: number
  x: number
  y: number
  width: number
  height: number
  id: string
}

interface PDFProcessor {
  getRenderedPages(): HTMLCanvasElement[]
  addMaskArea(area: Omit<MaskArea, 'id'>): string
  removeMaskArea(id: string): void
  clearAllMaskAreas(): void
  updateMaskAreaPosition(id: string, x: number, y: number): void
  updateMaskAreaSize(id: string, width: number, height: number): void
  updateMaskArea(id: string, updates: Partial<Omit<MaskArea, 'id' | 'page'>>): void
  getMaskAreaById(id: string): MaskArea | undefined
  getMaskAreas(): MaskArea[]
  hasPageMasking(pageIndex: number): boolean
  exportPDF(options?: any): Promise<Blob>
}

interface PDFViewerProps {
  processor: PDFProcessor
  onProcessed: (blob: Blob) => void
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null

export function PDFViewer({ processor, onProcessed }: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [scale, setScale] = useState(1.0)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null)
  const [maskAreas, setMaskAreas] = useState<MaskArea[]>([])
  const [isDraggingMode, setIsDraggingMode] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [canvasOffset, setCanvasOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isClient, setIsClient] = useState(false)
  const [selectedMaskId, setSelectedMaskId] = useState<string | null>(null)
  const [isDraggingMask, setIsDraggingMask] = useState(false)
  const [maskDragStart, setMaskDragStart] = useState<{ x: number; y: number } | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null)
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; area: MaskArea } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    setMaskAreas(processor.getMaskAreas())
  }, [processor, isClient])

  useEffect(() => {
    if (!isClient) return
    renderPage()
  }, [currentPage, scale, maskAreas, selectedMaskId, isClient])

  /**
   * 리사이즈 핸들 위치 확인
   */
  const getResizeHandle = (x: number, y: number, area: MaskArea): ResizeHandle => {
    const handleSize = 10
    const threshold = handleSize / scale

    // 모서리 핸들
    if (Math.abs(x - area.x) < threshold && Math.abs(y - area.y) < threshold) return 'nw'
    if (Math.abs(x - (area.x + area.width)) < threshold && Math.abs(y - area.y) < threshold) return 'ne'
    if (Math.abs(x - area.x) < threshold && Math.abs(y - (area.y + area.height)) < threshold) return 'sw'
    if (Math.abs(x - (area.x + area.width)) < threshold && Math.abs(y - (area.y + area.height)) < threshold) return 'se'

    // 엣지 핸들
    if (Math.abs(y - area.y) < threshold && x > area.x && x < area.x + area.width) return 'n'
    if (Math.abs(y - (area.y + area.height)) < threshold && x > area.x && x < area.x + area.width) return 's'
    if (Math.abs(x - area.x) < threshold && y > area.y && y < area.y + area.height) return 'w'
    if (Math.abs(x - (area.x + area.width)) < threshold && y > area.y && y < area.y + area.height) return 'e'

    return null
  }

  /**
   * 커서 스타일 결정
   */
  const getCursorStyle = (handle: ResizeHandle): string => {
    if (!handle) return 'default'
    const cursors: Record<NonNullable<ResizeHandle>, string> = {
     'nw': 'nw-resize',
     'ne': 'ne-resize',
     'sw': 'sw-resize',
     'se': 'se-resize',
     'n': 'n-resize',
     's': 's-resize',
     'e': 'e-resize',
     'w': 'w-resize'
   }
   return cursors[handle as NonNullable<ResizeHandle>] || 'default'
  }

  /**
   * 페이지 렌더링 - 마스킹된 페이지는 이미지화
   */
  const renderPage = useCallback(() => {
    if (!canvasRef.current || !isClient) return

    const pages = processor.getRenderedPages()
    if (!pages[currentPage]) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const originalCanvas = pages[currentPage]

    canvas.width = originalCanvas.width * scale
    canvas.height = originalCanvas.height * scale

    ctx.scale(scale, scale)
    ctx.drawImage(originalCanvas, 0, 0)

    // 마스킹된 페이지인 경우 이미지화 (텍스트 선택 방지)
    const hasMasking = processor.hasPageMasking(currentPage)
    if (hasMasking) {
      // 캔버스를 이미지로 변환하여 다시 그림 (텍스트 레이어 제거)
      const imageData = ctx.getImageData(0, 0, originalCanvas.width, originalCanvas.height)
      ctx.putImageData(imageData, 0, 0)
    }

    // 마스킹 영역 그리기
    maskAreas
      .filter(area => area.page === currentPage)
      .forEach(area => {
        // 마스킹 사각형
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
        ctx.fillRect(area.x, area.y, area.width, area.height)
        
        // 선택된 마스킹 영역 강조
        if (area.id === selectedMaskId) {
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'
          ctx.lineWidth = 3
          ctx.strokeRect(area.x, area.y, area.width, area.height)

          // 리사이즈 핸들 표시
          const handleSize = 8
          ctx.fillStyle = 'rgba(59, 130, 246, 1)'
          
          // 모서리 핸들
          ctx.fillRect(area.x - handleSize/2, area.y - handleSize/2, handleSize, handleSize)
          ctx.fillRect(area.x + area.width - handleSize/2, area.y - handleSize/2, handleSize, handleSize)
          ctx.fillRect(area.x - handleSize/2, area.y + area.height - handleSize/2, handleSize, handleSize)
          ctx.fillRect(area.x + area.width - handleSize/2, area.y + area.height - handleSize/2, handleSize, handleSize)
          
          // 엣지 핸들
          ctx.fillRect(area.x + area.width/2 - handleSize/2, area.y - handleSize/2, handleSize, handleSize)
          ctx.fillRect(area.x + area.width/2 - handleSize/2, area.y + area.height - handleSize/2, handleSize, handleSize)
          ctx.fillRect(area.x - handleSize/2, area.y + area.height/2 - handleSize/2, handleSize, handleSize)
          ctx.fillRect(area.x + area.width - handleSize/2, area.y + area.height/2 - handleSize/2, handleSize, handleSize)
        } else {
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)'
          ctx.lineWidth = 2
          ctx.strokeRect(area.x, area.y, area.width, area.height)
        }
      })
  }, [currentPage, scale, maskAreas, processor, selectedMaskId, isClient])

  /**
   * 마우스 다운 이벤트 핸들러
   */
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = overlayRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left) / scale
    const y = (e.clientY - rect.top) / scale

    // 선택된 마스킹 영역의 리사이즈 핸들 확인
    if (selectedMaskId) {
      const selectedArea = processor.getMaskAreaById(selectedMaskId)
      if (selectedArea && selectedArea.page === currentPage) {
        const handle = getResizeHandle(x, y, selectedArea)
        if (handle) {
          setIsResizing(true)
          setResizeHandle(handle)
          setResizeStart({ x, y, area: { ...selectedArea } })
          return
        }
      }
    }

    // 마스킹 영역 클릭 확인
    const clickedMask = maskAreas
      .filter(area => area.page === currentPage)
      .reverse()
      .find(area => 
        x >= area.x && x <= area.x + area.width &&
        y >= area.y && y <= area.y + area.height
      )

    if (clickedMask) {
      setSelectedMaskId(clickedMask.id)
      setIsDraggingMask(true)
      setMaskDragStart({ x: x - clickedMask.x, y: y - clickedMask.y })
      return
    }

    setSelectedMaskId(null)

    if (isDraggingMode) {
      setDragStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y })
    } else if (isSelecting) {
      setSelectionStart({ x, y })
      setSelectionEnd({ x, y })
    }
  }

  /**
   * 마우스 이동 이벤트 핸들러
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = overlayRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left) / scale
    const y = (e.clientY - rect.top) / scale

    // 리사이즈 중
    if (isResizing && selectedMaskId && resizeStart && resizeHandle) {
      const dx = x - resizeStart.x
      const dy = y - resizeStart.y
      const originalArea = resizeStart.area

      let newX = originalArea.x
      let newY = originalArea.y
      let newWidth = originalArea.width
      let newHeight = originalArea.height

      switch (resizeHandle) {
        case 'nw':
          newX = originalArea.x + dx
          newY = originalArea.y + dy
          newWidth = originalArea.width - dx
          newHeight = originalArea.height - dy
          break
        case 'ne':
          newY = originalArea.y + dy
          newWidth = originalArea.width + dx
          newHeight = originalArea.height - dy
          break
        case 'sw':
          newX = originalArea.x + dx
          newWidth = originalArea.width - dx
          newHeight = originalArea.height + dy
          break
        case 'se':
          newWidth = originalArea.width + dx
          newHeight = originalArea.height + dy
          break
        case 'n':
          newY = originalArea.y + dy
          newHeight = originalArea.height - dy
          break
        case 's':
          newHeight = originalArea.height + dy
          break
        case 'w':
          newX = originalArea.x + dx
          newWidth = originalArea.width - dx
          break
        case 'e':
          newWidth = originalArea.width + dx
          break
      }

      processor.updateMaskArea(selectedMaskId, { x: newX, y: newY, width: newWidth, height: newHeight })
      setMaskAreas([...processor.getMaskAreas()])
      return
    }

    // 마스킹 영역 드래그
    if (isDraggingMask && selectedMaskId && maskDragStart) {
      const newX = x - maskDragStart.x
      const newY = y - maskDragStart.y
      processor.updateMaskAreaPosition(selectedMaskId, newX, newY)
      setMaskAreas([...processor.getMaskAreas()])
      return
    }

    // 캔버스 드래그
    if (isDraggingMode && dragStart) {
      setCanvasOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
      return
    }

    // 새 마스킹 영역 선택
    if (isSelecting && selectionStart) {
      setSelectionEnd({ x, y })
      return
    }

    // 커서 스타일 업데이트 (호버 시)
    if (selectedMaskId && !isDraggingMask && !isResizing) {
      const selectedArea = processor.getMaskAreaById(selectedMaskId)
      if (selectedArea && selectedArea.page === currentPage) {
        const handle = getResizeHandle(x, y, selectedArea)
        if (overlayRef.current) {
          overlayRef.current.style.cursor = handle ? getCursorStyle(handle) : 'move'
        }
      }
    }
  }

  /**
   * 마우스 업 이벤트 핸들러
   */
  const handleMouseUp = () => {
    if (isResizing) {
      setIsResizing(false)
      setResizeHandle(null)
      setResizeStart(null)
      return
    }

    if (isDraggingMask) {
      setIsDraggingMask(false)
      setMaskDragStart(null)
      return
    }

    if (isDraggingMode) {
      setDragStart(null)
      return
    }

    if (isSelecting && selectionStart && selectionEnd) {
      const x = Math.min(selectionStart.x, selectionEnd.x)
      const y = Math.min(selectionStart.y, selectionEnd.y)
      const width = Math.abs(selectionEnd.x - selectionStart.x)
      const height = Math.abs(selectionEnd.y - selectionStart.y)

      if (width > 5 && height > 5) {
        const id = processor.addMaskArea({
          page: currentPage,
          x,
          y,
          width,
          height
        })
        setMaskAreas([...processor.getMaskAreas()])
        setSelectedMaskId(id)
      }

      setSelectionStart(null)
      setSelectionEnd(null)
    }
  }

  /**
   * 선택된 마스킹 영역 삭제
   */
  const removeSelectedMask = () => {
    if (selectedMaskId) {
      processor.removeMaskArea(selectedMaskId)
      setMaskAreas([...processor.getMaskAreas()])
      setSelectedMaskId(null)
    }
  }

  /**
   * 모든 마스킹 영역 초기화
   */
  const clearAllMasks = () => {
    processor.clearAllMaskAreas()
    setMaskAreas([])
    setSelectedMaskId(null)
  }

  /**
   * PDF 내보내기
   */
  const exportPDF = async () => {
    try {
      const blob = await processor.exportPDF()
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `masked_document_${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      onProcessed(blob)
    } catch (error: any) {
      console.error('PDF 내보내기 오류:', error)
      alert('PDF 내보내기 중 오류가 발생했습니다: ' + error.message)
    }
  }

  const nextPage = () => {
    const pages = processor.getRenderedPages()
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1)
      setSelectedMaskId(null)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
      setSelectedMaskId(null)
    }
  }

  const zoomIn = () => {
    setScale(Math.min(scale + 0.25, 3.0))
  }

  const zoomOut = () => {
    setScale(Math.max(scale - 0.25, 0.5))
  }

  const resetView = () => {
    setScale(1.0)
    setCanvasOffset({ x: 0, y: 0 })
  }

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const pages = processor.getRenderedPages()
  const totalPages = pages.length
  const currentPageMasks = maskAreas.filter(area => area.page === currentPage)
  const hasMasking = processor.hasPageMasking(currentPage)

  // 동적 커서 스타일
  let cursorStyle = 'default'
  if (isResizing) {
    cursorStyle = getCursorStyle(resizeHandle)
  } else if (isDraggingMask) {
    cursorStyle = 'grabbing'
  } else if (isSelecting) {
    cursorStyle = 'crosshair'
  } else if (isDraggingMode) {
    cursorStyle = 'move'
  } else if (selectedMaskId) {
    cursorStyle = 'move'
  }

  return (
    <div className="space-y-4">
      {/* 컨트롤 */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={isSelecting ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsSelecting(!isSelecting)
              setIsDraggingMode(false)
            }}
          >
            <Square className="w-4 h-4 mr-2" />
            영역 선택
          </Button>
          
          <Button
            variant={isDraggingMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsDraggingMode(!isDraggingMode)
              setIsSelecting(false)
            }}
          >
            <Move className="w-4 h-4 mr-2" />
            화면 이동
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={removeSelectedMask}
            disabled={!selectedMaskId}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            선택 삭제
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={clearAllMasks}
            disabled={maskAreas.length === 0}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            전체 초기화
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={zoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium px-2 py-1">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={zoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={resetView}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF 뷰어 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>PDF 뷰어 - 페이지 {currentPage + 1} / {totalPages}</span>
              {hasMasking && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  텍스트 선택 불가 (마스킹됨)
                </span>
              )}
            </div>
            {/* <Button onClick={exportPDF} size="sm">
              <Download className="w-4 h-4 mr-2" />
              다운로드
            </Button> */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-auto border rounded-lg bg-gray-50">
            <div
              ref={containerRef}
              className="relative inline-block"
              style={{
                transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`
              }}
            >
              <canvas
                ref={canvasRef}
                className="block"
                style={{
                  cursor: cursorStyle,
                  userSelect: hasMasking ? 'none' : 'auto',
                  WebkitUserSelect: hasMasking ? 'none' : 'auto',
                  MozUserSelect: hasMasking ? 'none' : 'auto',
                  msUserSelect: hasMasking ? 'none' : 'text' as const
                }}
              />
              
              {/* 오버레이 */}
              <div
                ref={overlayRef}
                className="absolute top-0 left-0 w-full h-full"
                style={{ 
                  cursor: cursorStyle,
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none' as const
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* 선택 사각형 */}
                {selectionStart && selectionEnd && (
                  <div
                    className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-30"
                    style={{
                      left: Math.min(selectionStart.x, selectionEnd.x) * scale,
                      top: Math.min(selectionStart.y, selectionEnd.y) * scale,
                      width: Math.abs(selectionEnd.x - selectionStart.x) * scale,
                      height: Math.abs(selectionEnd.y - selectionStart.y) * scale,
                      pointerEvents: 'none'
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 페이지 네비게이션 */}
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={prevPage}
              disabled={currentPage === 0}
            >
              이전
            </Button>
            <span className="text-sm font-medium px-3 py-1">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={currentPage === totalPages - 1}
            >
              다음
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 마스킹 영역 목록 */}
      {currentPageMasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4" />
              현재 페이지 마스킹 영역 ({currentPageMasks.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {currentPageMasks.map((area) => (
                  <div
                    key={area.id}
                    className={`flex items-center justify-between p-2 rounded border ${
                      area.id === selectedMaskId 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-gray-50 border-gray-200'
                    } cursor-pointer hover:bg-gray-100`}
                    onClick={() => setSelectedMaskId(area.id)}
                  >
                    <div className="flex-1">
                      <span className="text-sm font-medium">
                        영역 {currentPageMasks.indexOf(area) + 1}
                      </span>
                      <div className="text-xs text-gray-500">
                        위치: ({Math.round(area.x)}, {Math.round(area.y)}) 
                        크기: {Math.round(area.width)}×{Math.round(area.height)}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        processor.removeMaskArea(area.id)
                        setMaskAreas([...processor.getMaskAreas()])
                        if (selectedMaskId === area.id) {
                          setSelectedMaskId(null)
                        }
                      }}
                      className="ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* 사용 안내 */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💡 사용 방법
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• <strong>영역 선택:</strong> 드래그하여 새 마스킹 영역 생성</li>
            <li>• <strong>영역 이동:</strong> 마스킹 영역 클릭 후 드래그</li>
            <li>• <strong>크기 조절:</strong> 선택된 영역의 모서리/엣지 핸들 드래그</li>
            <li>• <strong>삭제:</strong> 영역 선택 후 "선택 삭제" 버튼 또는 목록에서 삭제</li>
            <li>• <strong>텍스트 선택 방지:</strong> 마스킹된 페이지는 자동으로 이미지화됨</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
