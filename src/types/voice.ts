// 음성 API 관련 타입 정의

export interface STTResponse {
  success: boolean;
  message: string;
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export interface TTSResponse {
  success: boolean;
  message: string;
  audio_url?: string;
  audio_data?: string; // base64 encoded audio for pyttsx3
  duration?: number;
  file_size?: number;
}

export interface TTSStreamResponse {
  chunk: string; // base64 encoded audio chunk
  is_final: boolean;
  sequence: number;
  timestamp?: number;
  duration?: number;
}

export interface RealtimeTTSResponse {
  type: 'audio' | 'text' | 'status' | 'error';
  data: string;
  sequence?: number;
  is_final?: boolean;
  timestamp?: number;
}

export interface VoiceInfo {
  stt_model: string;
  tts_model: string;
  supported_languages: string[];
  max_audio_duration: number;
  supported_formats: string[];
  available_voices?: string[]; // pyttsx3 사용 가능한 음성 목록
}

export interface HealthResponse {
  status: string;
  stt_available: boolean;
  tts_available: boolean;
  timestamp: string;
}

export interface LanguageInfo {
  code: string;
  name: string;
  native_name: string;
}

export interface LanguagesResponse {
  stt_languages: LanguageInfo[];
  tts_languages: LanguageInfo[];
}

export interface SpeakerInfo {
  id: string;
  name: string;
  language: string;
  gender?: string;
  description?: string;
}

export interface SpeakersResponse {
  speakers: SpeakerInfo[];
}

export interface VoiceSettings {
  language: string;
  voice: string;
  speed: number;
  pitch: number;
  volume?: number; // pyttsx3에서 지원하는 볼륨 설정 (0.0 ~ 1.0)
  rate?: number; // pyttsx3에서 지원하는 말하기 속도 (기본값: 150)
}
