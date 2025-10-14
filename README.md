# 🛡️ Private PDF

Private PDF는 브라우저에서 PDF 파일의 민감한 정보를 안전하게 마스킹하고 보호하는 웹 애플리케이션입니다. 이 도구를 사용하면 파일이 서버로 전송되지 않고 모든 처리가 로컬 브라우저에서 이루어지기 때문에 보안이 매우 뛰어납니다.

## ✨ 주요 기능

### 🎯 핵심 기능
- **PDF 마스킹**: PDF 문서에서 선택한 영역을 검은 사각형으로 가려 민감한 정보를 보호
- **텍스트 선택 방지**: 마스킹된 페이지는 이미지로 변환되어 텍스트 선택 및 복사 방지
- **워터마크 추가**: 문서에 'CONFIDENTIAL', 'TOP SECRET' 등의 워터마크를 추가하여 보안 강화
- **브라우저 기반 처리**: 모든 작업이 클라이언트 측에서 수행되어 파일이 서버로 전송되지 않음

### 🎨 사용자 경험
- **직관적인 UI**: 드래그 앤 드롭 방식으로 마스킹 영역을 쉽게 설정
- **리사이징 기능**: 마스킹 영역의 크기를 조절할 수 있는 핸들 제공
- **페이지 네비게이션**: 여러 페이지 PDF 문서를 편리하게 관리
- **확대/축소 기능**: 세부 영역을 정밀하게 마스킹할 수 있도록 지원

### 🛠️ 기술적 기능
- **PDF.js 통합**: 안정적인 PDF 렌더링 및 처리
- **pdf-lib 활용**: 마스킹된 PDF를 새롭게 생성
- **워터마크 기능**: 사용자 정의 또는 사전 정의된 워터마크 적용
- **다국어 지원**: Next.js i18n을 통한 국제화 지원

## 🏗️ 기술 스택

### 🎯 프론트엔드
- **Next.js 15** - React 프레임워크 (App Router 사용)
- **TypeScript** - 타입 안전한 JavaScript 개발
- **Tailwind CSS** - 유틸리티 우선 CSS 프레임워크
- **React Hook Form** - 폼 데이터 관리 및 검증
- **Zod** - TypeScript 기반 스키마 검증

### 🧩 UI 구성 요소
- **shadcn/ui** - Radix UI 기반의 접근성 있는 구성 요소
- **Lucide React** - 일관된 아이콘 라이브러리
- **Framer Motion** - React용 모션 라이브러리
- **React PDF** - PDF 렌더링 및 조작

### 🔄 PDF 처리
- **PDF.js** - 브라우저 기반 PDF 렌더링 엔진
- **pdf-lib** - PDF 조작 및 생성 라이브러리
- **jsPDF** - PDF 생성 기능

### 🗄️ 백엔드 및 데이터
- **Prisma** - TypeScript ORM
- **SQLite** - 파일 기반 데이터베이스
- **NextAuth.js** - 인증 시스템 (필요 시 확장 가능)

### 🌍 국제화 및 유틸리티
- **Next Intl** - Next.js 국제화 라이브러리
- **Date-fns** - 날짜 조작 라이브러리
- **Socket.IO** - 실시간 웹소켓 통신 (추후 확장을 위한 준비)

## 🚀 빠른 시작

### 전제 조건
- Node.js (v18 이상)
- npm 또는 pnpm
- Git

### 설치 및 실행

```bash
# 1. 저장소 복제
git clone https://github.com/your-username/private-pdf.git
cd private-pdf

# 2. 의존성 설치
npm install
# 또는
pnpm install

# 3. 개발 서버 실행
npm run dev
# 또는
pnpm dev
```

### 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm start
```

서버가 시작되면 [http://localhost:3000](http://localhost:3000)에서 애플리케이션을 사용할 수 있습니다.

## 📋 사용 방법

### 1. PDF 업로드
- "Upload" 탭에서 보호할 PDF 파일 선택
- 비밀번호로 보호된 PDF는 지원되지 않으므로 사전에 비밀번호를 제거해야 함

### 2. 마스킹 영역 설정
- "Masking" 탭으로 이동
- "Area Selection" 모드에서 드래그하여 마스킹할 영역 선택
- 선택한 영역은 검은 사각형으로 표시됨
- 마스킹 영역을 클릭하여 이동 및 크기 조절 가능

### 3. 워터마크 설정 (선택 사항)
- "Download" 탭에서 워터마크 옵션 활성화
- 사용자 정의 텍스트 또는 사전 정의된 텍스트 선택
- 워터마크는 모든 페이지에 적용됨

### 4. 처리된 PDF 다운로드
- "Download Masked PDF" 버튼을 클릭하여 마스킹된 PDF 다운로드
- 마스킹된 영역은 영구적으로 숨겨지며 복구할 수 없음

## 🏗️ 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── page.tsx           # 메인 애플리케이션 페이지
│   ├── layout.tsx         # 애플리케이션 레이아웃
│   └── globals.css        # 전역 스타일
├── components/            # 재사용 가능한 React 컴포넌트
│   ├── pdf-processor.ts   # PDF 처리 로직 (로드, 마스킹, 내보내기)
│   ├── pdf-viewer.tsx     # PDF 뷰어 및 마스킹 UI
│   └── watermark-settings.tsx # 워터마크 설정 UI
├── hooks/                 # 커스텀 React 훅
├── lib/                   # 유틸리티 함수 및 설정
│   ├── db.ts              # Prisma 데이터베이스 인스턴스
│   ├── socket.ts          # Socket.IO 서버 설정
│   └── utils.ts           # 일반 유틸리티 함수
├── i18n/                  # 국제화 설정
└── messages/              # 다국어 메시지
```

## 🔐 보안 특징

- **클라이언트 측 처리**: 모든 PDF 처리가 브라우저에서 이루어져 서버로 파일 전송 없음
- **마스킹 영구성**: 마스킹된 영역은 영상으로 변환되어 텍스트 선택 불가
- **메타데이터 제거**: 내보낸 PDF에서 기존 메타데이터 제거
- **비밀번호 보호 PDF 차단**: 비밀번호로 보호된 PDF 파일은 처리하지 않음

## 🤝 기여

기여를 환영합니다! 다음 단계에 따라 기여해주세요:

1. 이 저장소를 포크하세요
2. 새 기능 브랜치를 만드세요 (`git checkout -b feature/AmazingFeature`)
3. 변경 사항을 커밋하세요 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성하세요

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🐛 버그 보고 및 기능 요청

문제가 있거나 새로운 기능을 제안하고 싶다면 [Issues](https://github.com/your-username/private-pdf/issues) 페이지를 방문해주세요.

## 🆘 지원

질문이나 도움이 필요하시면 [Discussions](https://github.com/your-username/private-pdf/discussions)에 글을 남겨주세요.

---

Made with ❤️ for privacy-conscious users