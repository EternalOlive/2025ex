// 작품 데이터 변수 (JSON에서 로드됨)
let works = [];
let awardsData = null;

// 폴더명 매핑 (실제 폴더명과 일치하도록 확인 필요)
const folderMapping = {
    '그림일기': '그림일기',
    '동시': '동시',
    '네컷만화': '네컷만화',
    '글·시': '글시',
    '네컷사진': '네컷사진',
    '사례': '사례',
    '글시': '글시'  // JSON에서 '글시'로 되어 있는 경우 대비
};

// 카테고리별 배경색 매핑
const worksCategoryColors = {
    '그림일기': '#E6F8C2',
    '동시': '#FFF4C4',
    '네컷만화': '#D2E8FF',
    '글·시': '#F0E6FF',
    '네컷사진': '#FFDEE1',
    '사례': '#E8F5E8',
    '글시': '#F0E6FF'  // '글·시'와 동일한 색상
};

// JSON 파일에서 작품 데이터 로드
async function loadWorksData() {
    try {
        const response = await fetch('assets/js/works.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        works = await response.json();
        // awards.json도 함께 로드
        const awardsRes = await fetch('assets/js/awards.json');
        if (awardsRes.ok) {
            awardsData = await awardsRes.json();
        } else {
            awardsData = null;
        }
        // console.log('작품 데이터 로드 완료:', works.length, '개');
        return works;
    } catch (error) {
        console.error('작품 데이터 로드 실패:', error);
        works = [];
        awardsData = null;
        return works;
    }
}

// 현재 선택된 카테고리
let currentCategory = '그림일기';  // JSON에 있는 실제 카테고리명으로 초기화

// 페이지네이션 설정
const ITEMS_PER_PAGE = 12; // 3줄 x 4개 = 12개
let currentPage = 1;

// 작품 목록 렌더링
function renderWorks(category) {
    const workList = document.querySelector('.entry-work-list');
    if (!workList) return;
    
    const filteredWorks = works.filter(work => work.category === category);
    
    // 페이지네이션 계산
    const totalPages = Math.ceil(filteredWorks.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const worksToShow = filteredWorks.slice(startIndex, endIndex);
    
    workList.innerHTML = '';
    
    // 전체 컨테이너 (드래그 및 화살표 버튼을 위한)
    const mainContainer = document.createElement('div');
    mainContainer.style.cssText = `
        position: relative;
        width: 100%;
    `;
    
    // 작품 이미지들 표시
    const worksContainer = document.createElement('div');
    worksContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: repeat(3, 1fr);
        gap: 3px;
        margin: 20px 0;
        cursor: grab;
        user-select: none;
    `;
    
    // 드래그 기능 추가
    let startX = 0;
    let isDragging = false;
    
    worksContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        worksContainer.style.cursor = 'grabbing';
    });
    
    worksContainer.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
    });
    
    worksContainer.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        worksContainer.style.cursor = 'grab';
        
        const endX = e.clientX;
        const deltaX = startX - endX;
        
        // 드래그 거리가 50px 이상이면 페이지 이동
        if (Math.abs(deltaX) > 50) {
            if (deltaX > 0 && currentPage < totalPages) {
                // 오른쪽으로 드래그 = 다음 페이지
                currentPage++;
                renderWorks(category);
            } else if (deltaX < 0 && currentPage > 1) {
                // 왼쪽으로 드래그 = 이전 페이지
                currentPage--;
                renderWorks(category);
            }
        }
    });
    
    // 마우스가 영역을 벗어날 때 드래그 중단
    worksContainer.addEventListener('mouseleave', () => {
        isDragging = false;
        worksContainer.style.cursor = 'grab';
    });

    // 모바일 터치 스와이프 기능 추가
    let touchStartX = 0;
    let touchEndX = 0;
    worksContainer.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
        }
    });
    worksContainer.addEventListener('touchmove', function(e) {
        if (e.touches.length === 1) {
            touchEndX = e.touches[0].clientX;
        }
    });
    worksContainer.addEventListener('touchend', function(e) {
        const deltaX = touchStartX - touchEndX;
        if (Math.abs(deltaX) > 50) {
            if (deltaX > 0 && currentPage < totalPages) {
                // 오른쪽으로 스와이프 = 다음 페이지
                currentPage++;
                renderWorks(category);
            } else if (deltaX < 0 && currentPage > 1) {
                // 왼쪽으로 스와이프 = 이전 페이지
                currentPage--;
                renderWorks(category);
            }
        }
        // 값 초기화
        touchStartX = 0;
        touchEndX = 0;
    });
    
    worksToShow.forEach(work => {
        // 작품 컨테이너
        const workItem = document.createElement('div');
        workItem.style.display = 'flex';
        workItem.style.flexDirection = 'column';
        workItem.style.alignItems = 'center';
        workItem.style.justifyContent = 'center';
        workItem.style.padding = '8px';

            // 이미지 및 정보
            let img;
            if (work.category === '사례') {
                const caseContainer = document.createElement('div');
                caseContainer.className = 'case-img-container';
                img = document.createElement('img');
                img.src = `assets/images/works/${folderMapping[work.category]}/${work.filename}`;
                img.alt = `${work.name} 작품`;
                img.className = 'case-img';
                img.style.cursor = 'pointer';
                img.onclick = (e) => {
                    if (!isDragging) {
                        showCaseSlideModal(work);
                    }
                };
                img.draggable = false;
                img.onerror = function() {
                    console.warn(`이미지를 찾을 수 없습니다:`);
                    this.style.display = 'none';
                };
                caseContainer.appendChild(img);
                workItem.appendChild(caseContainer);
            } else {
                img = document.createElement('img');
                img.src = `assets/images/works/${folderMapping[work.category]}/${work.filename}`;
                img.alt = `${work.name} 작품`;
                img.className = 'work-img-b';
                img.style.cursor = 'pointer';
                img.onclick = (e) => {
                    if (!isDragging) {
                        if (work.category === '네컷사진' && work.filename.includes('/')) {
                            showCaseSlideModal(work);
                        } else {
                            showWorkModal(work);
                        }
                    }
                };
                img.draggable = false;
                img.onerror = function() {
                    console.warn(`이미지를 찾을 수 없습니다:`);
                    this.style.display = 'none';
                };
                workItem.appendChild(img);
            }

            // 소속/이름 2줄 정보
            const infoDiv = document.createElement('div');
        infoDiv.className = 'work-info';
        infoDiv.style.display = 'flex';
        infoDiv.style.flexDirection = 'column';
        infoDiv.style.alignItems = 'center';
        infoDiv.style.marginTop = '8px';
        infoDiv.style.gap = '2px';
        infoDiv.style.textAlign = 'center';

            // 소속
            const schoolDiv = document.createElement('div');
            schoolDiv.textContent = work.school || '';
            schoolDiv.style.fontSize = '15px';
            schoolDiv.style.fontWeight = '500';
            schoolDiv.style.color = '#444';
            schoolDiv.style.padding = '2px 10px';
            schoolDiv.style.borderRadius = '12px';
            schoolDiv.style.marginBottom = '2px';

            // 이름
            const nameDiv = document.createElement('div');
            nameDiv.textContent = work.name || '';
            nameDiv.style.fontSize = '17px';
            nameDiv.style.fontWeight = '700';
            nameDiv.style.color = '#333';
            nameDiv.style.padding = '2px 10px';
            nameDiv.style.borderRadius = '12px';

            infoDiv.appendChild(schoolDiv);
            infoDiv.appendChild(nameDiv);

            workItem.appendChild(infoDiv);
            worksContainer.appendChild(workItem);
    });
    
    // 반응형 크기 계산
    const isMobile = window.innerWidth <= 768;
    const isVerySmall = window.innerWidth <= 480;
    const fontSize = isMobile ? '20px' : '40px';
    const buttonPosition = isMobile ? '-15px' : '-30px';
    const scaleY = isMobile ? '1.5' : '2.0';
    const hoverScale = isMobile ? '1.2' : '1.3';
    
    // 페이지가 2개 이상일 때만 화살표 표시
    if (totalPages > 1) {
        // 왼쪽 화살표 버튼
        const leftArrow = document.createElement('button');
        leftArrow.innerHTML = '‹';
        const hasLeftPage = currentPage > 1;
        leftArrow.style.cssText = `
            position: absolute;
            left: ${buttonPosition};
            top: 50%;
            transform: translateY(-50%) scaleY(${scaleY});
            background: none;
            color: ${hasLeftPage ? '#424242' : '#d0d0d0'};
            border: none;
            cursor: ${hasLeftPage ? 'pointer' : 'not-allowed'};
            font-size: ${fontSize};
            font-weight: bold;
            padding: 5px;
            transition: all 0.3s ease;
            z-index: 10;
            width: auto;
            height: auto;
            display: ${isVerySmall ? 'none' : 'block'};
        `;
        
        if (hasLeftPage) {
            leftArrow.onmouseover = () => {
                leftArrow.style.color = '#212121';
                leftArrow.style.transform = `translateY(-50%) scaleY(${scaleY}) scale(${hoverScale})`;
                leftArrow.style.textShadow = '0 2px 8px rgba(33, 33, 33, 0.4)';
            };
            leftArrow.onmouseout = () => {
                leftArrow.style.color = '#424242';
                leftArrow.style.transform = `translateY(-50%) scaleY(${scaleY})`;
                leftArrow.style.textShadow = 'none';
            };
            leftArrow.onclick = () => {
                currentPage--;
                renderWorks(category);
            };
        }
        
        mainContainer.appendChild(leftArrow);
        
        // 오른쪽 화살표 버튼
        const rightArrow = document.createElement('button');
        rightArrow.innerHTML = '›';
        const hasRightPage = currentPage < totalPages;
        rightArrow.style.cssText = `
            position: absolute;
            right: ${buttonPosition};
            top: 50%;
            transform: translateY(-50%) scaleY(${scaleY});
            background: none;
            color: ${hasRightPage ? '#424242' : '#d0d0d0'};
            border: none;
            cursor: ${hasRightPage ? 'pointer' : 'not-allowed'};
            font-size: ${fontSize};
            font-weight: bold;
            padding: 5px;
            transition: all 0.3s ease;
            z-index: 10;
            width: auto;
            height: auto;
            display: ${isVerySmall ? 'none' : 'block'};
        `;
        
        if (hasRightPage) {
            rightArrow.onmouseover = () => {
                rightArrow.style.color = '#212121';
                rightArrow.style.transform = `translateY(-50%) scaleY(${scaleY}) scale(${hoverScale})`;
                rightArrow.style.textShadow = '0 2px 8px rgba(33, 33, 33, 0.4)';
            };
            rightArrow.onmouseout = () => {
                rightArrow.style.color = '#424242';
                rightArrow.style.transform = `translateY(-50%) scaleY(${scaleY})`;
                rightArrow.style.textShadow = 'none';
            };
            rightArrow.onclick = () => {
                currentPage++;
                renderWorks(category);
            };
        }
        
        mainContainer.appendChild(rightArrow);
    }
    
    mainContainer.appendChild(worksContainer);
    
    // 하단 페이지 인디케이터 (점으로 표시)
    if (totalPages > 1) {
        const pageIndicator = document.createElement('div');
        pageIndicator.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-top: 20px;
        `;
        
        for (let i = 1; i <= totalPages; i++) {
            const dot = document.createElement('button');
            dot.style.cssText = `
                width: 12px;
                height: 12px;
                border-radius: 50%;
                border: none;
                background: ${i === currentPage ? '#2E7D32' : '#ddd'};
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            
        dot.onmouseover = () => {
                if (i !== currentPage) {
            dot.style.background = '#4CAF50';
                }
            };
            dot.onmouseout = () => {
                if (i !== currentPage) {
            dot.style.background = '#ddd';
                }
            };
            
            dot.onclick = () => {
                currentPage = i;
                renderWorks(category);
            };
            
            pageIndicator.appendChild(dot);
        }
        
        mainContainer.appendChild(pageIndicator);
    }
    
    workList.appendChild(mainContainer);
    
    // 작품이 없을 경우 메시지 표시
    if (filteredWorks.length === 0) {
        workList.innerHTML = '<p style="text-align: center; color: #666; padding: 50px;">해당 카테고리의 작품이 없습니다.</p>';
    }
}

// 작품 상세 모달
// 현재 페이지의 필터된 목록을 저장해 라이트박스에서도 이전/다음 탐색
let lastFilteredWorks = [];

function showWorkModal(work) {
    // 필터된 목록 저장/갱신
    lastFilteredWorks = works.filter(w => w.category === currentCategory);
    const currentIndex = lastFilteredWorks.findIndex(w => w.filename === work.filename);

    // 수상작 여부 및 등급 확인
    let awardType = null;
    let medalFile = null;
    if (awardsData) {
        if (awardsData.grand && awardsData.grand.filename === work.filename) {
            awardType = 'grand'; medalFile = 'winner.png';
        } else if (awardsData.gold && awardsData.gold.some(a => a.filename === work.filename)) {
            awardType = 'gold'; medalFile = 'gold.png';
        } else if (awardsData.silver && awardsData.silver.some(a => a.filename === work.filename)) {
            awardType = 'silver'; medalFile = 'silver.png';
        } else if (awardsData.bronze && awardsData.bronze.some(a => a.filename === work.filename)) {
            awardType = 'bronze'; medalFile = 'bronze.png';
        } else if (awardsData.goodex && awardsData.goodex.some(a => {
            // goodex는 사례/네컷사진 등 폴더/썸네일 구조이므로 filename이 없을 수 있음
            // 사례: 첫번째 이미지가 filename과 일치하면 표시
            if (a.images && a.images.length > 0) {
                return `사례/${a.folderName}/${a.images[0]}` === work.filename || a.images.includes(work.filename.split('/').pop());
            }
            return false;
        })) {
            awardType = 'goodex'; medalFile = 'clover.png';
        }
    }

    // 기존 모달 제거
    const existing = document.getElementById('work-modal');
    if (existing) existing.remove();

    // 요소 생성
    const backdrop = document.createElement('div');
    backdrop.id = 'work-modal';
    backdrop.className = 'lightbox-backdrop';

    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';

    // 미디어 영역
    const media = document.createElement('div');
    media.className = 'lightbox__media';

    const img = document.createElement('img');
    img.className = 'lightbox__image';
    img.alt = `${work.name} 작품`;
    img.src = `assets/images/works/${folderMapping[work.category]}/${work.filename}`;
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

    // 메타 영역
    const meta = document.createElement('div');
    meta.className = 'lightbox__meta';

    const pill = document.createElement('div');
    pill.className = 'lightbox__pill';
    pill.textContent = work.category;
    pill.style.background = worksCategoryColors[work.category] || '#E6F8C2';

    // awards.js와 같은 세로 레이아웃: 카테고리 → 이름 → 소속 + 메달
    const titleRow = document.createElement('div');
    titleRow.className = 'lightbox__title-row';
    if (awardType && medalFile) {
        const medalImg = document.createElement('img');
        medalImg.className = 'lightbox__medal';
        medalImg.src = `assets/images/${medalFile}`;
        medalImg.alt = `${awardType} medal`;
        titleRow.appendChild(medalImg);
    }
    
    // 정보 스택 (카테고리, 이름, 소속)
    const infoStack = document.createElement('div');
    infoStack.className = 'lightbox__info-stack';

    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'lightbox__category';
    categoryDiv.textContent = work.category;
    categoryDiv.style.background = worksCategoryColors[work.category] || '#E6F8C2';

    const title = document.createElement('div');
    title.className = 'lightbox__title';
    title.textContent = work.name;

    const subtitle = document.createElement('div');
    subtitle.className = 'lightbox__subtitle';
    subtitle.innerHTML = `<span class="lightbox__label">소속</span>${work.school}`;

    infoStack.appendChild(categoryDiv);
    infoStack.appendChild(title);
    infoStack.appendChild(subtitle);
    titleRow.appendChild(infoStack);

    meta.appendChild(titleRow);

    // 댓글 섹션 추가 (createCommentSection 함수가 존재하는 경우에만)
    if (typeof createCommentSection === 'function') {
        const commentSection = createCommentSection(`${work.filename}`);
        meta.appendChild(commentSection);
    } else {
        console.warn('Works - createCommentSection 함수를 찾을 수 없습니다 - 직접 HTML 삽입');
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

    // 내비게이션 버튼
    const prevBtn = document.createElement('button');
    prevBtn.className = 'lightbox__nav lightbox__nav--prev';
    prevBtn.innerHTML = '‹';
    const nextBtn = document.createElement('button');
    nextBtn.className = 'lightbox__nav lightbox__nav--next';
    nextBtn.innerHTML = '›';

    function updateNavState(index) {
        prevBtn.disabled = index <= 0;
        nextBtn.disabled = index >= lastFilteredWorks.length - 1;
    }

    function showAt(index) {
        const w = lastFilteredWorks[index];
        if (!w) return;
        img.style.display = '';
        fallback.style.display = 'none';
        img.src = `assets/images/works/${folderMapping[w.category]}/${w.filename}`;
        img.alt = `${w.name} 작품`;
        
        // 새로운 구조에 맞게 업데이트
        categoryDiv.textContent = w.category;
        categoryDiv.style.background = worksCategoryColors[w.category] || '#E6F8C2';
        title.textContent = w.name;
        subtitle.innerHTML = `<span class="lightbox__label">소속</span>${w.school}`;
        currentIdx = index;
        updateNavState(currentIdx);
        
        // 작품이 변경될 때마다 댓글 새로 로드
        if (typeof loadComments === 'function') {
            loadComments(`${w.filename}`);
        }
    }

    let currentIdx = Math.max(0, currentIndex);
    updateNavState(currentIdx);

    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentIdx > 0) showAt(currentIdx - 1);
    });
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentIdx < lastFilteredWorks.length - 1) showAt(currentIdx + 1);
    });

    // 키보드 지원
    function onKey(e) {
        if (e.key === 'Escape') {
            backdrop.remove();
            document.removeEventListener('keydown', onKey);
        } else if (e.key === 'ArrowLeft') {
            if (currentIdx > 0) showAt(currentIdx - 1);
        } else if (e.key === 'ArrowRight') {
            if (currentIdx < lastFilteredWorks.length - 1) showAt(currentIdx + 1);
        }
    }
    document.addEventListener('keydown', onKey);

    // 조립
    lightbox.appendChild(media);
    lightbox.appendChild(meta);
    lightbox.appendChild(closeBtn);
    lightbox.appendChild(prevBtn);
    lightbox.appendChild(nextBtn);
    backdrop.appendChild(lightbox);

    // 배경 클릭 시 닫기
    backdrop.addEventListener('click', () => {
        backdrop.remove();
        document.removeEventListener('keydown', onKey);
    });

    // 컨텐츠 클릭 전파 방지
    lightbox.addEventListener('click', (e) => e.stopPropagation());

    document.body.appendChild(backdrop);
    // 초기 상태 세팅
    showAt(currentIdx);
    
    // 댓글 로드 (loadComments 함수가 존재하는 경우에만)
    if (typeof loadComments === 'function') {
        loadComments(`${work.filename}`);
    } else {
        console.warn('Works - loadComments 함수를 찾을 수 없습니다');
    }
}

// 카테고리 선택 함수
function selectCategory(button, category) {
    // 모든 버튼에서 active 클래스 제거
    document.querySelectorAll('.sector-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // 클릭된 버튼에 active 클래스 추가
    button.classList.add('active');
    
    // 카테고리 매핑 (HTML 버튼 텍스트 → JSON 카테고리명)
    const categoryMapping = {
        '그림일기': '그림일기',
        '동시': '동시',
        '네컷만화': '네컷만화',
        '글·시': '글시',    // HTML의 '글·시' → JSON의 '글시'
        '네컷사진': '네컷사진',
        '사례': '사례'
    };
    
    // 매핑된 카테고리 사용
    const mappedCategory = categoryMapping[category] || category;
    
    // 현재 카테고리 업데이트
    currentCategory = mappedCategory;
    
    // 페이지를 1로 리셋
    currentPage = 1;
    
    // 작품 목록 렌더링
    renderWorks(mappedCategory);
    
    // console.log('선택된 카테고리:', category, '→ 매핑된 카테고리:', mappedCategory);
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    // 작품 데이터 로드
    await loadWorksData();
    
    // 초기 작품 목록 표시
    renderWorks(currentCategory);
    
    // 초기 활성 버튼 설정
    const firstButton = document.querySelector('.sector-item');
    if (firstButton) {
        firstButton.classList.add('active');
    }
});

// 화면 크기 변경 시 다시 렌더링
window.addEventListener('resize', function() {
    renderWorks(currentCategory);
});

// 사례 작품 슬라이드 모달 (폴더 내 모든 이미지를 순차적으로 표시)
function showCaseSlideModal(work) {
    // 현재 작품의 인덱스와 다음/이전 작품 찾기
    const currentWorks = lastFilteredWorks;
    const currentIndex = currentWorks.findIndex(w => w.filename === work.filename && w.category === work.category);
    
    // 폴더명 추출 (예: "더그림/slide_001_optimized.jpg" → "더그림")
    const folderName = work.filename.split('/')[0];
    
    // 각 폴더별 슬라이드 정보
    const slideInfo = {
        '더그림': work.category === '사례' ? {
            count: 6,
            pattern: 'slide_%03d_optimized.jpg', // slide_001_optimized.jpg 형식
            basePath: 'assets/images/works/사례/더그림/'
        } : {
            count: 5,
            pattern: '네컷사진_더그림유치원-%d_optimized.jpg', // 네컷사진_더그림유치원-1_optimized.jpg 형식
            basePath: 'assets/images/works/네컷사진/더그림/'
        },
        '송랑': {
            count: 11,
            pattern: 'slide_%03d_optimized.jpg',
            basePath: 'assets/images/works/사례/송랑/'
        },
        '순천': {
            count: 10,
            pattern: 'slide_%03d_optimized.jpg',
            basePath: 'assets/images/works/사례/순천/'
        },
        '옥산유': {
            count: 9,
            pattern: 'Slide%d.jpg', // Slide1.jpg 형식
            basePath: 'assets/images/works/사례/옥산유/'
        },
        '굿모닝': {
            count: 10,
            pattern: '%02d_굿모닝유치원.jpg', // Slide1.jpg 형식
            basePath: 'assets/images/works/사례/굿모닝/'
        }
    };
    
    const info = slideInfo[folderName];
    if (!info) {
        console.error('알 수 없는 사례 폴더:', folderName);
        return;
    }
    
    let currentSlide = 1;
    
    // 기존 모달 제거
    const existing = document.getElementById('case-slide-modal');
    if (existing) existing.remove();

    // 모달 요소 생성
    const backdrop = document.createElement('div');
    backdrop.id = 'case-slide-modal';
    backdrop.className = 'lightbox-backdrop';

    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';

    // 미디어 영역
    const media = document.createElement('div');
    media.className = 'lightbox__media';

    const img = document.createElement('img');
    img.className = 'lightbox__image';
    img.alt = `${work.name} - 슬라이드 ${currentSlide}`;
    // 사례 이미지에 위아래 여백 추가
    img.style.cssText = `
        margin-top: 50px;
        margin-bottom: 50px;
    `;

    const fallback = document.createElement('div');
    fallback.className = 'lightbox__fallback';
    fallback.textContent = '이미지를 불러올 수 없습니다.';
    fallback.style.display = 'none';

    media.appendChild(img);
    media.appendChild(fallback);

    // 메타 영역
    const meta = document.createElement('div');
    meta.className = 'lightbox__meta';

    // awards.js와 같은 세로 레이아웃 + 메달
    const titleRow = document.createElement('div');
    titleRow.className = 'lightbox__title-row';
    // 수상작 여부 및 등급 확인 (사례/네컷사진)
    let awardType = null;
    let medalFile = null;
    if (awardsData && work.category === '사례') {
        if (awardsData.goodex && awardsData.goodex.some(a => a.folderName === folderName)) {
            awardType = 'goodex'; medalFile = 'clover.png';
        }
    }
    if (awardType && medalFile) {
        const medalImg = document.createElement('img');
        medalImg.className = 'lightbox__medal';
        medalImg.src = `assets/images/${medalFile}`;
        medalImg.alt = `${awardType} medal`;
        titleRow.appendChild(medalImg);
    }
    
    const infoStack = document.createElement('div');
    infoStack.className = 'lightbox__info-stack';

    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'lightbox__category';
    categoryDiv.textContent = '사례';
    categoryDiv.style.background = worksCategoryColors['사례'] || '#E8F5E8';

    const title = document.createElement('div');
    title.className = 'lightbox__title';
    title.textContent = work.name;

    const subtitle = document.createElement('div');
    subtitle.className = 'lightbox__subtitle';
    subtitle.innerHTML = `<span class="lightbox__label">소속</span>${work.school}`;

    // 슬라이드 인디케이터
    const slideIndicator = document.createElement('div');
    slideIndicator.style.cssText = `
        text-align: center;
        padding: 10px;
        font-size: 14px;
        color: #666;
        font-weight: 500;
    `;

    infoStack.appendChild(categoryDiv);
    infoStack.appendChild(title);
    infoStack.appendChild(subtitle);
    infoStack.appendChild(slideIndicator);
    titleRow.appendChild(infoStack);

    meta.appendChild(titleRow);

    // 댓글 섹션 추가
    if (typeof createCommentSection === 'function') {
        const commentSection = createCommentSection(`case_${folderName}`);
        meta.appendChild(commentSection);
        
        // 댓글 로드
        setTimeout(() => {
            if (typeof loadComments === 'function') {
                try {
                    loadComments(`case_${folderName}`);
                } catch (error) {
                    console.error('사례 댓글 로드 중 오류:', error);
                }
            }
        }, 100);
    }

    // 이미지 업데이트 함수
    function updateSlide() {
        let filename;
        let imagePath;
        
        if (folderName === '더그림' && work.category === '네컷사진') {
            filename = `네컷사진_더그림유치원-${currentSlide}_optimized.jpg`;
            imagePath = `assets/images/works/네컷사진/더그림/${filename}`;
        } else if (folderName === '옥산유') {
            filename = `Slide${currentSlide}.jpg`;
            imagePath = `assets/images/works/사례/${folderName}/${filename}`;
        }else if (folderName === '굿모닝') {
            filename = `${String(currentSlide).padStart(2, '0')}_굿모닝유치원.jpg`;
            imagePath = `assets/images/works/사례/굿모닝/${filename}`;
        } else {
            filename = `slide_${String(currentSlide).padStart(3, '0')}_optimized.jpg`;
            imagePath = `assets/images/works/사례/${folderName}/${filename}`;
        }
        
        img.src = imagePath;
        img.alt = `${work.name} - 슬라이드 ${currentSlide}`;
        slideIndicator.textContent = `${currentSlide} / ${info.count}`;
        
        // 네비게이션 버튼 상태 업데이트
        const prevBtn = lightbox.querySelector('.lightbox__nav--prev');
        const nextBtn = lightbox.querySelector('.lightbox__nav--next');
        // 첫 번째 슬라이드이고 이전 작품이 없을 때만 이전 버튼 비활성화
        if (prevBtn) prevBtn.disabled = currentSlide === 1 && currentIndex === 0;
        // 마지막 슬라이드이고 다음 작품이 없을 때만 다음 버튼 비활성화
        if (nextBtn) nextBtn.disabled = currentSlide === info.count && currentIndex === currentWorks.length - 1;
    }

    // 다음/이전 작품으로 이동하는 함수
    function goToNextWork() {
        const nextIndex = currentIndex + 1;
        if (nextIndex < currentWorks.length) {
            const nextWork = currentWorks[nextIndex];
            // 모달 닫기
            backdrop.remove();
            document.removeEventListener('keydown', onKey);
            // 다음 작품이 슬라이드가 있는 작품인지 확인
            if (nextWork.category === '사례' || (nextWork.category === '네컷사진' && nextWork.filename.includes('/'))) {
                showCaseSlideModal(nextWork);
            } else {
                showWorkModal(nextWork);
            }
        }
    }
    
    function goToPrevWork() {
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
            const prevWork = currentWorks[prevIndex];
            // 모달 닫기
            backdrop.remove();
            document.removeEventListener('keydown', onKey);
            // 이전 작품이 슬라이드가 있는 작품인지 확인
            if (prevWork.category === '사례' || (prevWork.category === '네컷사진' && prevWork.filename.includes('/'))) {
                showCaseSlideModal(prevWork);
            } else {
                showWorkModal(prevWork);
            }
        }
    }

    // 네비게이션 버튼들
    const prevBtn = document.createElement('button');
    prevBtn.className = 'lightbox__nav lightbox__nav--prev';
    prevBtn.innerHTML = '‹';
    prevBtn.addEventListener('click', () => {
        if (currentSlide > 1) {
            currentSlide--;
            updateSlide();
        } else {
            // 첫 번째 슬라이드에서 이전 버튼을 누르면 이전 작품으로
            goToPrevWork();
        }
    });

    const nextBtn = document.createElement('button');
    nextBtn.className = 'lightbox__nav lightbox__nav--next';
    nextBtn.innerHTML = '›';
    nextBtn.addEventListener('click', () => {
        if (currentSlide < info.count) {
            currentSlide++;
            updateSlide();
        } else {
            // 마지막 슬라이드에서 다음 버튼을 누르면 다음 작품으로
            goToNextWork();
        }
    });

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

    // 키보드 네비게이션
    function onKey(e) {
        switch (e.code) {
            case 'ArrowLeft':
                if (currentSlide > 1) {
                    currentSlide--;
                    updateSlide();
                } else {
                    // 첫 번째 슬라이드에서 왼쪽 화살표를 누르면 이전 작품으로
                    goToPrevWork();
                }
                break;
            case 'ArrowRight':
                if (currentSlide < info.count) {
                    currentSlide++;
                    updateSlide();
                } else {
                    // 마지막 슬라이드에서 오른쪽 화살표를 누르면 다음 작품으로
                    goToNextWork();
                }
                break;
            case 'Escape':
                backdrop.remove();
                document.removeEventListener('keydown', onKey);
                break;
        }
    }

    document.addEventListener('keydown', onKey);

    // 배경 클릭 시 닫기
    backdrop.addEventListener('click', () => {
        backdrop.remove();
        document.removeEventListener('keydown', onKey);
    });

    // 컨텐츠 클릭 전파 방지
    lightbox.addEventListener('click', (e) => e.stopPropagation());

    // 조립
    lightbox.appendChild(media);
    lightbox.appendChild(meta);
    lightbox.appendChild(closeBtn);
    lightbox.appendChild(prevBtn);
    lightbox.appendChild(nextBtn);
    backdrop.appendChild(lightbox);

    document.body.appendChild(backdrop);

    // 초기 슬라이드 설정
    updateSlide();

    // 댓글 로드
    if (typeof loadComments === 'function') {
        loadComments(`case_${folderName}`);
    }
}

// 전역 함수로 export (HTML에서 직접 호출할 수 있도록)
window.selectCategory = selectCategory;
window.showWorkModal = showWorkModal;
window.showCaseSlideModal = showCaseSlideModal;
// 작품 검색 필터 함수 (검색창에서 호출)
window.filterWorks = function(keyword) {
    keyword = keyword.trim();
    // 현재 카테고리 기준으로만 필터링
    const filteredWorks = works.filter(work => {
        const school = work.school || '';
        const name = work.name || '';
        // 카테고리 일치 + (검색어가 없거나 school/name에 포함)
        const categoryMatch = work.category === currentCategory;
        const keywordMatch = !keyword || school.includes(keyword) || name.includes(keyword);
        return categoryMatch && keywordMatch;
    });
    // 검색어가 없으면 원래대로 페이지네이션 포함 렌더링
    if (!keyword) {
        renderWorks(currentCategory);
    } else {
        renderWorksFiltered(filteredWorks);
    }
};

// 필터링된 배열을 렌더링하는 함수 (페이지네이션 없이 전체 표시)
function renderWorksFiltered(filteredWorks) {
    const workList = document.querySelector('.entry-work-list');
    if (!workList) return;
    workList.innerHTML = '';
    const mainContainer = document.createElement('div');
    mainContainer.style.cssText = `position: relative; width: 100%;`;
    const worksContainer = document.createElement('div');
    worksContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: auto;
        gap: 3px;
        margin: 20px 0;
        cursor: grab;
        user-select: none;
    `;
    filteredWorks.forEach(work => {
        const workItem = document.createElement('div');
        workItem.style.display = 'flex';
        workItem.style.flexDirection = 'column';
        workItem.style.alignItems = 'center';
        workItem.style.justifyContent = 'center';
        workItem.style.padding = '8px';
            let img;
            if (work.category === '사례') {
                const caseContainer = document.createElement('div');
                caseContainer.className = 'case-img-container';
                img = document.createElement('img');
                img.src = `assets/images/works/${folderMapping[work.category]}/${work.filename}`;
                img.alt = `${work.name} 작품`;
                img.className = 'case-img';
                img.style.cursor = 'pointer';
                img.onclick = (e) => {
                    showCaseSlideModal(work);
                };
                img.draggable = false;
                img.onerror = function() {
                    this.style.display = 'none';
                };
                caseContainer.appendChild(img);
                workItem.appendChild(caseContainer);
            } else {
                img = document.createElement('img');
                img.src = `assets/images/works/${folderMapping[work.category]}/${work.filename}`;
                img.alt = `${work.name} 작품`;
                img.className = 'work-img-b';
                img.style.cursor = 'pointer';
                img.onclick = (e) => {
                    if (work.category === '네컷사진' && work.filename.includes('/')) {
                        showCaseSlideModal(work);
                    } else {
                        showWorkModal(work);
                    }
                };
                img.draggable = false;
                img.onerror = function() {
                    this.style.display = 'none';
                };
                workItem.appendChild(img);
            }
            const infoDiv = document.createElement('div');
            infoDiv.className = 'work-info';
            infoDiv.style.display = 'flex';
            infoDiv.style.flexDirection = 'column';
            infoDiv.style.alignItems = 'center';
            infoDiv.style.marginTop = '8px';
            infoDiv.style.gap = '2px';
            const schoolDiv = document.createElement('div');
            schoolDiv.textContent = work.school || '';
            schoolDiv.style.fontSize = '15px';
            schoolDiv.style.fontWeight = '500';
            schoolDiv.style.color = '#444';
            schoolDiv.style.padding = '2px 10px';
            schoolDiv.style.borderRadius = '12px';
            schoolDiv.style.marginBottom = '2px';
            const nameDiv = document.createElement('div');
            nameDiv.textContent = work.name || '';
            nameDiv.style.fontSize = '17px';
            nameDiv.style.fontWeight = '700';
            nameDiv.style.color = '#333';
            nameDiv.style.padding = '2px 10px';
            nameDiv.style.borderRadius = '12px';
            infoDiv.appendChild(schoolDiv);
            infoDiv.appendChild(nameDiv);
            workItem.appendChild(infoDiv);
            worksContainer.appendChild(workItem);
    });
    mainContainer.appendChild(worksContainer);
    workList.appendChild(mainContainer);
    if (filteredWorks.length === 0) {
        workList.innerHTML = '<p style="text-align: center; color: #666; padding: 50px;">검색 결과가 없습니다.</p>';
    }
}

