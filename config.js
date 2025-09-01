// API 설정 및 환경 변수
const config = {
    // fal API 설정
    fal: {
        apiKey: '', // 여기에 fal API 키를 입력하세요
        baseUrl: 'https://fal.run/fal-ai',
        models: {
            // fal에서 제공하는 동영상 생성 모델들
            videoGeneration: 'fast-sdxl',
            imageGeneration: 'fast-sdxl',
            textToVideo: 'fast-sdxl'
        }
    },
    
    // Supabase 설정 (기존)
    supabase: {
        url: '', // Supabase URL
        anonKey: '' // Supabase Anonymous Key
    },
    
    // 동영상 설정
    video: {
        defaultDuration: 10, // 기본 동영상 길이 (초)
        maxDuration: 60, // 최대 동영상 길이 (초)
        quality: 'high', // 동영상 품질
        format: 'mp4' // 동영상 형식
    },
    
    // UI 설정
    ui: {
        theme: 'dark',
        language: 'ko'
    }
};

// 환경 변수에서 설정 가져오기 (개발 환경용)
if (typeof process !== 'undefined' && process.env) {
    config.fal.apiKey = process.env.FAL_API_KEY || config.fal.apiKey;
    config.supabase.url = process.env.SUPABASE_URL || config.supabase.url;
    config.supabase.anonKey = process.env.SUPABASE_ANON_KEY || config.supabase.anonKey;
}

export default config;

