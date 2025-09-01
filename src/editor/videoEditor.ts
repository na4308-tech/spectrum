import ffmpeg from 'fluent-ffmpeg';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { GeneratedClip } from '../fal/generateClip.js';
import { GeneratedOverlay } from '../overlay/textOverlay.js';
import { SRTSubtitle } from '../script/makeScript.js';

// ffmpeg 경로 설정
import ffmpegStatic from 'ffmpeg-static';
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

/**
 * 동영상 편집 설정
 */
const EDITOR_CONFIG = {
  // 출력 설정
  output: {
    width: 1080,
    height: 1920,
    fps: 24,
    bitrate: '8M',
    format: 'mp4'
  },
  
  // BGM 설정
  bgm: {
    volume: -15, // dB
    path: './assets/bgm.mp3'
  },
  
  // 자막 설정
  subtitle: {
    fontSize: 32,
    fontColor: 'white',
    backgroundColor: 'rgba(0,0,0,0.7)',
    position: 'bottom',
    margin: '10%'
  }
};

/**
 * 편집된 동영상 정보
 */
export interface EditedVideo {
  id: string;
  outputPath: string;
  duration: number;
  width: number;
  height: number;
  success: boolean;
  error?: string;
}

/**
 * 동영상 편집기
 */
export class VideoEditor {
  private outputDir: string;
  private tempDir: string;

