// 작품 상세 모달 함수 (슬라이드 기능 개선)
export async function showWorkModal(filename, works, awardsData, options = {}) {
    // 댓글 모듈 import
    let createCommentSection, loadComments, submitComment;
    try {
        const commentsMod = await import('./comments.js');
        createCommentSection = commentsMod.createCommentSection;
        loadComments = commentsMod.loadComments;
        submitComment = commentsMod.submitComment;
    } catch (e) {
        console.error('comments.js import 실패:', e);
    }

    // 댓글 섹션 폴백 함수 (import 실패 시 사용)
    function createCommentSectionFallback(itemId) {
        const safeId = itemId.replace(/[^a-zA-Z0-9_-]/g, '_');
        const container = document.createElement('div');
        container.className = 'comment-section';
        container.innerHTML = `
            <h3 style="text-align: left;">댓글 <span class="comment-count" id="comment-count-${safeId}">(0)</span></h3>
            <div class="comments-list" id="comments-list-${safeId}">
                <div class="no-comments">작성된 댓글이 없습니다.</div>
            </div>
            <div class="comment-form">
                <input 
                    type="text"
                    id="comment-author-${safeId}"
                    placeholder="작성자 이름"
                    maxlength="8"
                    style="margin-bottom:12px;width:100%;box-sizing:border-box;border-radius:8px;padding:12px 16px;border:1.5px solid #d1d5db;font-size:16px;background:#f8f9fa;transition:border-color 0.2s;"
                />
                <textarea 
                    id="comment-content-${safeId}" 
                    placeholder="댓글을 작성해주세요 (최대 300자)" 
                    maxlength="300"
                    rows="3"
                    style="width:100%;box-sizing:border-box;border-radius:8px;padding:12px 16px;border:1.5px solid #d1d5db;font-size:14px;background:#f8f9fa;resize:vertical;min-height:80px;"
                ></textarea>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
                    <span id="char-count-${safeId}" style="font-size:12px;color:#666;">0/300</span>
                    <button id="comment-submit-${safeId}" disabled style="background:#6366f1;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:14px;opacity:0.5;">댓글 작성</button>
                </div>
            </div>
        `;
        
        // 이벤트 리스너 추가
        const textarea = container.querySelector(`#comment-content-${safeId}`);
        const charCount = container.querySelector(`#char-count-${safeId}`);
        const submitBtn = container.querySelector(`#comment-submit-${safeId}`);
        const authorInput = container.querySelector(`#comment-author-${safeId}`);
        
        if (textarea && charCount && submitBtn && authorInput) {
            textarea.addEventListener('input', function() {
                const length = this.value.length;
                charCount.textContent = `${length}/300`;
                const authorLength = authorInput.value.trim().length;
                submitBtn.disabled = length === 0 || length > 300 || authorLength === 0;
                submitBtn.style.opacity = submitBtn.disabled ? '0.5' : '1';
            });
            
            authorInput.addEventListener('input', function() {
                const authorLength = this.value.trim().length;
                const contentLength = textarea.value.length;
                submitBtn.disabled = contentLength === 0 || contentLength > 300 || authorLength === 0;
                submitBtn.style.opacity = submitBtn.disabled ? '0.5' : '1';
            });
            
            submitBtn.addEventListener('click', async function() {
                if (!submitBtn.disabled && submitComment) {
                    await submitComment(itemId);
                }
            });
            
            submitBtn.addEventListener('touchstart', async function(e) {
                e.preventDefault();
                if (!submitBtn.disabled && submitComment) {
                    await submitComment(itemId);
                }
            }, { passive: false });
        }
        
        return container;
    }

    const folderMapping = {
        '그림일기': '그림일기',
        '동시': '동시',
        '네컷만화': '네컷만화',
        '글·시': '글시',
        '네컷사진': '네컷사진',
        '사례': '사례',
        '글시': '글시'
    };

    const worksCategoryColors = {
        '그림일기': '#E6F8C2',
        '동시': '#FFF4C4',
        '네컷만화': '#D2E8FF',
        '글·시': '#F0E6FF',
        '네컷사진': '#FFDEE1',
        '사례': '#E8F5E8',
        '글시': '#F0E6FF'
    };

    // 작품 찾기 로직 개선
    let work = works.find(w => w.filename === filename || w.filename.endsWith('/' + filename));
    if (!work) {
        const specialCaseMatch = filename.match(/^\[(사례)\] (.+)$/);
        if (specialCaseMatch) {
            const folder = specialCaseMatch[2].trim();
            work = works.find(w => {
                if (w.category === '사례' && w.filename.startsWith(folder + '/')) return true;
                return false;
            });
        }
    }

    if (!work) {
        alert('작품 정보를 찾을 수 없습니다.');
        return;
    }

    // 슬라이드 케이스 판단 및 데이터 준비
    const folderSlideCases = ['더그림', '송랑', '옥산유', '순천', '굿모닝'];
    let folderName = null;
    let isSlideCase = false;
    let slideList = [];
    let currentSlideIdx = 0;

    // 폴더 기반 슬라이드인지 확인
    if (work.category === '사례' || work.category === '네컷사진') {
        const folderMatch = work.filename.match(/^([^/]+)\//);
        if (folderMatch && folderSlideCases.includes(folderMatch[1])) {
            folderName = folderMatch[1];
            // 네컷사진 더그림은 슬라이드 케이스가 아님
            if (work.category === '네컷사진' && folderName === '더그림') {
                isSlideCase = false;
                slideList = [];
            } else {
                isSlideCase = true;
                // awards.json에서 해당 폴더의 이미지 리스트 가져오기
                if (awardsData && awardsData.goodex) {
                    const awardItem = awardsData.goodex.find(item => item.folderName === folderName);
                    if (awardItem && awardItem.images) {
                        // awards.json의 images 배열 사용
                        slideList = awardItem.images.map(imgName => ({
                            filename: `${folderName}/${imgName}`,
                            name: awardItem.name,
                            school: awardItem.school,
                            category: work.category
                        }));
                        // 현재 이미지의 인덱스 찾기
                        currentSlideIdx = slideList.findIndex(item => item.filename === work.filename);
                        if (currentSlideIdx < 0) currentSlideIdx = 0;
                    }
                }
                // awards.json에서 데이터를 못 찾으면 works.json에서 폴백
                if (slideList.length === 0) {
                    slideList = works.filter(w => 
                        w.category === work.category && 
                        w.filename.startsWith(folderName + '/')
                    );
                    currentSlideIdx = slideList.findIndex(w => w.filename === work.filename);
                    if (currentSlideIdx < 0) currentSlideIdx = 0;
                }
            }
        }
    }

    // 수상 정보 확인
    let awardType = null;
    let medalFile = null;
    if (awardsData) {
        if (awardsData.grand && (awardsData.grand.filename === work.filename || awardsData.grand.filename === `${folderMapping[work.category]}/${work.filename}`)) {
            awardType = 'grand'; medalFile = 'winner.png';
        } else if (awardsData.gold && awardsData.gold.some(a => a.filename === work.filename || a.filename === `${folderMapping[work.category]}/${work.filename}`)) {
            awardType = 'gold'; medalFile = 'gold.png';
        } else if (awardsData.silver && awardsData.silver.some(a => a.filename === work.filename || a.filename === `${folderMapping[work.category]}/${work.filename}`)) {
            awardType = 'silver'; medalFile = 'silver.png';
        } else if (awardsData.bronze && awardsData.bronze.some(a => a.filename === work.filename || a.filename === `${folderMapping[work.category]}/${work.filename}`)) {
            awardType = 'bronze'; medalFile = 'bronze.png';
        } else if (awardsData.goodex && awardsData.goodex.some(a => {
            if (a.images && a.images.length > 0) {
                return a.images.includes(work.filename.split('/').pop()) || work.filename === `사례/${a.folderName}/${a.images[0]}`;
            }
            return false;
        })) {
            awardType = 'goodex'; medalFile = 'clover.png';
        }
    }

    // 기존 모달 제거
    const existing = document.getElementById('work-modal');
    if (existing) existing.remove();

    // 모달 생성
    const backdrop = document.createElement('div');
    backdrop.id = 'work-modal';
    backdrop.className = 'lightbox-backdrop';
    backdrop.style.position = 'fixed';
    backdrop.style.zIndex = '2147483647';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100vw';
    backdrop.style.height = '100vh';
    backdrop.style.background = 'rgba(0,0,0,0.45)';
    backdrop.style.display = 'flex';
    backdrop.style.alignItems = 'center';
    backdrop.style.justifyContent = 'center';
    backdrop.style.pointerEvents = 'auto';

    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.style.cssText = `
        position: relative;
        z-index: 1;
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 32px rgba(0,0,0,0.18);
        min-width: 320px;
        max-width: 90vw;
        max-height: 90vh;
        overflow-y: auto;
        text-align: center;
    `;

    // 미디어 영역
    const media = document.createElement('div');
    media.className = 'lightbox__media';
    media.style.cssText = `
        padding: 32px 24px 16px 24px;
        text-align: center;
    `;

    // 이미지 요소
    const img = document.createElement('img');
    img.className = 'lightbox__image';
    img.alt = `${work.name} 작품`;

    // 폴백 요소
    const fallback = document.createElement('div');
    fallback.className = 'lightbox__fallback';
    fallback.textContent = '이미지를 불러올 수 없습니다.';
    fallback.style.display = 'none';

    // 메타 정보 영역 - 이제 이미지와 함께 스크롤
    const meta = document.createElement('div');
    meta.className = 'lightbox__meta';
    meta.style.padding = '0 24px 24px 24px';

    const titleRow = document.createElement('div');
    titleRow.className = 'lightbox__title-row';

    // 메달 이미지 (수상작인 경우)
    if (awardType && medalFile) {
        const medalImg = document.createElement('img');
        medalImg.className = 'lightbox__medal';
        medalImg.src = options.medalBasePath ? `${options.medalBasePath}/${medalFile}` : `../assets/images/${medalFile}`;
        medalImg.alt = `${awardType} medal`;
        medalImg.onerror = () => { medalImg.style.display = 'none'; };
        titleRow.appendChild(medalImg);
    }

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

    // 슬라이드 기능 구현
    if (isSlideCase && slideList.length > 1) {
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
            indicator.textContent = `${currentSlideIdx + 1} / ${slideList.length}`;
        }

        // 슬라이드 내비게이션 버튼
        const prevBtn = document.createElement('button');
        prevBtn.className = 'lightbox__nav lightbox__nav--prev';
        prevBtn.innerHTML = '◀';
        
        // 모바일 터치 최적화 스타일
        prevBtn.style.cssText = `
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0,0,0,0.7);
            color: #fff;
            border: none;
            border-radius: 50%;
            width: 48px;
            height: 48px;
            cursor: pointer;
            z-index: 10;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            user-select: none;
        `;

        const nextBtn = document.createElement('button');
        nextBtn.className = 'lightbox__nav lightbox__nav--next';
        nextBtn.innerHTML = '▶';
        
        // 모바일 터치 최적화 스타일
        nextBtn.style.cssText = `
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0,0,0,0.7);
            color: #fff;
            border: none;
            border-radius: 50%;
            width: 48px;
            height: 48px;
            cursor: pointer;
            z-index: 10;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            user-select: none;
        `;

        // 슬라이드 업데이트 함수
        function updateSlide(idx) {
            if (idx < 0 || idx >= slideList.length) return;
            
            currentSlideIdx = idx;
            const currentSlide = slideList[currentSlideIdx];
            
            // 이미지 경로 업데이트
            const imagePath = options.imageBasePath ? 
                `${options.imageBasePath}/${folderMapping[currentSlide.category]}/${currentSlide.filename}` : 
                `../assets/images/works/${folderMapping[currentSlide.category]}/${currentSlide.filename}`;
            
            img.src = imagePath;
            img.alt = `${currentSlide.name} 작품`;
            
            // 메타 정보 업데이트
            title.textContent = currentSlide.name;
            subtitle.innerHTML = `<span class="lightbox__label">소속</span>${currentSlide.school}`;
            
            // 카테고리 업데이트 (슬라이드마다 다를 수 있음)
            categoryDiv.textContent = currentSlide.category;
            categoryDiv.style.background = worksCategoryColors[currentSlide.category] || '#E6F8C2';
            
            // 인디케이터 업데이트
            updateIndicator();
            
            // 슬라이드가 바뀌어도 댓글은 같은 사례에 대한 것이므로 새로 로드하지 않음
            // 사례의 경우 case_더그림, case_굿모닝 등으로 통일된 ID를 사용
        }

        // 버튼 이벤트 리스너
        function goToPrevSlide() {
            const newIdx = (currentSlideIdx - 1 + slideList.length) % slideList.length;
            updateSlide(newIdx);
        }
        
        function goToNextSlide() {
            const newIdx = (currentSlideIdx + 1) % slideList.length;
            updateSlide(newIdx);
        }
        
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            goToPrevSlide();
        });
        
        // 모바일 터치 이벤트 (더 민감하게)
        prevBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            goToPrevSlide();
        }, { passive: false });
        
        prevBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            goToNextSlide();
        });
        
        // 모바일 터치 이벤트 (더 민감하게)
        nextBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            goToNextSlide();
        }, { passive: false });
        
        nextBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });

        // 미디어 영역 스타일 설정
        media.style.position = 'relative';
        media.style.display = 'flex';
        media.style.alignItems = 'center';
        media.style.justifyContent = 'center';

        // 요소들 추가
        media.appendChild(img);
        media.appendChild(fallback);
        media.appendChild(prevBtn);
        media.appendChild(nextBtn);
        media.appendChild(indicator);

        // 초기 인디케이터 설정
        updateIndicator();
    } else {
        // 일반 단일 이미지
        media.appendChild(img);
        media.appendChild(fallback);
    }

    // 초기 이미지 설정
    const currentWork = isSlideCase && slideList.length > 0 ? slideList[currentSlideIdx] : work;
    const imagePath = options.imageBasePath ? 
        `${options.imageBasePath}/${folderMapping[currentWork.category]}/${currentWork.filename}` : 
        `../assets/images/works/${folderMapping[currentWork.category]}/${currentWork.filename}`;
    
    img.src = imagePath;
    img.onerror = () => {
        img.style.display = 'none';
        fallback.style.display = 'block';
    };

    // 댓글 섹션 추가 - 사례는 case_ 접두사로 통일된 ID 사용
    let commentItemId = currentWork.filename;
    if (isSlideCase && folderName) {
        commentItemId = `case_${folderName}`;
    }
    
    let commentSection;
    if (typeof window.createCommentSection === 'function') {
        // console.log('window.createCommentSection 사용');
        commentSection = window.createCommentSection(commentItemId);
    } else if (typeof createCommentSection === 'function') {
        // console.log('imported createCommentSection 사용');
        commentSection = createCommentSection(commentItemId);
    } else {
        // console.log('폴백 createCommentSection 사용');
        // 댓글 섹션을 직접 생성 (index.html의 코드 기반)
        commentSection = createCommentSectionFallback(commentItemId);
    }
    meta.appendChild(commentSection);

    // 댓글 로드 (DOM 요소가 추가된 후 실행)
    setTimeout(() => {
        // 여러 방법으로 loadComments 함수 찾기
        let loadCommentsFunc = null;
        
        if (window.loadComments && typeof window.loadComments === 'function') {
            loadCommentsFunc = window.loadComments;
            // console.log('window.loadComments 사용');
        } else if (loadComments && typeof loadComments === 'function') {
            loadCommentsFunc = loadComments;
            // console.log('imported loadComments 사용');
        }
        
        if (loadCommentsFunc) {
            // console.log('댓글 로드 시작:', commentItemId);
            try {
                loadCommentsFunc(commentItemId);
            } catch (error) {
                console.error('댓글 로드 중 오류:', error);
            }
        } else {
            console.warn('loadComments 함수를 찾을 수 없습니다. 사용 가능한 함수들:', {
                'window.loadComments': typeof window.loadComments,
                'loadComments': typeof loadComments,
                'window.createCommentSection': typeof window.createCommentSection,
                'window.submitComment': typeof window.submitComment
            });
        }
    }, 200);

    // 닫기 버튼
    const closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox__close';
    closeBtn.setAttribute('aria-label', '닫기');
    closeBtn.innerHTML = '✕';
    
    // 모바일 터치 최적화 스타일 - fixed 위치로 스크롤과 무관하게 고정
    closeBtn.style.cssText = `
        position: fixed;
        top: 12px;
        right: 12px;
        width: 44px;
        height: 44px;
        background: rgba(0,0,0,0.8);
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 18px;
        cursor: pointer;
        z-index: 1001;
        display: flex;
        align-items: center;
        justify-content: center;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    
    function closeModal() {
        backdrop.remove();
        document.removeEventListener('keydown', onKey);
    }
    
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
    });
    
    // 모바일 터치 이벤트 (더 민감하게)
    closeBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
    }, { passive: false });
    
    closeBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, { passive: false });

    // 키보드 지원
    function onKey(e) {
        if (e.key === 'Escape') {
            backdrop.remove();
            document.removeEventListener('keydown', onKey);
        } else if (isSlideCase && slideList.length > 1) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const newIdx = (currentSlideIdx - 1 + slideList.length) % slideList.length;
                updateSlide(newIdx);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                const newIdx = (currentSlideIdx + 1) % slideList.length;
                updateSlide(newIdx);
            }
        }
    }
    document.addEventListener('keydown', onKey);

    // 조립 - 닫기 버튼은 backdrop에 직접 추가하여 스크롤과 무관하게 고정
    lightbox.appendChild(media);
    lightbox.appendChild(meta);
    backdrop.appendChild(lightbox);
    backdrop.appendChild(closeBtn);

    // 배경 클릭 시 닫기
    let touchStartTime = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
            closeModal();
        }
    });
    
    // 모바일 터치 이벤트 개선
    backdrop.addEventListener('touchstart', (e) => {
        if (e.target === backdrop) {
            touchStartTime = Date.now();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    }, { passive: false });
    
    backdrop.addEventListener('touchend', (e) => {
        if (e.target === backdrop) {
            const touchEndTime = Date.now();
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const timeDiff = touchEndTime - touchStartTime;
            const xDiff = Math.abs(touchEndX - touchStartX);
            const yDiff = Math.abs(touchEndY - touchStartY);
            
            // 짧은 탭이고 움직임이 적으면 닫기
            if (timeDiff < 300 && xDiff < 20 && yDiff < 20) {
                e.preventDefault();
                closeModal();
            }
        }
    }, { passive: false });

    // 컨텐츠 클릭 전파 방지
    lightbox.addEventListener('click', (e) => e.stopPropagation());

    document.body.appendChild(backdrop);
}

