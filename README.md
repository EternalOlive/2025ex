# 2025ex
1. submission-status 폰트크기 조절
2. ~sector-item 갭줄이고 가운데 정렬?????~
3. 푸터 모바일 반응형
4. 단락별 여백체크
5. 인트로 모바일 줄바꿈
6. 대상이랑 수상작이랑 폰트 들어가는 거 크기 바꾸기
7. 전시입장 버튼


css.intro-inner p {
    font-family: 'Pretendard';
    font-weight: 500;
    font-size: clamp(14px, 1.2vw, 20px); /* 더 작은 범위로 조정 */
    line-height: 1.6; /* 고정값으로 변경 */
    letter-spacing: -0.02em;
    margin-bottom: 1em; /* 문단 간격 */
    max-width: 800px; /* 최대 너비 제한으로 가독성 향상 */
    word-break: keep-all; /* 한글 단어 단위로 줄바꿈 */
    overflow-wrap: break-word; /* 긴 단어 자동 줄바꿈 */
    color: #000000;
}

/* 모바일에서 더 작게 */
@media (max-width: 768px) {
    .intro-inner p {
        font-size: clamp(12px, 3.5vw, 16px);
        line-height: 1.5;
        max-width: 100%;
    }
}

<p>
    한국교육환경보호원에서 주최한 유치원급식 현장소통단 사생대회 <b>'우리 유치원 급식 동화'</b>는 건강한 식생활과 안전한 급식문화 확산을 지원하고 건강한 유치원 급식에 대한 관심과 이해를 높여 <b>식생활 교육을 실천</b>을 목적으로 개최하였습니다.
</p>
<p>
    유치원 원아와 학부모님들의 성원으로 총 <b>220작품</b>이 응모되어 총 <b>17작품</b>을 선정하였습니다. 창의적인 급식 이야기를 통해 건강한 유치원 급식 문화에 대한 공감과 이해가 더욱 깊어지기를 바랍니다.
</p>