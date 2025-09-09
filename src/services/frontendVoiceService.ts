// 프론트엔드 기반 음성 서비스 (Web Speech API STT + RealTans TTS)
import { STTResponse, TTSResponse, VoiceSettings } from '../types/voice';

export class FrontendVoiceService {
  private static openaiApiKey: string | null = null;
  private static realTansApiKey: string | null = null;

  // API 키 설정
  static setApiKeys(openaiKey: string, realTansKey: string) {
    this.openaiApiKey = openaiKey;
    this.realTansApiKey = realTansKey;
  }

  // STT: Web Speech API 사용 (API 키 불필요)
  static async speechToTextWebSpeech(language: string = 'ko-KR'): Promise<STTResponse> {
    return new Promise((resolve, reject) => {
      // Web Speech API 지원 확인
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        reject(new Error('이 브라우저는 Web Speech API를 지원하지 않습니다. Chrome, Edge, Safari를 사용해주세요.'));
        return;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language;

      recognition.onstart = () => {
        console.log('🎤 Web Speech API 음성 인식 시작');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('🎤 Web Speech API 인식 결과:', transcript);
        
        resolve({
          success: true,
          message: '음성 인식이 완료되었습니다.',
          text: transcript,
          language: language,
          duration: 0
        });
      };

      recognition.onerror = (event: any) => {
        console.error('Web Speech API 오류:', event.error);
        let errorMessage = '음성 인식 중 오류가 발생했습니다.';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = '음성이 감지되지 않았습니다. 다시 시도해주세요.';
            break;
          case 'audio-capture':
            errorMessage = '마이크에 접근할 수 없습니다. 마이크 권한을 확인해주세요.';
            break;
          case 'not-allowed':
            errorMessage = '마이크 접근 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.';
            break;
          case 'network':
            errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
            break;
        }
        
        reject(new Error(errorMessage));
      };

      recognition.onend = () => {
        console.log('🎤 Web Speech API 음성 인식 종료');
      };

      recognition.start();
    });
  }

  // STT: OpenAI Whisper API 사용 (고품질, API 키 필요)
  static async speechToTextWhisper(audioBlob: Blob, language: string = 'ko'): Promise<STTResponse> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다.');
    }

    try {
      console.log('🎤 OpenAI Whisper STT 호출:', {
        fileSize: audioBlob.size,
        fileType: audioBlob.type,
        language
      });

      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.wav');
      formData.append('model', 'whisper-1');
      formData.append('language', language);

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI Whisper API 오류: ${response.status} - ${errorData.error?.message || '알 수 없는 오류'}`);
      }

      const result = await response.json();
      console.log('🎤 Whisper STT 응답:', result);

      return {
        success: true,
        message: '음성 인식이 완료되었습니다.',
        text: result.text,
        language: language,
        duration: audioBlob.size // 대략적인 지속시간 추정
      };
    } catch (error) {
      console.error('Whisper STT API 호출 중 오류:', error);
      throw error;
    }
  }

  // STT: 자동 선택 (Web Speech API 우선, Whisper API 대체)
  static async speechToText(audioBlob: Blob, language: string = 'ko'): Promise<STTResponse> {
    // Web Speech API를 먼저 시도
    try {
      return await this.speechToTextWebSpeech(language === 'ko' ? 'ko-KR' : 'en-US');
    } catch (webSpeechError) {
      console.warn('Web Speech API 실패, Whisper API로 대체:', webSpeechError);
      
      // Whisper API가 설정되어 있으면 사용
      if (this.openaiApiKey) {
        return await this.speechToTextWhisper(audioBlob, language);
      }
      
      // 둘 다 실패하면 Web Speech API 오류 반환
      throw webSpeechError;
    }
  }

  // TTS: RealTans API 사용
  static async textToSpeech(text: string, settings?: Partial<VoiceSettings>): Promise<TTSResponse> {
    if (!this.realTansApiKey) {
      throw new Error('RealTans API 키가 설정되지 않았습니다.');
    }

    try {
      console.log('🔊 RealTans TTS 호출:', {
        text: text.substring(0, 50) + '...',
        language: settings?.language || 'ko',
        voice: settings?.voice || 'default'
      });

      const response = await fetch('https://api.realtans.com/v1/tts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.realTansApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          voice: settings?.voice || 'default',
          language: settings?.language || 'ko',
          speed: settings?.speed || 1.0,
          pitch: settings?.pitch || 1.0,
          volume: settings?.volume || 0.9
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`RealTans TTS API 오류: ${response.status} - ${errorData.error?.message || '알 수 없는 오류'}`);
      }

      const audioBlob = await response.blob();
      const audioData = await this.blobToBase64(audioBlob);

      console.log('🔊 RealTans TTS 응답:', {
        size: audioBlob.size,
        type: audioBlob.type
      });

      return {
        success: true,
        message: '음성 합성이 완료되었습니다.',
        audio_data: audioData,
        duration: audioBlob.size // 대략적인 지속시간 추정
      };
    } catch (error) {
      console.error('RealTans TTS API 호출 중 오류:', error);
      throw error;
    }
  }

  // Blob을 Base64로 변환
  private static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // data:audio/wav;base64, 부분 제거
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000, // Whisper에 최적화된 샘플레이트
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus' // 브라우저 호환성을 위한 형식
      });
      
      return mediaRecorder;
    } catch (error) {
      console.error('마이크 접근 실패:', error);
      throw new Error('마이크 접근이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
    }
  }

  // 녹음 중지 및 오디오 데이터 반환
  static stopRecording(mediaRecorder: MediaRecorder): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        resolve(blob);
      };

      mediaRecorder.onerror = (event) => {
        reject(new Error('녹음 중 오류가 발생했습니다.'));
      };

      mediaRecorder.stop();
    });
  }

  // 서비스 상태 확인 (API 키 유효성 검사)
  static async checkHealth(): Promise<{ status: string; stt_available: boolean; tts_available: boolean }> {
    const hasOpenAIKey = !!this.openaiApiKey;
    const hasRealTansKey = !!this.realTansApiKey;

    return {
      status: hasOpenAIKey && hasRealTansKey ? 'healthy' : 'unhealthy',
      stt_available: hasOpenAIKey,
      tts_available: hasRealTansKey
    };
  }

  // API 키 유효성 검사
  static async validateApiKeys(): Promise<{ openai_valid: boolean; realTans_valid: boolean }> {
    const results = { openai_valid: false, realTans_valid: false };

    // OpenAI API 키 검증
    if (this.openaiApiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
          },
        });
        results.openai_valid = response.ok;
      } catch (error) {
        console.warn('OpenAI API 키 검증 실패:', error);
      }
    }

    // RealTans API 키 검증
    if (this.realTansApiKey) {
      try {
        const response = await fetch('https://api.realtans.com/v1/voices', {
          headers: {
            'Authorization': `Bearer ${this.realTansApiKey}`,
          },
        });
        results.realTans_valid = response.ok;
      } catch (error) {
        console.warn('RealTans API 키 검증 실패:', error);
      }
    }

    return results;
  }
}
