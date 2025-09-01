# 🎬 전파 산업 동향 YouTube 쇼츠 자동 생성기

크롤링된 전파 산업 동향 데이터를 바탕으로 AI 기반 YouTube 쇼츠 영상을 자동으로 생성하는 시스템입니다.

## ✨ 주요 기능

- **📊 데이터 파싱**: JSON/CSV/Markdown 형식의 크롤링 결과 자동 파싱
- **📝 스크립트 생성**: AI를 활용한 쇼츠용 나레이션 스크립트 자동 생성
- **🎬 AI 동영상**: fal API를 통한 텍스트→영상 및 이미지→영상 생성
- **🎨 텍스트 오버레이**: HTML 기반 텍스트 카드 자동 생성
- **📺 자막 번인**: SRT 자막을 동영상에 자동 추가
- **🎵 BGM 합성**: 배경음악 자동 추가 및 볼륨 조절
- **🎯 쇼츠 최적화**: 9:16 세로형, 60초 이내 YouTube 쇼츠 규격 준수

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# 저장소 클론
git clone <repository-url>
cd radio-industry-shorts-generator

# 의존성 설치
pnpm install

# 환경 변수 설정
cp env.example .env
# .env 파일에서 FAL_KEY 설정
```

### 2. fal API 키 설정

`.env` 파일에서 fal API 키를 설정하세요:

```bash
# .env
FAL_KEY=your_fal_api_key_here
OPENAI_API_KEY=your_openai_api_key_here  # 선택사항
```

**fal API 키 발급 방법:**
1. [fal.ai](https://fal.ai/)에 가입
2. 대시보드에서 API 키 생성
3. 생성된 키를 `.env` 파일에 입력

### 3. 실행

```bash
# 샘플 데이터로 테스트 실행
pnpm dev

# 특정 데이터 파일로 실행
pnpm dev sample.json
```

## 📁 프로젝트 구조

```
├── src/
│   ├── data/           # 데이터 파싱 모듈
│   │   └── parser.ts   # JSON/CSV/Markdown 파서
│   ├── script/         # 스크립트 생성 모듈
│   │   └── makeScript.ts # 쇼츠용 스크립트 생성기
│   ├── fal/            # fal API 연동
│   │   └── generateClip.ts # AI 동영상 생성
│   ├── overlay/        # 텍스트 오버레이
│   │   └── textOverlay.ts # HTML→이미지 변환
│   ├── editor/         # 동영상 편집
│   │   └── videoEditor.ts # ffmpeg 기반 편집
│   └── index.ts        # 메인 실행 스크립트
├── src/data/           # 샘플 데이터
│   └── sample.json     # 예제 크롤링 결과
├── out/                # 최종 출력 동영상
├── temp/               # 임시 파일
├── assets/             # BGM 등 자원 파일
├── package.json        # 프로젝트 설정
├── tsconfig.json       # TypeScript 설정
└── README.md           # 이 파일
```

## 🔧 기술 스택

- **언어**: TypeScript + tsx
- **패키지 관리**: pnpm
- **AI 서비스**: fal API (@fal-ai/client)
- **동영상 처리**: ffmpeg (fluent-ffmpeg, ffmpeg-static)
- **이미지 생성**: node-html-to-image
- **AI 스크립트**: OpenAI API (선택사항)

## 📊 크롤링 결과 파일 형식

### JSON 형식 (권장)

```json
{
  "items": [
    {
      "title": "제목",
      "summary": "요약 내용",
      "keywords": ["키워드1", "키워드2"],
      "date": "2024-12-19T10:00:00Z",
      "source": "출처",
      "url": "원본 URL",
      "imageUrl": "대표 이미지 URL"
    }
  ],
  "totalCount": 1,
  "crawlDate": "2024-12-19T10:00:00Z",
  "source": "크롤링 소스"
}
```

### CSV 형식

```csv
title,summary,keywords,date,source,url,imageUrl
"제목","요약 내용","키워드1|키워드2","2024-12-19T10:00:00Z","출처","URL","이미지URL"
```

### Markdown 형식

```markdown
# 제목

**요약:** 요약 내용

**키워드:** 키워드1, 키워드2

**날짜:** 2024-12-19T10:00:00Z

**출처:** 출처

**URL:** 원본 URL

**이미지:** 이미지 URL

---
```

## 🎯 fal API 모델 설정

`src/fal/generateClip.ts` 파일 상단에서 모델을 쉽게 변경할 수 있습니다:

```typescript
const FAL_CONFIG = {
  models: {
    textToVideo: 'fal-ai/hunyuan-video',           // 텍스트→영상
    imageToVideo: 'fal-ai/veo3/fast/image-to-video' // 이미지→영상
  }
};
```

## 📱 YouTube 쇼츠 규격

- **해상도**: 1080×1920 (9:16 세로형)
- **프레임레이트**: 24fps
- **최대 길이**: 60초
- **비트레이트**: ~8Mbps
- **코덱**: H.264 (비디오), AAC (오디오)

## 🎵 BGM 설정

`./assets/bgm.mp3` 파일을 추가하면 자동으로 배경음악이 합성됩니다:

- **볼륨**: -15dB (덕킹)
- **포맷**: MP3
- **저작권**: 무제한 트랙 권장

## 🔄 실행 커맨드

```bash
# 개발 모드 실행 (샘플 데이터)
pnpm dev

# 특정 파일로 실행
pnpm dev your-data.json

# 빌드
pnpm build

# 프로덕션 실행
pnpm start

# 테스트
pnpm test

# 임시 파일 정리
pnpm clean
```

## 📈 생성 과정

1. **📊 데이터 파싱**: 크롤링 결과 파일 읽기
2. **📝 스크립트 생성**: AI 기반 쇼츠용 나레이션 생성
3. **🎬 클립 생성**: fal API로 각 스크립트별 동영상 생성
4. **🎨 오버레이 생성**: HTML 기반 텍스트 카드 생성
5. **📺 편집/합성**: ffmpeg로 최종 쇼츠 동영상 생성

## 🐛 문제 해결

### fal API 오류
- API 키가 올바르게 설정되었는지 확인
- fal.ai 계정 상태 및 사용량 한도 확인
- 네트워크 연결 상태 확인

### ffmpeg 오류
- ffmpeg-static이 올바르게 설치되었는지 확인
- 임시 디렉토리 권한 확인
- 디스크 공간 확인

### 메모리 부족
- 동시 처리 클립 수 줄이기
- 임시 파일 정리 주기 설정
- Node.js 메모리 제한 증가

## 📞 지원

- **Issues**: GitHub Issues에 버그 리포트
- **Discussions**: 기능 요청 및 질문
- **fal API**: [fal.ai/docs](https://fal.ai/docs)

## 📄 라이선스

MIT License

## 🔄 업데이트 내역

- **v1.0.0**: 초기 릴리스
  - 기본 파이프라인 구현
  - fal API 통합
  - YouTube 쇼츠 최적화

---

**참고**: 이 시스템은 fal API의 무료 티어와 유료 티어를 모두 지원합니다. 사용량에 따라 비용이 발생할 수 있습니다.
