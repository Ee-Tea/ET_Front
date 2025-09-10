// 프론트엔드 기반 음성 서비스 (Web Speech API STT + RealTans TTS)
import { STTResponse, TTSResponse, VoiceSettings } from '../types/voice';

export class FrontendVoiceService {
  private static openaiApiKey: string | null = null;
  private static realTansApiKey: string | null = null;

  // 네트워크 연결 상태 확인
  private static async checkNetworkConnection(): Promise<boolean> {
    // Web Speech API는 브라우저 내장 기능이므로 네트워크 연결 확인 불필요
    // 브라우저가 Web Speech API를 지원하는지만 확인하면 됨
    return true;
  }

  // API 키 설정
  static setApiKeys(openaiKey: string, realTansKey: string) {
    this.openaiApiKey = openaiKey;
    this.realTansApiKey = realTansKey;
  }

  // STT: Web Speech API 사용 (API 키 불필요)
  static async speechToTextWebSpeech(language: string = 'ko-KR', retryCount: number = 0): Promise<STTResponse> {
    const maxRetries = 2; // 최대 2번 재시도
    
    return new Promise((resolve, reject) => {
      // Web Speech API 지원 확인
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        reject(new Error('이 브라우저는 Web Speech API를 지원하지 않습니다. Chrome, Edge, Safari를 사용해주세요.'));
        return;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      // 타임아웃 설정 (10초)
      const timeoutId = setTimeout(() => {
        recognition.stop();
        reject(new Error('음성 인식 시간이 초과되었습니다. 다시 시도해주세요.'));
      }, 10000);

      // Web Speech API 설정 최적화
      recognition.continuous = false;
      recognition.interimResults = true; // 중간 결과도 받아서 더 빠른 피드백
      recognition.lang = language;
      recognition.maxAlternatives = 1; // 최대 대안 수 제한
      
      // Web Speech API는 브라우저 내장 기능이므로 외부 API 엔드포인트 설정 불필요
      // serviceURI 설정을 제거하여 브라우저의 기본 Web Speech API 사용

      let hasResult = false;

      recognition.onstart = () => {
        console.log('🎤 Web Speech API 음성 인식 시작');
        clearTimeout(timeoutId);
      };

      recognition.onresult = (event: any) => {
        if (hasResult) return; // 중복 처리 방지
        
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        
        console.log('🎤 Web Speech API 인식 결과:', {
          transcript,
          confidence,
          isFinal: result.isFinal
        });
        
        // 중간 결과도 처리 (더 빠른 응답)
        if (transcript.trim().length > 0) {
          // 최종 결과 처리
          if (result.isFinal) {
            hasResult = true;
            clearTimeout(timeoutId);
            
            // 신뢰도가 낮은 경우 (0.2 미만) 재시도 제안 (임계값 낮춤)
            if (confidence < 0.2) {
              console.warn('🎤 낮은 신뢰도로 인식됨:', { transcript, confidence });
              if (retryCount < maxRetries) {
                console.log(`🔄 낮은 신뢰도로 인한 재시도 ${retryCount + 1}/${maxRetries}`);
                setTimeout(() => {
                  this.speechToTextWebSpeech(language, retryCount + 1)
                    .then(resolve)
                    .catch(reject);
                }, 1000 * (retryCount + 1));
                return;
              }
              reject(new Error('음성이 명확하지 않습니다. 더 천천히 말씀해주세요.'));
              return;
            }
            
            // 텍스트가 너무 짧은 경우 (1글자 미만) 재시도 제안 (임계값 낮춤)
            if (transcript.trim().length < 1) {
              console.warn('🎤 너무 짧은 음성:', transcript);
              if (retryCount < maxRetries) {
                console.log(`🔄 짧은 음성으로 인한 재시도 ${retryCount + 1}/${maxRetries}`);
                setTimeout(() => {
                  this.speechToTextWebSpeech(language, retryCount + 1)
                    .then(resolve)
                    .catch(reject);
                }, 1000 * (retryCount + 1));
                return;
              }
              reject(new Error('음성이 너무 짧습니다. 더 길게 말씀해주세요.'));
              return;
            }
            
            console.log('🎤 최종 인식 결과:', { transcript: transcript.trim(), confidence });
            
            resolve({
              success: true,
              message: '음성 인식이 완료되었습니다.',
              text: transcript.trim(),
              language: language,
              duration: 0
            });
          }
          // 중간 결과도 처리 (더 빠른 응답을 위해)
          else if (transcript.trim().length >= 3 && confidence > 0.5) {
            hasResult = true;
            clearTimeout(timeoutId);
            
            console.log('🎤 중간 결과로 인식 완료:', { transcript: transcript.trim(), confidence });
            
            resolve({
              success: true,
              message: '음성 인식이 완료되었습니다.',
              text: transcript.trim(),
              language: language,
              duration: 0
            });
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Web Speech API 오류:', event.error);
        clearTimeout(timeoutId);
        
        let errorMessage = '음성 인식 중 오류가 발생했습니다.';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = '음성이 감지되지 않았습니다. 마이크에 더 가까이서 말씀해주세요.';
            break;
          case 'audio-capture':
            errorMessage = '마이크에 접근할 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.';
            break;
          case 'not-allowed':
            errorMessage = '마이크 접근 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.';
            break;
          case 'network':
            if (retryCount < maxRetries) {
              console.log(`🔄 네트워크 오류로 인한 재시도 ${retryCount + 1}/${maxRetries}`);
              setTimeout(() => {
                this.speechToTextWebSpeech(language, retryCount + 1)
                  .then(resolve)
                  .catch(reject);
              }, 2000 * (retryCount + 1)); // 재시도 간격 증가
              return;
            }
            errorMessage = '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인하고 잠시 후 다시 시도해주세요.';
            break;
          case 'aborted':
            errorMessage = '음성 인식이 중단되었습니다. 다시 시도해주세요.';
            break;
          case 'service-not-allowed':
            errorMessage = '음성 인식 서비스가 허용되지 않습니다. HTTPS 환경에서 사용해주세요.';
            break;
          case 'bad-grammar':
            errorMessage = '음성 인식 문법 오류가 발생했습니다. 다시 시도해주세요.';
            break;
          case 'aborted':
            errorMessage = '음성 인식이 중단되었습니다.';
            break;
          default:
            errorMessage = `음성 인식 오류가 발생했습니다: ${event.error}. 잠시 후 다시 시도해주세요.`;
            break;
        }
        
        reject(new Error(errorMessage));
      };

      recognition.onend = () => {
        console.log('🎤 Web Speech API 음성 인식 종료');
        clearTimeout(timeoutId);
        
        // 결과가 없이 종료된 경우 - 재시도 가능한 오류로 처리
        if (!hasResult) {
          if (retryCount < maxRetries) {
            console.log(`🔄 음성 미감지로 인한 재시도 ${retryCount + 1}/${maxRetries}`);
            setTimeout(() => {
              this.speechToTextWebSpeech(language, retryCount + 1)
                .then(resolve)
                .catch(reject);
            }, 1000 * (retryCount + 1)); // 재시도 간격
            return;
          }
          reject(new Error('음성이 감지되지 않았습니다. 마이크에 더 가까이서 말씀해주세요.'));
        }
      };

      // Web Speech API는 브라우저 내장 기능이므로 바로 음성 인식 시작
      try {
        recognition.start();
      } catch (error) {
        clearTimeout(timeoutId);
        reject(new Error('음성 인식을 시작할 수 없습니다. 마이크 권한을 확인해주세요.'));
      }
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