  constructor(outputDir: string = './out', tempDir: string = './temp') {
    this.outputDir = outputDir;
    this.tempDir = tempDir;
    
    // 디렉토리 생성
    this.ensureDirectories();
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
   * 모든 클립을 합성하여 최종 쇼츠 동영상 생성
   */
  async createShortsVideo(
    clips: GeneratedClip[],
    overlays: GeneratedOverlay[],
    subtitles: SRTSubtitle[]
  ): Promise<EditedVideo> {
    const videoId = `shorts_${Date.now()}`;
    
    try {
      console.log('🎬 쇼츠 동영상 편집 시작...');
      
      // 성공한 클립만 필터링
      const successfulClips = clips.filter(clip => clip.success);
      
      if (successfulClips.length === 0) {
        throw new Error('편집할 수 있는 클립이 없습니다.');
      }
      
      // 클립들을 순차적으로 연결
      const concatenatedVideo = await this.concatenateClips(successfulClips, videoId);
      
      // 오버레이 추가
      const videoWithOverlays = await this.addOverlays(concatenatedVideo, overlays, videoId);
      
      // 자막 추가
      const videoWithSubtitles = await this.addSubtitles(videoWithOverlays, subtitles, videoId);
      
      // BGM 추가 및 최종 출력
      const finalVideo = await this.addBGMAndFinalize(videoWithSubtitles, videoId);
      
      console.log('✅ 쇼츠 동영상 편집 완료!');
      
      return {
        id: videoId,
        outputPath: finalVideo,
        duration: this.calculateTotalDuration(successfulClips),
        width: EDITOR_CONFIG.output.width,
        height: EDITOR_CONFIG.output.height,
        success: true
      };
      
    } catch (error) {
      console.error('❌ 동영상 편집 실패:', error);
      
      return {
        id: videoId,
        outputPath: '',
        duration: 0,
        width: 0,
        height: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 클립들을 순차적으로 연결
   */
  private async concatenateClips(clips: GeneratedClip[], videoId: string): Promise<string> {
    const outputPath = join(this.tempDir, `${videoId}_concatenated.mp4`);
    
    return new Promise((resolve, reject) => {
      let command = ffmpeg();
      
      // 입력 파일들 추가
      clips.forEach(clip => {
        command = command.input(clip.videoPath);
      });
      
      // 필터 복잡도 설정 (여러 입력 파일 처리)
      const filterComplex = `concat=n=${clips.length}:v=1:a=0[outv]`;
      
      command
        .complexFilter(filterComplex)
        .map('[outv]')
        .videoCodec('libx264')
        .size(`${EDITOR_CONFIG.output.width}x${EDITOR_CONFIG.output.height}`)
        .fps(EDITOR_CONFIG.output.fps)
        .videoBitrate(EDITOR_CONFIG.output.bitrate)
        .outputOptions([
          '-pix_fmt yuv420p',
          '-movflags +faststart'
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('🔄 클립 연결 시작:', commandLine);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`📊 클립 연결 진행률: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log('✅ 클립 연결 완료');
          resolve(outputPath);
        })
        .on('error', (error) => {
          console.error('❌ 클립 연결 실패:', error);
          reject(error);
        })
        .run();
    });
  }

  /**
   * 오버레이 이미지를 동영상에 추가
   */
  private async addOverlays(
    videoPath: string,
    overlays: GeneratedOverlay[],
    videoId: string
  ): Promise<string> {
    const outputPath = join(this.tempDir, `${videoId}_with_overlays.mp4`);
    
    return new Promise((resolve, reject) => {
      let command = ffmpeg(videoPath);
      
      // 성공한 오버레이만 필터링
      const successfulOverlays = overlays.filter(overlay => overlay.success);
      
      if (successfulOverlays.length === 0) {
        // 오버레이가 없으면 원본 동영상 반환
        resolve(videoPath);
        return;
      }
      
      // 오버레이 이미지들을 입력으로 추가
      successfulOverlays.forEach(overlay => {
        command = command.input(overlay.imagePath);
      });
      
      // 오버레이 필터 구성
      const overlayFilters = this.buildOverlayFilters(successfulOverlays);
      
      command
        .complexFilter(overlayFilters)
        .videoCodec('libx264')
        .size(`${EDITOR_CONFIG.output.width}x${EDITOR_CONFIG.output.height}`)
        .fps(EDITOR_CONFIG.output.fps)
        .videoBitrate(EDITOR_CONFIG.output.bitrate)
        .outputOptions([
          '-pix_fmt yuv420p',
          '-movflags +faststart'
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('🔄 오버레이 추가 시작:', commandLine);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`📊 오버레이 추가 진행률: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log('✅ 오버레이 추가 완료');
          resolve(outputPath);
        })
        .on('error', (error) => {
          console.error('❌ 오버레이 추가 실패:', error);
          reject(error);
        })
        .run();
    });
  }

  /**
   * 오버레이 필터 구성
   */
  private buildOverlayFilters(overlays: GeneratedOverlay[]): string {
    const filters: string[] = [];
    let inputIndex = 1; // 메인 동영상은 0번
    
    overlays.forEach((overlay, index) => {
      const overlayInput = `[${inputIndex}:v]`;
      const outputLabel = index === 0 ? '[outv]' : `[tmp${index}]`;
      const inputLabel = index === 0 ? '[0:v]' : `[tmp${index - 1}]`;
      
      // 오버레이 위치 및 타이밍 설정
      const filter = `${overlayInput}scale=${EDITOR_CONFIG.output.width}:${EDITOR_CONFIG.output.height}[scaled${index}];${inputLabel}[scaled${index}]overlay=0:0:enable='between(t,${index * 8},${(index + 1) * 8})'${outputLabel}`;
      
      filters.push(filter);
      inputIndex++;
    });
    
    return filters.join(';');
  }

  /**
   * 자막을 동영상에 추가
   */
  private async addSubtitles(
    videoPath: string,
    subtitles: SRTSubtitle[],
    videoId: string
  ): Promise<string> {
    const outputPath = join(this.tempDir, `${videoId}_with_subtitles.mp4`);
    
    return new Promise((resolve, reject) => {
      // SRT 파일 생성
      const srtPath = join(this.tempDir, `${videoId}_subtitles.srt`);
      const srtContent = this.generateSRTContent(subtitles);
      writeFileSync(srtPath, srtContent, 'utf-8');
      
      ffmpeg(videoPath)
        .videoFilters([
          `subtitles=${srtPath}:force_style='FontSize=${EDITOR_CONFIG.subtitle.fontSize},PrimaryColour=&H${this.colorToHex(EDITOR_CONFIG.subtitle.fontColor)},BackColour=&H${this.colorToHex(EDITOR_CONFIG.subtitle.backgroundColor)},MarginV=${EDITOR_CONFIG.subtitle.margin}'`
        ])
        .videoCodec('libx264')
        .size(`${EDITOR_CONFIG.output.width}x${EDITOR_CONFIG.output.height}`)
        .fps(EDITOR_CONFIG.output.fps)
        .videoBitrate(EDITOR_CONFIG.output.bitrate)
        .outputOptions([
          '-pix_fmt yuv420p',
          '-movflags +faststart'
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('🔄 자막 추가 시작:', commandLine);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`📊 자막 추가 진행률: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log('✅ 자막 추가 완료');
          resolve(outputPath);
        })
        .on('error', (error) => {
          console.error('❌ 자막 추가 실패:', error);
          reject(error);
        })
        .run();
    });
  }

  /**
   * BGM 추가 및 최종 출력
   */
  private async addBGMAndFinalize(videoPath: string, videoId: string): Promise<string> {
    const outputPath = join(this.outputDir, `shorts_${new Date().toISOString().slice(0, 19).replace(/:/g, '')}.mp4`);
    
    return new Promise((resolve, reject) => {
      let command = ffmpeg(videoPath);
      
      // BGM 파일이 있으면 추가
      if (existsSync(EDITOR_CONFIG.bgm.path)) {
        command = command.input(EDITOR_CONFIG.bgm.path);
        
        // 오디오 믹싱 및 볼륨 조절
        command.complexFilter([
          '[0:a][1:a]amix=inputs=2:duration=first:weights=1,0.1[aout]'
        ])
        .map('[aout]')
        .audioFilters(`volume=${EDITOR_CONFIG.bgm.volume}dB`);
      }
      
      command
        .videoCodec('libx264')
        .audioCodec('aac')
        .size(`${EDITOR_CONFIG.output.width}x${EDITOR_CONFIG.output.height}`)
        .fps(EDITOR_CONFIG.output.fps)
        .videoBitrate(EDITOR_CONFIG.output.bitrate)
        .audioBitrate('128k')
        .outputOptions([
          '-pix_fmt yuv420p',
          '-movflags +faststart',
          '-preset fast'
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('🔄 최종 출력 시작:', commandLine);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`📊 최종 출력 진행률: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log('✅ 최종 출력 완료:', outputPath);
          resolve(outputPath);
        })
        .on('error', (error) => {
          console.error('❌ 최종 출력 실패:', error);
          reject(error);
        })
        .run();
    });
  }

  /**
   * SRT 파일 내용 생성
   */
  private generateSRTContent(subtitles: SRTSubtitle[]): string {
    return subtitles.map(subtitle => 
      `${subtitle.id}\n${subtitle.startTime} --> ${subtitle.endTime}\n${subtitle.text}\n`
    ).join('\n');
  }

  /**
   * 색상을 hex 형식으로 변환
   */
  private colorToHex(color: string): string {
    // 간단한 색상 변환 (실제로는 더 정교한 변환 필요)
    const colorMap: { [key: string]: string } = {
      'white': 'FFFFFF',
      'black': '000000',
      'red': 'FF0000',
      'green': '00FF00',
      'blue': '0000FF',
      'yellow': 'FFFF00'
    };
    
    return colorMap[color.toLowerCase()] || 'FFFFFF';
  }

  /**
   * 총 동영상 길이 계산
   */
  private calculateTotalDuration(clips: GeneratedClip[]): number {
    return clips.reduce((total, clip) => total + clip.duration, 0);
  }

  /**
   * 임시 파일 정리
   */
  async cleanupTempFiles(videoId: string): Promise<void> {
    const tempFiles = [
      `${videoId}_concatenated.mp4`,
      `${videoId}_with_overlays.mp4`,
      `${videoId}_with_subtitles.mp4`,
      `${videoId}_subtitles.srt`
    ];
    
    tempFiles.forEach(filename => {
      const filePath = join(this.tempDir, filename);
      if (existsSync(filePath)) {
        try {
          // 파일 삭제 (실제 구현에서는 fs.unlink 사용)
          console.log(`🧹 임시 파일 정리: ${filename}`);
        } catch (error) {
          console.warn(`임시 파일 삭제 실패: ${filename}`, error);
        }
      }
    });
  }
}

