import { fal } from '@fal-ai/client';
import { config } from 'dotenv';
import { ShortsScript } from '../script/makeScript.js';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// 환경 변수 로드
config();

/**
 * fal API 설정
 */
const FAL_CONFIG = {
  // fal API 키
  apiKey: process.env.FAL_KEY || '',
  
  // 모델 설정 (함수 상단에서 쉽게 변경 가능)
  models: {
    textToVideo: 'fal-ai/hunyuan-video',           // 텍스트→영상 (기본 5~8초)
    imageToVideo: 'fal-ai/veo3/fast/image-to-video' // 이미지→영상 (속도 우선)
  },
  
  // 기본 파라미터
  defaultParams: {
    width: 1080,
    height: 1920,
    fps: 24,
    duration: 8
  }
};

/**
 * 생성된 클립 정보
 */
export interface GeneratedClip {
  id: string;
  scriptId: string;
  videoPath: string;
  duration: number;
  width: number;
  height: number;
  prompt: string;
  model: string;
  success: boolean;
  error?: string;
}

/**
 * fal API를 사용한 동영상 클립 생성기
 */
export class FalClipGenerator {
  private outputDir: string;
  private tempDir: string;
  private retryCount: number;

  constructor(outputDir: string = './out', tempDir: string = './temp', retryCount: number = 2) {
    this.outputDir = outputDir;
    this.tempDir = tempDir;
    this.retryCount = retryCount;
    
    // 디렉토리 생성
    this.ensureDirectories();
    
    // fal API 초기화
    if (!FAL_CONFIG.apiKey) {
      throw new Error('FAL_KEY 환경 변수가 설정되지 않았습니다.');
    }
    
    fal.config({
      credentials: FAL_CONFIG.apiKey
    });
  }

