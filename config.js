// config.js - 환경변수 관리
const config = {
  supabase: {
    url: import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://pimgwrosozsowpetqeeq.supabase.co',
    anonKey: import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
  }
};

// 개발 환경에서 키가 없으면 경고
if (!config.supabase.anonKey && typeof window !== 'undefined') {
  console.warn('⚠️ Supabase API 키가 설정되지 않았습니다. .env 파일을 확인하세요.');
}

export default config;
