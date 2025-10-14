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
          Watermark Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Add Watermark</Label>
            <p className="text-sm text-muted-foreground">
              Add a watermark to the PDF to enhance document security
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
              <Label htmlFor="watermark-text">Watermark Text</Label>
              <Input
                id="watermark-text"
                value={text}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="Enter watermark text"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Predefined Text</Label>
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
              <p className="font-medium mb-1">Watermark Features:</p>
              <ul className="space-y-1">
                <li>• Displayed at a 45-degree angle</li>
                <li>• Displayed in semi-transparent white</li>
                <li>• Applied identically to all pages</li>
                <li>• Maintained when copying the document</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}