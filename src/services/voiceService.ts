// 음성 API 서비스
import { STTResponse, TTSResponse, TTSStreamResponse, RealtimeTTSResponse, VoiceInfo, HealthResponse, VoiceSettings, LanguageInfo, SpeakerInfo, LanguagesResponse, SpeakersResponse } from '../types/voice';

const API_BASE_URL = 'http://localhost:8001';

export class VoiceService {
  // STT: 음성을 텍스트로 변환
  static async speechToText(audioBlob: Blob, language: string = 'ko'): Promise<STTResponse> {
    try {
      // 파일 확장자 결정
      let fileName = 'recording.wav';
      let mimeType = 'audio/wav';
      
      if (audioBlob.type.includes('webm')) {
        fileName = 'recording.webm';
        mimeType = 'audio/webm';
      } else if (audioBlob.type.includes('mp4')) {
        fileName = 'recording.mp4';
        mimeType = 'audio/mp4';
      } else if (audioBlob.type.includes('ogg')) {
        fileName = 'recording.ogg';
        mimeType = 'audio/ogg';
      }
      
      // Blob을 File로 변환
      const audioFile = new File([audioBlob], fileName, { 
        type: mimeType 
      });
      
      const formData = new FormData();
      formData.append('audio_file', audioFile);
      formData.append('language', language);

      console.log('🎤 STT API 호출:', {
        url: `${API_BASE_URL}/voice/stt/upload`,
        fileSize: audioFile.size,
        fileType: audioFile.type,
        fileName: fileName,
        language
      });

      const response = await fetch(`${API_BASE_URL}/voice/stt/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('STT API 오류 응답:', errorText);
        
        if (response.status === 500) {
          throw new Error(`STT 서버 오류: 음성 서비스 서버가 실행되지 않았거나 파일 처리 중 오류가 발생했습니다. 서버를 확인해주세요.`);
        } else if (response.status === 404) {
          throw new Error(`STT API를 찾을 수 없습니다: 음성 서비스 서버가 실행되지 않았습니다.`);
        } else {
          throw new Error(`STT API 호출 실패: ${response.status} - ${errorText}`);
        }
      }

      const result = await response.json();
      console.log('🎤 STT API 응답:', result);
      return result;
    } catch (error) {
      console.error('STT API 호출 중 오류:', error);
      throw error;
    }
  }

  // TTS: 텍스트를 음성으로 변환 (pyttsx3 기반)
  static async textToSpeech(text: string, settings?: Partial<VoiceSettings>): Promise<TTSResponse> {
    const response = await fetch(`${API_BASE_URL}/voice/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        language: settings?.language || 'ko',
        speaker_wav: settings?.voice || null,
        volume: settings?.volume || 0.9,
        rate: settings?.rate || 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS API 호출 실패: ${response.status}`);
    }

    return await response.json();
  }

  // TTS 음성 파일 다운로드
  static async downloadTTSAudio(audioUrl: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}${audioUrl}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`음성 파일 다운로드 실패: ${response.status}`);
    }

    return await response.blob();
  }

  // 리얼타임 TTS 스트리밍 (WebSocket 기반)
  static createRealtimeTTSConnection(text: string, settings?: Partial<VoiceSettings>): WebSocket {
    const params = new URLSearchParams();
    params.append('text', text);
    params.append('language', settings?.language || 'ko');
    if (settings) {
      Object.entries(settings).forEach(([key, value]) => {
        if (key !== 'language') {
          params.append(key, value.toString());
        }
      });
    }

    const wsUrl = `ws://localhost:8001/voice/tts/stream?${params.toString()}`;
    const ws = new WebSocket(wsUrl);

    return ws;
  }

  // TTS 스트리밍 (pyttsx3 기반)
  static async *textToSpeechStream(text: string, settings?: Partial<VoiceSettings>): AsyncGenerator<TTSStreamResponse> {
    const params = new URLSearchParams();
    params.append('text', text);
    params.append('language', settings?.language || 'ko');
    if (settings) {
      Object.entries(settings).forEach(([key, value]) => {
        if (key !== 'language') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/voice/tts/stream?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`TTS 스트리밍 API 호출 실패: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('스트림 리더를 가져올 수 없습니다');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              yield data;
            } catch (e) {
              console.warn('스트림 데이터 파싱 실패:', line);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // 모델 정보 조회
  static async getVoiceInfo(): Promise<VoiceInfo> {
    const response = await fetch(`${API_BASE_URL}/voice/info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`음성 정보 API 호출 실패: ${response.status}`);
    }

    return await response.json();
  }

  // 서비스 상태 확인
  static async checkHealth(): Promise<HealthResponse> {
    // GET /health 엔드포인트 시도
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('GET /health 실패, POST /voice/health 시도');
    }

    // POST /voice/health 엔드포인트 시도
    const response = await fetch(`${API_BASE_URL}/voice/health`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`헬스 체크 API 호출 실패: ${response.status}`);
    }

    return await response.json();
  }

  // 지원 언어 목록 조회
  static async getSupportedLanguages(): Promise<LanguagesResponse> {
    const response = await fetch(`${API_BASE_URL}/voice/languages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`언어 목록 API 호출 실패: ${response.status}`);
    }

    return await response.json();
  }

  // 사용 가능한 화자 목록 조회
  static async getAvailableSpeakers(): Promise<SpeakersResponse> {
    const response = await fetch(`${API_BASE_URL}/voice/speakers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`화자 목록 API 호출 실패: ${response.status}`);
    }

    return await response.json();
  }

  // 오디오 파일 재생
  static playAudio(audioData: string): void {
    const audio = new Audio(`data:audio/wav;base64,${audioData}`);
    audio.play().catch(error => {
      console.error('오디오 재생 실패:', error);
    });
  }

  // 마이크 권한 요청 및 녹음 시작
  static async startRecording(): Promise<MediaRecorder> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    return mediaRecorder;
  }

  // 녹음 중지 및 오디오 데이터 반환
  static stopRecording(mediaRecorder: MediaRecorder): Promise<Blob> {
    return new Promise((resolve) => {
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        resolve(blob);
      };

      mediaRecorder.stop();
    });
  }
}