  /**
   * 필요한 디렉토리 생성
   */
  private ensureDirectories(): void {
    [this.outputDir, this.tempDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 스크립트로부터 동영상 클립 생성
   */
  async generateClip(script: ShortsScript): Promise<GeneratedClip> {
    const clipId = `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      let videoPath: string;
      let model: string;
      
      if (script.imageUrl) {
        // 이미지가 있는 경우: 이미지→영상
        const result = await this.generateImageToVideo(script, clipId);
        videoPath = result.videoPath;
        model = result.model;
      } else {
        // 이미지가 없는 경우: 텍스트→영상
        const result = await this.generateTextToVideo(script, clipId);
        videoPath = result.videoPath;
        model = result.model;
      }

      return {
        id: clipId,
        scriptId: script.id,
        videoPath,
        duration: FAL_CONFIG.defaultParams.duration,
        width: FAL_CONFIG.defaultParams.width,
        height: FAL_CONFIG.defaultParams.height,
        prompt: this.generatePrompt(script),
        model,
        success: true
      };

    } catch (error) {
      console.error(`클립 생성 실패 (${clipId}):`, error);
      
      return {
        id: clipId,
        scriptId: script.id,
        videoPath: '',
        duration: 0,
        width: 0,
        height: 0,
        prompt: this.generatePrompt(script),
        model: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 텍스트→영상 생성
   */
  private async generateTextToVideo(script: ShortsScript, clipId: string): Promise<{
    videoPath: string;
    model: string;
  }> {
    const prompt = this.generatePrompt(script);
    
    console.log(`📝 텍스트→영상 생성 시작: ${clipId}`);
    console.log(`프롬프트: ${prompt}`);

    const result = await fal.subscribe(FAL_CONFIG.models.textToVideo, {
      input: {
        prompt: prompt,
        width: FAL_CONFIG.defaultParams.width,
        height: FAL_CONFIG.defaultParams.height,
        fps: FAL_CONFIG.defaultParams.fps,
        duration: FAL_CONFIG.defaultParams.duration
      }
    });

    // 폴링으로 결과 수신
    const videoUrl = await this.pollForResult(result);
    const videoPath = await this.downloadVideo(videoUrl, clipId);

    return {
      videoPath,
      model: FAL_CONFIG.models.textToVideo
    };
  }

  /**
   * 이미지→영상 생성
   */
  private async generateImageToVideo(script: ShortsScript, clipId: string): Promise<{
    videoPath: string;
    model: string;
  }> {
    const prompt = this.generatePrompt(script);
    
    console.log(`🖼️ 이미지→영상 생성 시작: ${clipId}`);
    console.log(`프롬프트: ${prompt}`);
    console.log(`이미지 URL: ${script.imageUrl}`);

    const result = await fal.subscribe(FAL_CONFIG.models.imageToVideo, {
      input: {
        image_url: script.imageUrl!,
        prompt: prompt,
        width: FAL_CONFIG.defaultParams.width,
        height: FAL_CONFIG.defaultParams.height,
        fps: FAL_CONFIG.defaultParams.fps,
        duration: FAL_CONFIG.defaultParams.duration
      }
    });

    // 폴링으로 결과 수신
    const videoUrl = await this.pollForResult(result);
    const videoPath = await this.downloadVideo(videoUrl, clipId);

    return {
      videoPath,
      model: FAL_CONFIG.models.imageToVideo
    };
  }

  /**
   * 폴링으로 결과 수신 (Webhook 미사용)
   */
  private async pollForResult(result: any, maxAttempts: number = 60): Promise<string> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const status = await result.status();
        
        if (status.status === 'completed') {
          console.log(`✅ 클립 생성 완료 (${attempts + 1}회 시도)`);
          return status.result.video_url || status.result.url;
        } else if (status.status === 'failed') {
          throw new Error(`fal API 실패: ${status.error || 'Unknown error'}`);
        }
        
        // 2초 대기 후 재시도
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
        
        if (attempts % 10 === 0) {
          console.log(`⏳ 클립 생성 대기 중... (${attempts}/${maxAttempts})`);
        }
        
      } catch (error) {
        console.error(`폴링 오류 (${attempts + 1}회):`, error);
        attempts++;
        
        if (attempts >= maxAttempts) {
          throw new Error(`최대 시도 횟수 초과: ${maxAttempts}`);
        }
      }
    }
    
    throw new Error('클립 생성 시간 초과');
  }

  /**
   * 동영상 다운로드
   */
  private async downloadVideo(videoUrl: string, clipId: string): Promise<string> {
    try {
      console.log(`📥 동영상 다운로드 시작: ${videoUrl}`);
      
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`다운로드 실패: ${response.status} ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      const videoPath = join(this.tempDir, `${clipId}.mp4`);
      
      writeFileSync(videoPath, Buffer.from(buffer));
      console.log(`💾 동영상 저장 완료: ${videoPath}`);
      
      return videoPath;
      
    } catch (error) {
      throw new Error(`동영상 다운로드 오류: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 스크립트를 fal API용 프롬프트로 변환
   */
  private generatePrompt(script: ShortsScript): string {
    // 전파 산업 전문성 강화
    const industryContext = '전파 산업, 통신 기술, 5G 6G, 스펙트럼 정책';
    
    const prompt = `${industryContext} 관련 ${script.hook} ${script.keyPoints.join(' ')} ${script.callToAction}`;
    
    // fal API 제한을 고려한 프롬프트 최적화
    return prompt
      .replace(/[^\w\s가-힣]/g, ' ') // 특수문자 제거
      .replace(/\s+/g, ' ')           // 연속 공백 제거
      .trim()
      .substring(0, 500);             // 길이 제한
  }

  /**
   * 여러 클립을 순차적으로 생성
   */
  async generateMultipleClips(scripts: ShortsScript[]): Promise<GeneratedClip[]> {
    const clips: GeneratedClip[] = [];
    
    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];
      console.log(`\n🎬 클립 ${i + 1}/${scripts.length} 생성 중: ${script.title}`);
      
      let clip: GeneratedClip;
      let retryCount = 0;
      
      // 재시도 로직
      while (retryCount <= this.retryCount) {
        try {
          clip = await this.generateClip(script);
          
          if (clip.success) {
            clips.push(clip);
            console.log(`✅ 클립 ${i + 1} 생성 성공: ${clip.id}`);
            break;
          } else {
            throw new Error(clip.error || 'Unknown error');
          }
          
        } catch (error) {
          retryCount++;
          console.error(`❌ 클립 ${i + 1} 생성 실패 (${retryCount}/${this.retryCount + 1}):`, error);
          
          if (retryCount > this.retryCount) {
            // 최대 재시도 횟수 초과 시 실패한 클립 추가
            clips.push({
              id: `failed_${Date.now()}_${i}`,
              scriptId: script.id,
              videoPath: '',
              duration: 0,
              width: 0,
              height: 0,
              prompt: this.generatePrompt(script),
              model: '',
              success: false,
              error: `최대 재시도 횟수 초과: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
          } else {
            // 재시도 전 잠시 대기
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      }
    }
    
    return clips;
  }

  /**
   * 생성된 클립 정보 요약
   */
  getClipsSummary(clips: GeneratedClip[]): {
    total: number;
    success: number;
    failed: number;
    totalDuration: number;
  } {
    const success = clips.filter(clip => clip.success).length;
    const failed = clips.filter(clip => !clip.success).length;
    const totalDuration = clips
      .filter(clip => clip.success)
      .reduce((total, clip) => total + clip.duration, 0);
    
    return {
      total: clips.length,
      success,
      failed,
      totalDuration
    };
  }
}

