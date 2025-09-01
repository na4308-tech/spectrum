#!/usr/bin/env tsx

import { config } from 'dotenv';
import { DataParser } from './data/parser.js';
import { ScriptGenerator } from './script/makeScript.js';
import { FalClipGenerator } from './fal/generateClip.js';
import { TextOverlayGenerator } from './overlay/textOverlay.js';
import { VideoEditor } from './editor/videoEditor.js';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// 환경 변수 로드
config();

/**
 * 메인 실행 클래스
 */
class ShortsGenerator {
  private dataParser: DataParser;
  private scriptGenerator: ScriptGenerator;
  private clipGenerator: FalClipGenerator;
  private overlayGenerator: TextOverlayGenerator;
  private videoEditor: VideoEditor;

  constructor() {
    // 각 모듈 초기화
    this.dataParser = new DataParser();
    this.scriptGenerator = new ScriptGenerator(60); // 최대 60초
    this.clipGenerator = new FalClipGenerator('./out', './temp', 2);
    this.overlayGenerator = new TextOverlayGenerator('./temp', './temp');
    this.videoEditor = new VideoEditor('./out', './temp');
    
    // 필요한 디렉토리 생성
    this.ensureDirectories();
  }

  /**
   * 필요한 디렉토리 생성
   */
  private ensureDirectories(): void {
    const dirs = ['./out', './temp', './assets'];
    dirs.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        console.log(`📁 디렉토리 생성: ${dir}`);
      }
    });
  }

  /**
   * 전체 파이프라인 실행
   */
  async run(dataFilename: string = 'sample.json'): Promise<void> {
    try {
      console.log('🚀 전파 산업 동향 쇼츠 생성 시작!');
      console.log('=' .repeat(50));

      // 1단계: 데이터 파싱
      console.log('\n📊 1단계: 크롤링 데이터 파싱');
      const crawledData = await this.dataParser.parseFile(dataFilename);
      console.log(`✅ ${crawledData.items.length}개 아이템 파싱 완료`);
      
      // 최신 3개 아이템만 사용 (60초 제한)
      const filteredItems = this.dataParser.filterData(crawledData, { maxItems: 3 });
      console.log(`📝 사용할 아이템: ${filteredItems.length}개`);

      // 2단계: 스크립트 및 SRT 생성
      console.log('\n📝 2단계: 쇼츠용 스크립트 생성');
      const { scripts, totalDuration, srtSubtitles } = await this.scriptGenerator.generateScripts(filteredItems);
      console.log(`✅ ${scripts.length}개 스크립트 생성 완료 (총 길이: ${totalDuration}초)`);

      // 3단계: fal API로 각 클립 생성
      console.log('\n🎬 3단계: AI 동영상 클립 생성');
      const clips = await this.clipGenerator.generateMultipleClips(scripts);
      const clipsSummary = this.clipGenerator.getClipsSummary(clips);
      console.log(`✅ 클립 생성 완료: ${clipsSummary.success}/${clipsSummary.total} 성공`);

      if (clipsSummary.success === 0) {
        throw new Error('생성된 클립이 없어 동영상을 만들 수 없습니다.');
      }

      // 4단계: 텍스트 오버레이 생성
      console.log('\n🎨 4단계: 텍스트 오버레이 생성');
      const allOverlays: any[] = [];
      for (const script of scripts) {
        const overlays = await this.overlayGenerator.generateAllOverlays(script);
        allOverlays.push(...overlays);
      }
      console.log(`✅ ${allOverlays.length}개 오버레이 생성 완료`);

      // 5단계: 동영상 편집 및 합성
      console.log('\n🎬 5단계: 동영상 편집 및 합성');
      const editedVideo = await this.videoEditor.createShortsVideo(
        clips,
        allOverlays,
        srtSubtitles
      );

      if (editedVideo.success) {
        console.log('\n🎉 쇼츠 동영상 생성 완료!');
        console.log('=' .repeat(50));
        console.log(`📁 출력 파일: ${editedVideo.outputPath}`);
        console.log(`⏱️ 동영상 길이: ${editedVideo.duration}초`);
        console.log(`📐 해상도: ${editedVideo.width}x${editedVideo.height}`);
        console.log('=' .repeat(50));
        
        // 임시 파일 정리
        await this.videoEditor.cleanupTempFiles(editedVideo.id);
        
      } else {
        throw new Error(`동영상 편집 실패: ${editedVideo.error}`);
      }

    } catch (error) {
      console.error('\n❌ 쇼츠 생성 실패:', error);
      process.exit(1);
    }
  }

  /**
   * 특정 데이터 파일로 실행
   */
  async runWithFile(dataFilename: string): Promise<void> {
    if (!existsSync(join('./src/data', dataFilename))) {
      console.error(`❌ 데이터 파일을 찾을 수 없습니다: ${dataFilename}`);
      console.log('📁 사용 가능한 파일:');
      // 디렉토리 내용 출력 (실제 구현에서는 fs.readdir 사용)
      return;
    }
    
    await this.run(dataFilename);
  }

  /**
   * 샘플 데이터로 테스트 실행
   */
  async runWithSample(): Promise<void> {
    console.log('🧪 샘플 데이터로 테스트 실행');
    await this.run('sample.json');
  }
}

/**
 * 메인 실행 함수
 */
async function main(): Promise<void> {
  const generator = new ShortsGenerator();
  
  // 명령행 인수 처리
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // 특정 파일로 실행
    await generator.runWithFile(args[0]);
  } else {
    // 샘플 데이터로 실행
    await generator.runWithSample();
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ 예상치 못한 오류:', error);
    process.exit(1);
  });
}

export default ShortsGenerator;

