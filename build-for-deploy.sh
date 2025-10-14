#!/bin/bash

set -e

echo "🔨 배포용 빌드 시작..."

# 1. next.config.js 확인 및 수정
echo "⚙️ Next.js 설정 확인..."
if [ ! -f "next.config.ts" ] && [ ! -f "next.config.js" ] && [ ! -f "next.config.mjs" ]; then
    echo "❌ next.config 파일이 없습니다!"
    exit 1
fi

# 2. 의존성 설치
echo "📦 의존성 설치..."
npm ci

# 3. Prisma 클라이언트 생성
echo "🗄️ Prisma 클라이언트 생성..."
npx prisma generate

# 4. Next.js 빌드
echo "⚡ Next.js 빌드..."
npm run build

# 5. standalone 폴더 확인
if [ ! -d ".next/standalone" ]; then
    echo "❌ standalone 빌드가 생성되지 않았습니다!"
    echo "next.config에 output: 'standalone'이 설정되어 있는지 확인하세요."
    exit 1
fi

# 6. 배포 패키지 생성
echo "📦 배포 패키지 생성..."
rm -rf deploy-package
mkdir -p deploy-package

# standalone 폴더 복사
cp -r .next/standalone/. deploy-package/

# static 파일 복사 (standalone에는 포함 안됨)
mkdir -p deploy-package/.next/static
cp -r .next/static/. deploy-package/.next/static/

# public 폴더 복사
cp -r public deploy-package/

# prisma 폴더 복사
cp -r prisma deploy-package/

# db 디렉토리 생성
mkdir -p deploy-package/db
if [ -f "db/custom.db" ]; then
    cp db/custom.db deploy-package/db/
fi

# 환경 변수 파일 생성
cat > deploy-package/.env << 'EOF'
DATABASE_URL="file:./db/custom.db"
NODE_ENV=production
PORT=3100
HOSTNAME=0.0.0.0
EOF

echo "✅ 빌드 완료!"
echo "📦 배포 패키지: deploy-package/"