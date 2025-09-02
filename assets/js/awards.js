// 수상작 데이터 변수
let awards = {};

// 폴더명 매핑 (출품작과 동일)
const awardsFolderMapping = {
    '그림일기': '그림일기',
    '동시': '동시',
    '네컷만화': '네컷만화',
    '글·시': '글시',
    '네컷사진': '네컷사진',
    '사례': '사례'
};

// 카테고리별 배경색 매핑
const categoryColors = {
    '그림일기': '#E6F8C2',
    '동시': '#FFF4C4',
    '네컷만화': '#D2E8FF',
    '글·시': '#F0E6FF',
    '네컷사진': '#FFDEE1',
    '사례': '#E8F5E8'
};

// JSON에서 수상작 데이터 로드
async function loadAwardsData() {
    try {
        const response = await fetch('assets/js/awards.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        awards = await response.json();
        return awards;
    } catch (error) {
        console.error('수상작 데이터 로드 실패:', error);
        awards = {};
        return awards;
    }
}

// 대상 렌더링
function renderGrandPrize() {
    if (!awards.grand) return;
    
    const grandData = awards.grand;
    
    // 작품 이미지 업데이트
    const workImg = document.querySelector('.prize-sector .work');
    if (workImg) {
        workImg.src = `assets/images/works/${awardsFolderMapping[grandData.category]}/${grandData.filename}`;
        workImg.alt = `${grandData.name} 대상 수상작`;
        workImg.style.cursor = 'pointer';
        
        // 클릭 이벤트 추가
        workImg.onclick = () => {
            showAwardModal(grandData, 'grand');
        };
        
        workImg.onerror = function() {
            console.warn(`대상 이미지를 찾을 수 없습니다: ${this.src}`);
            this.style.display = 'none'; // 이미지가 없으면 숨김
        };
    }
    
    // 수상자 정보 업데이트
    const categorySpan = document.querySelector('.prize-sector .sec-text');
    const schoolSpan = document.querySelector('.prize-sector .kindergarten');
    const nameSpan = document.querySelector('.prize-sector .winner-name-gold');
    const categoryBg = document.querySelector('.prize-sector .bg-sec');
    
    if (categorySpan) categorySpan.textContent = grandData.category;
    if (schoolSpan) schoolSpan.textContent = grandData.school;
    if (nameSpan) nameSpan.textContent = grandData.name;
    if (categoryBg) categoryBg.style.background = categoryColors[grandData.category] || '#E6F8C2';
}

// 금상/은상/동상 렌더링
function renderPrizeList(prizeType, containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container || !awards[prizeType]) return;
    
    const prizeData = awards[prizeType];
    container.innerHTML = ''; // 기존 내용 제거
    
    prizeData.forEach((winner, index) => {
        const sec = document.createElement('div');
        sec.className = 'sec';
        // 이미지 클래스 결정 (동상은 work-img-b, 우수유치원은 work-img-ex, 나머지는 work-img-gold)
        let imgClass = 'work-img-gold';
        if (prizeType === 'bronze') imgClass = 'work-img-b';
        let imgSrc = `assets/images/works/${awardsFolderMapping[winner.category]}/${winner.filename}`;
        if (prizeType === 'goodex') {
            imgClass = 'work-img-ex';
            imgSrc = `assets/images/works/사례/${winner.folderName}/${winner.thumbnail}`;
        }
        sec.innerHTML = `
            <img src="${imgSrc}" 
                 class="${imgClass}" 
                 alt="${winner.name} ${prizeType === 'gold' ? '금상' : prizeType === 'silver' ? '은상' : prizeType === 'bronze' ? '동상' : '우수유치원'} 수상작"
                 style="cursor: pointer;"
                 onerror="this.style.display='none'; console.warn('수상작 이미지 없음:', this.src)"/>
            <div class="winner-info-gold">
                <div class="bg-sec" style="background: ${categoryColors[winner.category] || '#E6F8C2'}">
                    <span class="sec-text-other">${winner.category}</span>
                </div>
                <div class="kindergarten-info">
                    <span class="kindergarten">${winner.school}</span>
                </div>
                <span class="winner-name-other">${winner.name}</span>
            </div>
        `;
        
        // 이미지에 클릭 이벤트 추가
        const img = sec.querySelector('img');
        if (img) {
            img.onclick = () => {
                showAwardModal(winner, prizeType);
            };
        }
        
        container.appendChild(sec);
    });
    
    // 동상의 경우 숨김 처리된 빈 칸들 추가 (기존 레이아웃 유지)
    if (prizeType === 'bronze') {
        // 빈 칸 2개 추가 (기존 HTML 구조 참조)
        for (let i = 0; i < 2; i++) {
            const hiddenSec = document.createElement('div');
            hiddenSec.className = 'sec hide';
            container.appendChild(hiddenSec);
        }
    }
}

