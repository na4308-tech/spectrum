import nodeHtmlToImage from 'node-html-to-image';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ShortsScript } from '../script/makeScript.js';
import { SRTSubtitle } from '../script/makeScript.js';

/**
 * 텍스트 오버레이 설정
 */
const OVERLAY_CONFIG = {
  // 카드 크기
  width: 1080,
  height: 1920,
  
  // 폰트 설정
  fontFamily: 'Noto Sans KR, Arial, sans-serif',
  fontSize: {
    title: 48,
    subtitle: 32,
    body: 28
  },
  
  // 색상 설정
  colors: {
    background: 'rgba(0, 0, 0, 0.8)',
    title: '#ffffff',
    subtitle: '#ffd700',
    body: '#e0e0e0',
    accent: '#00d4ff'
  },
  
  // 여백 설정
  margins: {
    top: 100,
    bottom: 150,
    left: 60,
    right: 60
  }
};

/**
 * 생성된 오버레이 정보
 */
export interface GeneratedOverlay {
  id: string;
  scriptId: string;
  imagePath: string;
  type: 'title' | 'keypoint' | 'cta';
  text: string;
  success: boolean;
  error?: string;
}

/**
 * 텍스트 오버레이 생성기
 */
export class TextOverlayGenerator {
  private outputDir: string;
  private tempDir: string;

