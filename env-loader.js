// env-loader.js - 브라우저에서 환경변수 로딩
(function() {
    // 개발 환경에서만 실행 (프로덕션에서는 다른 방식 사용)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // 개발 환경 설정
        window.SUPABASE_URL = 'https://pimgwrosozsowpetqeeq.supabase.co';
        window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpbWd3cm9zb3pzb3dwZXRxZWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MTcxMjgsImV4cCI6MjA3MDk5MzEyOH0.VKEsxMu47TDVvV93Gy9I-z4UmfNYlNEhSYkBSS5vDqU'; // 실제 키로 교체 필요
        
        console.log('🔧 개발 환경 Supabase 설정 로드됨');
    } else {
        // 프로덕션 환경에서는 서버에서 주입되거나 다른 방식으로 설정
        console.warn('⚠️ 프로덕션 환경에서는 환경변수를 서버에서 설정해야 합니다.');
    }
})();