// 모든 수상작 렌더링
function renderAllAwards() {
    renderGrandPrize();
    renderPrizeList('gold', '.gold-4-list');
    renderPrizeList('silver', '.silver-list');
    renderPrizeList('bronze', '.bronze-list');
    renderPrizeList('goodex', '.goodex');
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    // 수상작 데이터 로드
    await loadAwardsData();
    
    // 모든 수상작 렌더링
    renderAllAwards();
});

// 전역 함수로 export
window.loadAwardsData = loadAwardsData;
window.renderAllAwards = renderAllAwards;

// 수상작 전용 모달 함수
function showAwardModal(awardWork, prizeType) {
    // 기존 모달 제거
    const existing = document.getElementById('award-modal');
    if (existing) existing.remove();

    // 요소 생성
    const backdrop = document.createElement('div');
    backdrop.id = 'award-modal';
    backdrop.className = 'lightbox-backdrop';

    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';


    // 미디어 영역
    const media = document.createElement('div');
    media.className = 'lightbox__media';

    // 우수유치원(사례)일 경우 슬라이드
    if (prizeType === 'goodex') {
        let images = [];
        // awards.json의 images 배열 우선 사용
        if (awardWork.images && Array.isArray(awardWork.images) && awardWork.images.length > 0) {
            // awards.json의 images 배열 사용 (folderName을 직접 사용)
            images = awardWork.images.map(img => `assets/images/works/사례/${awardWork.folderName}/${img}`);
        } else {
            // case_works.json에서 이미지 목록 가져오기 (백업)
            fetch('assets/js/case_works.json')
                .then(res => res.json())
                .then(data => {
                    const caseList = data['사례'];
                    const found = caseList.find(c => c.school === awardWork.school);
                    if (found && found.images) {
                        images = found.images.map(img => `assets/images/works/사례/${found.folderName}/${img}`);
                    } else {
                        images = [`assets/images/works/${awardsFolderMapping[awardWork.category]}/${awardWork.filename}`];
                    }
                    showGoodexSlider(images);
                });
            return;
        }
        showGoodexSlider(images);
        function showGoodexSlider(images) {
            let currentIdx = 0;
            const slideImg = document.createElement('img');
            slideImg.className = 'lightbox__image';
            slideImg.alt = `${awardWork.name} 수상작`;
            slideImg.src = images[0];

            const fallback = document.createElement('div');
            fallback.className = 'lightbox__fallback';
            fallback.textContent = '이미지를 불러올 수 없습니다.';
            fallback.style.display = 'none';

            slideImg.onerror = () => {
                slideImg.style.display = 'none';
                fallback.style.display = 'block';
            };

            // 슬라이드 인디케이터
            const indicator = document.createElement('div');
            indicator.className = 'lightbox__indicator';
            indicator.style.position = 'absolute';
            indicator.style.bottom = '18px';
            indicator.style.left = '50%';
            indicator.style.transform = 'translateX(-50%)';
            indicator.style.background = 'rgba(0,0,0,0.5)';
            indicator.style.color = '#fff';
            indicator.style.padding = '4px 12px';
            indicator.style.borderRadius = '12px';
            indicator.style.fontSize = '1rem';
            indicator.style.zIndex = '10';
            function updateIndicator() {
                indicator.textContent = `${currentIdx + 1} / ${images.length}`;
            }
            updateIndicator();

            // 슬라이드 버튼
            const prevBtn = document.createElement('button');
            prevBtn.className = 'lightbox__nav lightbox__nav--prev';
            prevBtn.innerHTML = '◀';
            prevBtn.onclick = (e) => {
                e.stopPropagation();
                currentIdx = (currentIdx - 1 + images.length) % images.length;
                slideImg.src = images[currentIdx];
                updateIndicator();
            };

            const nextBtn = document.createElement('button');
            nextBtn.className = 'lightbox__nav lightbox__nav--next';
            nextBtn.innerHTML = '▶';
            nextBtn.onclick = (e) => {
                e.stopPropagation();
                currentIdx = (currentIdx + 1) % images.length;
                slideImg.src = images[currentIdx];
                updateIndicator();
            };

            media.style.display = 'flex';
            media.style.alignItems = 'center';
            media.style.justifyContent = 'center';
            media.style.gap = '1vw';
            prevBtn.style.zIndex = '2';
            nextBtn.style.zIndex = '2';
            slideImg.style.flex = '0 1 auto';
            media.appendChild(prevBtn);
            media.appendChild(slideImg);
            media.appendChild(nextBtn);
            media.appendChild(indicator);
            media.appendChild(fallback);
        }
    } else {
        const img = document.createElement('img');
        img.className = 'lightbox__image';
        img.alt = `${awardWork.name} 수상작`;
        img.src = `assets/images/works/${awardsFolderMapping[awardWork.category]}/${awardWork.filename}`;
        img.onerror = () => {
            img.style.display = 'none';
            fallback.style.display = 'block';
        };

        const fallback = document.createElement('div');
        fallback.className = 'lightbox__fallback';
        fallback.textContent = '이미지를 불러올 수 없습니다.';
        fallback.style.display = 'none';

        media.appendChild(img);
        media.appendChild(fallback);
    }

    // 메타 영역
    const meta = document.createElement('div');
    meta.className = 'lightbox__meta';

    const pill = document.createElement('div');
    pill.className = 'lightbox__pill';
    pill.textContent = awardWork.category;
    pill.style.background = categoryColors[awardWork.category] || '#E6F8C2';

    // 세로 레이아웃: 메달 → 분야 → 이름 → 소속
    const titleRow = document.createElement('div');
    titleRow.className = 'lightbox__title-row';

    // 메달 이미지 결정
    const medalMap = {
        grand: 'winner.png',
        gold: 'gold.png',
        silver: 'silver.png',
        bronze: 'bronze.png',
        goodex: 'clover.png'
    };
    const medalImg = document.createElement('img');
    medalImg.className = 'lightbox__medal';
    const medalFile = prizeType && medalMap[prizeType] ? medalMap[prizeType] : 'clover.png';
    medalImg.src = `assets/images/${medalFile}`;
    medalImg.alt = prizeType ? `${prizeType} medal` : 'medal';
    medalImg.onerror = () => { medalImg.style.display = 'none'; };

    // 정보 스택 (분야, 이름, 소속)
    const infoStack = document.createElement('div');
    infoStack.className = 'lightbox__info-stack';

    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'lightbox__category';
    categoryDiv.textContent = awardWork.category;
    categoryDiv.style.background = categoryColors[awardWork.category] || '#E6F8C2';

    const title = document.createElement('div');
    title.className = 'lightbox__title';
    title.textContent = awardWork.name;

    const subtitle = document.createElement('div');
    subtitle.className = 'lightbox__subtitle';
    subtitle.innerHTML = `<span class="lightbox__label">소속</span>${awardWork.school}`;

    titleRow.appendChild(medalImg);
    infoStack.appendChild(categoryDiv);
    infoStack.appendChild(title);
    infoStack.appendChild(subtitle);
    titleRow.appendChild(infoStack);

    meta.appendChild(titleRow);

    // 댓글 섹션 추가 (createCommentSection 함수가 존재하는 경우에만)
    // 우수유치원(goodex)의 경우 case_ 접두사로 통일된 ID 사용
    let commentItemId = awardWork.filename;
    if (prizeType === 'goodex' && awardWork.folderName) {
        commentItemId = `case_${awardWork.folderName}`;
    }
    
    if (typeof createCommentSection === 'function') {
        const commentSection = createCommentSection(commentItemId);
        meta.appendChild(commentSection);
    } else {
        console.warn('Awards - createCommentSection 함수를 찾을 수 없습니다 - 직접 HTML 삽입');
        // fallback: 직접 댓글 HTML 삽입
        const fallbackCommentSection = document.createElement('div');
        fallbackCommentSection.className = 'comment-section';
        fallbackCommentSection.innerHTML = `
            <h3>댓글 <span class="comment-count">(기능 준비중)</span></h3>
            <div class="comment-form">
                <textarea placeholder="댓글을 작성해주세요 (최대 500자)" maxlength="500" rows="3"></textarea>
                <div class="comment-form-bottom">
                    <span class="char-count">0/500</span>
                    <button class="comment-submit" disabled>댓글 작성</button>
                </div>
            </div>
            <div class="comments-list">
                <div class="no-comments">댓글 기능을 준비 중입니다.</div>
            </div>
        `;
        meta.appendChild(fallbackCommentSection);
    }

    // 닫기 버튼
    const closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox__close';
    closeBtn.setAttribute('aria-label', '닫기');
    closeBtn.innerHTML = '✕';
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        backdrop.remove();
        document.removeEventListener('keydown', onKey);
    });

    // 키보드 지원 (수상작은 이전/다음 없이 ESC만)
    function onKey(e) {
        if (e.key === 'Escape') {
            backdrop.remove();
            document.removeEventListener('keydown', onKey);
        }
    }
    document.addEventListener('keydown', onKey);

    // 조립 (수상작은 네비게이션 버튼 없음)
    lightbox.appendChild(media);
    lightbox.appendChild(meta);
    lightbox.appendChild(closeBtn);
    backdrop.appendChild(lightbox);

    // 배경 클릭 시 닫기
    backdrop.addEventListener('click', () => {
        backdrop.remove();
        document.removeEventListener('keydown', onKey);
    });

    // 컨텐츠 클릭 전파 방지
    lightbox.addEventListener('click', (e) => e.stopPropagation());

    document.body.appendChild(backdrop);
    
    // 댓글 로드 (loadComments 함수가 존재하는 경우에만)
    // 우수유치원(goodex)의 경우 case_ 접두사로 통일된 ID 사용
    let loadCommentItemId = awardWork.filename;
    if (prizeType === 'goodex' && awardWork.folderName) {
        loadCommentItemId = `case_${awardWork.folderName}`;
    }
    
    if (typeof loadComments === 'function') {
        setTimeout(() => {
            loadComments(loadCommentItemId);
        }, 100);
    } else {
        console.warn('Awards - loadComments 함수를 찾을 수 없습니다');
    }
}