  constructor(outputDir: string = './temp', tempDir: string = './temp') {
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
        mkdirSync(dir, recursive: true);
      }
    });
  }

  /**
   * 스크립트로부터 모든 오버레이 생성
   */
  async generateAllOverlays(script: ShortsScript): Promise<GeneratedOverlay[]> {
    const overlays: GeneratedOverlay[] = [];
    
    try {
      // 제목 카드 생성
      const titleOverlay = await this.generateTitleCard(script);
      overlays.push(titleOverlay);
      
      // 핵심 포인트 카드들 생성
      for (let i = 0; i < script.keyPoints.length; i++) {
        const keypointOverlay = await this.generateKeypointCard(script, i);
        overlays.push(keypointOverlay);
      }
      
      // 콜투액션 카드 생성
      const ctaOverlay = await this.generateCTACard(script);
      overlays.push(ctaOverlay);
      
    } catch (error) {
      console.error('오버레이 생성 중 오류:', error);
    }
    
    return overlays;
  }

  /**
   * 제목 카드 생성
   */
  private async generateTitleCard(script: ShortsScript): Promise<GeneratedOverlay> {
    const overlayId = `title_${script.id}`;
    
    try {
      const html = this.generateTitleHTML(script);
      const imagePath = await this.renderHTMLToImage(html, overlayId);
      
      return {
        id: overlayId,
        scriptId: script.id,
        imagePath,
        type: 'title',
        text: script.title,
        success: true
      };
      
    } catch (error) {
      return {
        id: overlayId,
        scriptId: script.id,
        imagePath: '',
        type: 'title',
        text: script.title,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 핵심 포인트 카드 생성
   */
  private async generateKeypointCard(script: ShortsScript, index: number): Promise<GeneratedOverlay> {
    const overlayId = `keypoint_${script.id}_${index}`;
    const keypoint = script.keyPoints[index];
    
    try {
      const html = this.generateKeypointHTML(script, index);
      const imagePath = await this.renderHTMLToImage(html, overlayId);
      
      return {
        id: overlayId,
        scriptId: script.id,
        imagePath,
        type: 'keypoint',
        text: keypoint,
        success: true
      };
      
    } catch (error) {
      return {
        id: overlayId,
        scriptId: script.id,
        imagePath: '',
        type: 'keypoint',
        text: keypoint,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 콜투액션 카드 생성
   */
  private async generateCTACard(script: ShortsScript): Promise<GeneratedOverlay> {
    const overlayId = `cta_${script.id}`;
    
    try {
      const html = this.generateCTAHTML(script);
      const imagePath = await this.renderHTMLToImage(html, overlayId);
      
      return {
        id: overlayId,
        scriptId: script.id,
        imagePath,
        type: 'cta',
        text: script.callToAction,
        success: true
      };
      
    } catch (error) {
      return {
        id: overlayId,
        scriptId: script.id,
        imagePath: '',
        type: 'cta',
        text: script.callToAction,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 제목 카드 HTML 생성
   */
  private generateTitleHTML(script: ShortsScript): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              margin: 0;
              padding: 0;
              width: ${OVERLAY_CONFIG.width}px;
              height: ${OVERLAY_CONFIG.height}px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              font-family: ${OVERLAY_CONFIG.fontFamily};
              display: flex;
              align-items: center;
              justify-content: center;
              color: ${OVERLAY_CONFIG.colors.title};
            }
            .title-card {
              text-align: center;
              padding: ${OVERLAY_CONFIG.margins.top}px ${OVERLAY_CONFIG.margins.left}px;
              background: ${OVERLAY_CONFIG.colors.background};
              border-radius: 20px;
              max-width: ${OVERLAY_CONFIG.width - OVERLAY_CONFIG.margins.left - OVERLAY_CONFIG.margins.right}px;
            }
            .title {
              font-size: ${OVERLAY_CONFIG.fontSize.title}px;
              font-weight: bold;
              margin-bottom: 20px;
              line-height: 1.2;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            }
            .subtitle {
              font-size: ${OVERLAY_CONFIG.fontSize.subtitle}px;
              color: ${OVERLAY_CONFIG.colors.subtitle};
              opacity: 0.9;
            }
            .accent {
              color: ${OVERLAY_CONFIG.colors.accent};
            }
          </style>
        </head>
        <body>
          <div class="title-card">
            <div class="title">${script.title}</div>
            <div class="subtitle">전파 산업 동향 브리핑</div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * 핵심 포인트 카드 HTML 생성
   */
  private generateKeypointHTML(script: ShortsScript, index: number): string {
    const keypoint = script.keyPoints[index];
    const pointNumber = index + 1;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              margin: 0;
              padding: 0;
              width: ${OVERLAY_CONFIG.width}px;
              height: ${OVERLAY_CONFIG.height}px;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              font-family: ${OVERLAY_CONFIG.fontFamily};
              display: flex;
              align-items: center;
              justify-content: center;
              color: ${OVERLAY_CONFIG.colors.title};
            }
            .keypoint-card {
              text-align: center;
              padding: ${OVERLAY_CONFIG.margins.top}px ${OVERLAY_CONFIG.margins.left}px;
              background: ${OVERLAY_CONFIG.colors.background};
              border-radius: 20px;
              max-width: ${OVERLAY_CONFIG.width - OVERLAY_CONFIG.margins.left - OVERLAY_CONFIG.margins.right}px;
            }
            .point-number {
              font-size: 72px;
              font-weight: bold;
              color: ${OVERLAY_CONFIG.colors.accent};
              margin-bottom: 20px;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            }
            .keypoint-text {
              font-size: ${OVERLAY_CONFIG.fontSize.body}px;
              line-height: 1.4;
              margin-bottom: 20px;
            }
            .keyword-tags {
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              gap: 10px;
            }
            .keyword-tag {
              background: ${OVERLAY_CONFIG.colors.accent};
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 18px;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="keypoint-card">
            <div class="point-number">${pointNumber}</div>
            <div class="keypoint-text">${keypoint}</div>
            <div class="keyword-tags">
              ${script.keywords.slice(0, 3).map(keyword => 
                `<span class="keyword-tag">${keyword}</span>`
              ).join('')}
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * 콜투액션 카드 HTML 생성
   */
  private generateCTAHTML(script: ShortsScript): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              margin: 0;
              padding: 0;
              width: ${OVERLAY_CONFIG.width}px;
              height: ${OVERLAY_CONFIG.height}px;
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
              font-family: ${OVERLAY_CONFIG.fontFamily};
              display: flex;
              align-items: center;
              justify-content: center;
              color: ${OVERLAY_CONFIG.colors.title};
            }
            .cta-card {
              text-align: center;
              padding: ${OVERLAY_CONFIG.margins.top}px ${OVERLAY_CONFIG.margins.left}px;
              background: ${OVERLAY_CONFIG.colors.background};
              border-radius: 20px;
              max-width: ${OVERLAY_CONFIG.width - OVERLAY_CONFIG.margins.left - OVERLAY_CONFIG.margins.right}px;
            }
            .cta-text {
              font-size: ${OVERLAY_CONFIG.fontSize.body}px;
              line-height: 1.4;
              margin-bottom: 30px;
            }
            .cta-button {
              background: ${OVERLAY_CONFIG.colors.accent};
              color: white;
              padding: 20px 40px;
              border-radius: 50px;
              font-size: 24px;
              font-weight: bold;
              text-decoration: none;
              display: inline-block;
              box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            }
            .emoji {
              font-size: 48px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="cta-card">
            <div class="emoji">🎯</div>
            <div class="cta-text">${script.callToAction}</div>
            <div class="cta-button">구독하기</div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * HTML을 이미지로 렌더링
   */
  private async renderHTMLToImage(html: string, overlayId: string): Promise<string> {
    try {
      const imagePath = join(this.tempDir, `${overlayId}.png`);
      
      const image = await nodeHtmlToImage({
        html,
        quality: 100,
        type: 'png',
        puppeteerArgs: {
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });
      
      if (Array.isArray(image)) {
        writeFileSync(imagePath, image[0]);
      } else {
        writeFileSync(imagePath, image);
      }
      
      console.log(`✅ 오버레이 이미지 생성 완료: ${imagePath}`);
      return imagePath;
      
    } catch (error) {
      throw new Error(`이미지 렌더링 오류: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * SRT 자막을 ffmpeg용 자막 파일로 변환
   */
  generateFFmpegSubtitles(subtitles: SRTSubtitle[]): string {
    const lines: string[] = [];
    
    subtitles.forEach(subtitle => {
      // SRT 시간을 ffmpeg 형식으로 변환
      const startTime = this.convertSRTTimeToFFmpeg(subtitle.startTime);
      const endTime = this.convertSRTTimeToFFmpeg(subtitle.endTime);
      
      // 자막 텍스트를 2줄로 분할
      const textLines = this.splitTextIntoLines(subtitle.text, 30);
      
      textLines.forEach((line, index) => {
        lines.push(`${startTime},${endTime},${line}`);
      });
    });
    
    return lines.join('\n');
  }

  /**
   * SRT 시간 형식을 ffmpeg 형식으로 변환
   */
  private convertSRTTimeToFFmpeg(srtTime: string): string {
    // SRT: HH:MM:SS,mmm -> ffmpeg: HH:MM:SS.mmm
    return srtTime.replace(',', '.');
  }

  /**
   * 텍스트를 지정된 길이로 분할
   */
  private splitTextIntoLines(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) {
      return [text];
    }
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + word).length <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.slice(0, 2); // 최대 2줄로 제한
  }
}

