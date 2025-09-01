import config from './config.js';

/**
 * fal API를 사용한 동영상 생성 서비스
 */
class FalVideoService {
    constructor() {
        this.apiKey = config.fal.apiKey;
        this.baseUrl = config.fal.baseUrl;
        this.models = config.fal.models;
    }

    /**
     * API 키 설정
     * @param {string} apiKey - fal API 키
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        config.fal.apiKey = apiKey;
    }

    /**
     * API 키 유효성 검사
     * @returns {boolean} API 키가 설정되었는지 여부
     */
    isApiKeySet() {
        return this.apiKey && this.apiKey.trim() !== '';
    }

    /**
     * 텍스트 프롬프트로 동영상 생성
     * @param {string} prompt - 동영상 설명 프롬프트
     * @param {Object} options - 추가 옵션
     * @returns {Promise<Object>} 생성된 동영상 정보
     */
    async generateVideoFromText(prompt, options = {}) {
        if (!this.isApiKeySet()) {
            throw new Error('fal API 키가 설정되지 않았습니다. config.js 파일에서 API 키를 설정해주세요.');
        }

        const defaultOptions = {
            duration: config.video.defaultDuration,
            quality: config.video.quality,
            format: config.video.format,
            model: this.models.videoGeneration,
            ...options
        };

        try {
            const response = await fetch(`${this.baseUrl}/text-to-video`, {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt,
                    model: defaultOptions.model,
                    duration: defaultOptions.duration,
                    quality: defaultOptions.quality,
                    format: defaultOptions.format
                })
            });

            if (!response.ok) {
                throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            return {
                success: true,
                videoUrl: result.video_url,
                duration: result.duration,
                format: result.format,
                prompt: prompt,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('동영상 생성 중 오류 발생:', error);
            return {
                success: false,
                error: error.message,
                prompt: prompt,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 이미지로부터 동영상 생성
     * @param {string} imageUrl - 시작 이미지 URL
     * @param {string} prompt - 동영상 설명 프롬프트
     * @param {Object} options - 추가 옵션
     * @returns {Promise<Object>} 생성된 동영상 정보
     */
    async generateVideoFromImage(imageUrl, prompt, options = {}) {
        if (!this.isApiKeySet()) {
            throw new Error('fal API 키가 설정되지 않았습니다.');
        }

        const defaultOptions = {
            duration: config.video.defaultDuration,
            quality: config.video.quality,
            format: config.video.format,
            model: this.models.videoGeneration,
            ...options
        };

        try {
            const response = await fetch(`${this.baseUrl}/image-to-video`, {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image_url: imageUrl,
                    prompt: prompt,
                    model: defaultOptions.model,
                    duration: defaultOptions.duration,
                    quality: defaultOptions.quality,
                    format: defaultOptions.format
                })
            });

            if (!response.ok) {
                throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            return {
                success: true,
                videoUrl: result.video_url,
                duration: result.duration,
                format: result.format,
                prompt: prompt,
                imageUrl: imageUrl,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('이미지 기반 동영상 생성 중 오류 발생:', error);
            return {
                success: false,
                error: error.message,
                prompt: prompt,
                imageUrl: imageUrl,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 동영상 품질 향상
     * @param {string} videoUrl - 원본 동영상 URL
     * @param {Object} options - 향상 옵션
     * @returns {Promise<Object>} 향상된 동영상 정보
     */
    async enhanceVideo(videoUrl, options = {}) {
        if (!this.isApiKeySet()) {
            throw new Error('fal API 키가 설정되지 않았습니다.');
        }

        const defaultOptions = {
            quality: 'ultra',
            format: config.video.format,
            ...options
        };

        try {
            const response = await fetch(`${this.baseUrl}/video-enhancement`, {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    video_url: videoUrl,
                    quality: defaultOptions.quality,
                    format: defaultOptions.format
                })
            });

            if (!response.ok) {
                throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            return {
                success: true,
                enhancedVideoUrl: result.enhanced_video_url,
                originalVideoUrl: videoUrl,
                quality: result.quality,
                format: result.format,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('동영상 품질 향상 중 오류 발생:', error);
            return {
                success: false,
                error: error.message,
                originalVideoUrl: videoUrl,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 동영상 생성 상태 확인
     * @param {string} jobId - 작업 ID
     * @returns {Promise<Object>} 작업 상태
     */
    async checkVideoStatus(jobId) {
        if (!this.isApiKeySet()) {
            throw new Error('fal API 키가 설정되지 않았습니다.');
        }

        try {
            const response = await fetch(`${this.baseUrl}/status/${jobId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Key ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`상태 확인 실패: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            return {
                success: true,
                status: result.status,
                progress: result.progress,
                result: result.result,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('동영상 상태 확인 중 오류 발생:', error);
            return {
                success: false,
                error: error.message,
                jobId: jobId,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 사용 가능한 모델 목록 조회
     * @returns {Promise<Array>} 모델 목록
     */
    async getAvailableModels() {
        if (!this.isApiKeySet()) {
            throw new Error('fal API 키가 설정되지 않았습니다.');
        }

        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Key ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`모델 목록 조회 실패: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            return {
                success: true,
                models: result.models,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('모델 목록 조회 중 오류 발생:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// 전역 인스턴스 생성
const falVideoService = new FalVideoService();

// 브라우저 환경에서 전역으로 사용할 수 있도록 설정
if (typeof window !== 'undefined') {
    window.falVideoService = falVideoService;
}

export default falVideoService;

