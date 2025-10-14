'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Settings, Droplet } from 'lucide-react'

interface WatermarkSettingsProps {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  text: string
  onTextChange: (text: string) => void
}

export function WatermarkSettings({
  enabled,
  onEnabledChange,
  text,
  onTextChange
}: WatermarkSettingsProps) {
  const watermarkPresets = [
    'CONFIDENTIAL',
    'TOP SECRET',
    'INTERNAL USE ONLY',
    'DRAFT',
    'DO NOT COPY',
    'SENSITIVE INFORMATION'
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplet className="w-5 h-5" />
          워터마크 설정
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>워터마크 추가</Label>
            <p className="text-sm text-muted-foreground">
              PDF에 워터마크를 추가하여 문서 보안을 강화합니다
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={onEnabledChange}
          />
        </div>

        {enabled && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="watermark-text">워터마크 텍스트</Label>
              <Input
                id="watermark-text"
                value={text}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="워터마크 텍스트를 입력하세요"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">미리 설정된 텍스트</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {watermarkPresets.map((preset) => (
                  <Badge
                    key={preset}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => onTextChange(preset)}
                  >
                    {preset}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded">
              <p className="font-medium mb-1">워터마크 특징:</p>
              <ul className="space-y-1">
                <li>• 45도 각도로 기울어져 표시됩니다</li>
                <li>• 반투명 흰색으로 표시됩니다</li>
                <li>• 모든 페이지에 동일하게 적용됩니다</li>
                <li>• 문서 복사 시에도 유지됩니다</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}