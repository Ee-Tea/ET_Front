// 농사 관련 키워드 감지 유틸리티

export const FARMING_KEYWORDS = [
  // 작물 관련
  '작물', '농작물', '채소', '과일', '곡물', '벼', '쌀', '보리', '밀', '옥수수',
  '토마토', '고추', '배추', '무', '당근', '감자', '고구마', '양파', '마늘',
  '사과', '배', '포도', '딸기', '복숭아', '자두', '체리', '키위', '바나나',
  
  // 농업 활동
  '심기', '파종', '재배', '수확', '수확기', '심는', '키우는', '기르는',
  '물주기', '관수', '관리', '비료', '퇴비', '영양제', '농약', '방제',
  '잎따기', '가지치기', '전정', '접목', '번식', '묘목', '종자', '씨앗',
  
  // 계절/시기
  '봄', '여름', '가을', '겨울', '계절', '시기', '월', '일', '언제',
  '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월',
  '봄철', '여름철', '가을철', '겨울철', '성장기', '수확기',
  
  // 토양/환경
  '토양', '흙', '땅', '밭', '논', '온실', '하우스', '비닐하우스',
  'ph', '산성', '알칼리성', '수분', '습도', '온도', '일조량',
  '배수', '통풍', '환기', '그늘', '햇빛', '일사량',
  
  // 병해충
  '병', '해충', '벌레', '곤충', '진딧물', '응애', '선충', '곰팡이',
  '흰가루병', '역병', '탄저병', '점무늬병', '시들음병',
  '예방', '치료', '방제', '살충제', '살균제',
  
  // 농기구/장비
  '호미', '괭이', '삽', '갈퀴', '물뿌리개', '분무기', '스프레이',
  '트랙터', '경운기', '이앙기', '콤바인', '수확기',
  
  // 농업 용어
  '농업', '농사', '농장', '농부', '농민', '농촌', '시골',
  '유기농', '무농약', '친환경', '지속가능', '순환농업',
  '텃밭', '정원', '화분', '화단', '조경', '원예',
  
  // 기타 농사 관련
  '키우고', '재배하고', '농사짓고', '텃밭에서', '정원에서',
  '추천', '어떤', '어떻게', '방법', '기술', '노하우',
  '초보자', '처음', '처음으로', '처음에', '시작',
  '도움', '조언', '팁', '꿀팁', '비법'
];

/**
 * 텍스트에서 농사 관련 키워드가 포함되어 있는지 확인
 * @param text 확인할 텍스트
 * @returns 농사 관련 키워드가 포함되어 있으면 true
 */
export function isFarmingRelated(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  
  const lowerText = text.toLowerCase();
  
  // 농사 관련 키워드가 하나라도 포함되어 있으면 true
  return FARMING_KEYWORDS.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
}

/**
 * 농사 관련 키워드의 개수를 반환
 * @param text 확인할 텍스트
 * @returns 농사 관련 키워드의 개수
 */
export function getFarmingKeywordCount(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  
  const lowerText = text.toLowerCase();
  
  return FARMING_KEYWORDS.filter(keyword => 
    lowerText.includes(keyword.toLowerCase())
  ).length;
}

/**
 * 농사 관련도 점수를 반환 (0-100)
 * @param text 확인할 텍스트
 * @returns 농사 관련도 점수 (0-100)
 */
export function getFarmingRelevanceScore(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  
  const keywordCount = getFarmingKeywordCount(text);
  const textLength = text.length;
  
  // 키워드 개수와 텍스트 길이를 고려한 점수 계산
  const baseScore = Math.min(keywordCount * 10, 50); // 키워드당 10점, 최대 50점
  const lengthBonus = textLength > 50 ? 10 : 0; // 긴 텍스트에 보너스
  const densityBonus = keywordCount > 3 ? 20 : 0; // 키워드가 많으면 보너스
  
  return Math.min(baseScore + lengthBonus + densityBonus, 100);
}

/**
 * 농사 관련 질문인지 판단 (더 엄격한 기준)
 * @param text 확인할 텍스트
 * @returns 농사 관련 질문이면 true
 */
export function isFarmingQuestion(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  
  const lowerText = text.toLowerCase();
  
  // 질문 형태인지 확인
  const isQuestion = lowerText.includes('?') || 
                    lowerText.includes('어떻게') || 
                    lowerText.includes('언제') || 
                    lowerText.includes('어디서') || 
                    lowerText.includes('무엇을') || 
                    lowerText.includes('어떤') ||
                    lowerText.includes('추천') ||
                    lowerText.includes('도움') ||
                    lowerText.includes('조언');
  
  // 농사 관련 키워드가 있는지 확인
  const hasFarmingKeywords = isFarmingRelated(text);
  
  // 농사 관련도 점수가 30점 이상인지 확인
  const relevanceScore = getFarmingRelevanceScore(text);
  
  return isQuestion && hasFarmingKeywords && relevanceScore >= 30;
}
