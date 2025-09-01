# 🎬 fal API를 사용한 AI 동영상 생성 시스템

이 프로젝트는 fal API를 통합하여 AI 기반 동영상을 생성할 수 있는 시스템입니다.

## ✨ 주요 기능

- **AI 동영상 생성**: 텍스트 프롬프트로 동영상 생성
- **동영상 품질 설정**: 표준, 고품질, 초고품질 옵션
- **동영상 길이 조절**: 5초 ~ 20초 범위에서 선택
- **동영상 다운로드**: 생성된 동영상을 로컬에 저장
- **API 키 관리**: 안전한 API 키 저장 및 관리

## 🚀 시작하기

### 1. fal API 키 발급

1. [fal.ai](https://fal.ai/)에 가입
2. 대시보드에서 API 키 생성
3. 생성된 키를 복사 (형식: `fal_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

### 2. API 키 설정

#### 방법 1: 웹 인터페이스 사용 (권장)
1. `trend-briefing.html` 페이지 접속
2. 동영상 탭에서 "🔑 API 키 설정" 버튼 클릭
3. API 키 입력 후 저장

#### 방법 2: config.js 파일 직접 수정
```javascript
// config.js
const config = {
    fal: {
        apiKey: 'your_fal_api_key_here', // 여기에 API 키 입력
        // ... 기타 설정
    }
};
```

#### 방법 3: 환경 변수 사용
```bash
# .env 파일 생성
FAL_API_KEY=your_fal_api_key_here
```

### 3. 동영상 생성

1. 동영상 설명 입력 (예: "고양이가 6G 전파 기술을 설명하는 애니메이션")
2. 동영상 길이 선택 (5초 ~ 20초)
3. 품질 선택 (표준/고품질/초고품질)
4. "🎬 AI 동영상 생성" 버튼 클릭
5. 생성 완료 후 동영상 재생 및 다운로드

## 🔧 기술 스택

- **프론트엔드**: HTML5, CSS3, JavaScript (ES6+)
- **AI 서비스**: fal API
- **동영상 처리**: HTML5 Video API
- **스토리지**: LocalStorage (API 키 저장)

## 📁 파일 구조

```
├── trend-briefing.html      # 메인 동향조사 페이지 (fal API 통합)
├── config.js               # API 설정 파일
├── fal-video-service.js    # fal API 서비스 클래스
├── video-player.html       # 동영상 플레이어
└── README-fal-api.md       # 이 파일
```

## 🎯 fal API 모델

현재 지원하는 fal API 모델:

- **fast-sdxl**: 빠른 동영상 생성 (기본)
- **text-to-video**: 텍스트에서 동영상 생성
- **image-to-video**: 이미지에서 동영상 생성
- **video-enhancement**: 동영상 품질 향상

## 💡 사용 예시

### 기본 동영상 생성
```javascript
// fal 서비스 사용
const result = await falVideoService.generateVideoFromText(
    "고양이가 6G 전파 기술을 설명하는 애니메이션",
    {
        duration: 10,
        quality: 'high'
    }
);

if (result.success) {
    console.log('동영상 URL:', result.videoUrl);
} else {
    console.error('오류:', result.error);
}
```

### 이미지 기반 동영상 생성
```javascript
const result = await falVideoService.generateVideoFromImage(
    "https://example.com/start-image.jpg",
    "이 이미지에서 시작하여 동영상으로 변환",
    {
        duration: 15,
        quality: 'ultra'
    }
);
```

## ⚠️ 주의사항

1. **API 키 보안**: API 키를 소스 코드에 직접 하드코딩하지 마세요
2. **사용량 제한**: fal API의 사용량 제한을 확인하세요
3. **동영상 품질**: 고품질 옵션은 더 많은 시간과 비용이 소요됩니다
4. **브라우저 호환성**: 최신 브라우저에서 최적의 성능을 제공합니다

## 🐛 문제 해결

### API 키 오류
- API 키가 올바르게 입력되었는지 확인
- fal.ai 계정 상태 확인
- API 사용량 한도 확인

### 동영상 생성 실패
- 네트워크 연결 상태 확인
- 프롬프트 내용이 적절한지 확인
- fal 서비스 상태 확인

### 동영상 재생 문제
- 브라우저가 MP4 형식을 지원하는지 확인
- 동영상 파일이 완전히 로드되었는지 확인

## 📞 지원

- **fal API 문서**: [https://fal.ai/docs](https://fal.ai/docs)
- **GitHub Issues**: 프로젝트 저장소에 이슈 등록
- **커뮤니티**: fal.ai Discord 커뮤니티 참여

## 🔄 업데이트 내역

- **v1.0.0**: 초기 fal API 통합
- **v1.1.0**: 동영상 품질 향상 기능 추가
- **v1.2.0**: 이미지 기반 동영상 생성 지원

---

**참고**: 이 시스템은 fal API의 무료 티어와 유료 티어를 모두 지원합니다. 사용량에 따라 비용이 발생할 수 있습니다.

