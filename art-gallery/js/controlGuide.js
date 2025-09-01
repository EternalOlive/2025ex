// controlGuide.js - 조작 가이드 모듈

export function createControlGuide() {
    // 이미 가이드가 있으면 제거
    const existingGuide = document.getElementById('control-guide');
    if (existingGuide) {
        existingGuide.remove();
    }

    // 가이드 HTML 생성
    const guideHTML = `
        <div id="control-guide" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        ">
            <div class="guide-container" style="
                background: white;
                border-radius: 8px;
                padding: 25px;
                max-width: 350px;
                width: 90%;
                text-align: center;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            ">
                <h2 style="
                    font-size: 1.3rem;
                    font-weight: 500;
                    color: #333;
                    margin: 0 0 20px 0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                ">갤러리 둘러보기</h2>
                
                <style>
                    @keyframes keyPress {
                        0%, 90%, 100% { 
                            background: #fff; 
                            color: #666; 
                            border-color: #ccc;
                            transform: scale(1);
                        }
                        5%, 15% { 
                            background: #6366f1; 
                            color: white; 
                            border-color: #4f46e5;
                            transform: scale(0.95);
                        }
                    }
                    
                    @keyframes dragMotion {
                        0%, 100% { transform: translateX(-10px); opacity: 0.5; }
                        50% { transform: translateX(10px); opacity: 1; }
                    }
                    
                    @keyframes doubleClickPulse {
                        0%, 70%, 100% { 
                            transform: scale(1); 
                            opacity: 0.7;
                        }
                        10%, 30% { 
                            transform: scale(1.3); 
                            opacity: 1;
                        }
                        20% { 
                            transform: scale(1.1); 
                            opacity: 0.9;
                        }
                    }
                    
                    @keyframes joystickMove {
                        0%, 100% { transform: translate(0, 0); }
                        25% { transform: translate(4px, 0); }
                        50% { transform: translate(0, 4px); }
                        75% { transform: translate(-4px, 0); }
                    }
                </style>
                <div class="controls-grid" style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    grid-template-rows: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 25px;
                ">
                    <div class="control-item" style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 8px;
                        padding: 12px;
                    ">
                        <div class="control-visual" style="
                            width: 70px;
                            height: 50px;
                            background: #f5f5f5;
                            border-radius: 6px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            position: relative;
                        ">
                            <div class="keyboard" style="
                                display: grid;
                                grid-template-columns: repeat(3, 16px);
                                gap: 2px;
                            ">
                                <div></div>
                                <div class="key-w" style="
                                    width: 16px;
                                    height: 16px;
                                    background: #fff;
                                    border: 1px solid #ccc;
                                    border-radius: 2px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 8px;
                                    font-weight: bold;
                                    color: #666;
                                    animation: keyPress 2s ease-in-out infinite;
                                ">W</div>
                                <div></div>
                                <div class="key-a" style="
                                    width: 16px;
                                    height: 16px;
                                    background: #fff;
                                    border: 1px solid #ccc;
                                    border-radius: 2px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 8px;
                                    font-weight: bold;
                                    color: #666;
                                    animation: keyPress 2s ease-in-out infinite 0.5s;
                                ">A</div>
                                <div class="key-s" style="
                                    width: 16px;
                                    height: 16px;
                                    background: #fff;
                                    border: 1px solid #ccc;
                                    border-radius: 2px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 8px;
                                    font-weight: bold;
                                    color: #666;
                                    animation: keyPress 2s ease-in-out infinite 1.5s;
                                ">S</div>
                                <div class="key-d" style="
                                    width: 16px;
                                    height: 16px;
                                    background: #fff;
                                    border: 1px solid #ccc;
                                    border-radius: 2px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 8px;
                                    font-weight: bold;
                                    color: #666;
                                    animation: keyPress 2s ease-in-out infinite 1s;
                                ">D</div>
                                <div></div>
                                <div></div>
                                <div></div>
                            </div>
                        </div>
                        <div>
                            <div style="
                                font-size: 0.8rem;
                                font-weight: 500;
                                color: #333;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            ">이동하기</div>
                            <div style="
                                font-size: 0.65rem;
                                color: #666;
                                text-align: center;
                                line-height: 1.3;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            ">방향키 또는 WASD로 이동</div>
                        </div>
                    </div>

                    <div class="control-item" style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 8px;
                        padding: 12px;
                    ">
                        <div class="control-visual" style="
                            width: 70px;
                            height: 50px;
                            background: #f5f5f5;
                            border-radius: 6px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            position: relative;
                        ">
                            <div style="
                                width: 28px;
                                height: 40px;
                                background: #fff;
                                border: 1px solid #ccc;
                                border-radius: 14px 14px 8px 8px;
                                position: relative;
                            ">
                                <div style="
                                    position: absolute;
                                    top: 4px;
                                    left: 50%;
                                    transform: translateX(-50%);
                                    width: 2px;
                                    height: 8px;
                                    background: #666;
                                    border-radius: 1px;
                                "></div>
                            </div>
                            <div style="
                                position: absolute;
                                top: 35px;
                                left: 15px;
                                width: 40px;
                                height: 3px;
                                background: linear-gradient(90deg, transparent, #6366f1, transparent);
                                border-radius: 2px;
                                animation: dragMotion 2s ease-in-out infinite;
                            ">
                                <div style="
                                    position: absolute;
                                    right: -8px;
                                    top: -8px;
                                    color: #6366f1;
                                    font-size: 12px;
                                ">↔</div>
                            </div>
                        </div>
                        <div>
                            <div style="
                                font-size: 0.8rem;
                                font-weight: 500;
                                color: #333;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            ">둘러보기</div>
                            <div style="
                                font-size: 0.65rem;
                                color: #666;
                                text-align: center;
                                line-height: 1.3;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            ">마우스를 드래그하여 시점 변경</div>
                        </div>
                    </div>

                    <div class="control-item" style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 8px;
                        padding: 12px;
                    ">
                        <div class="control-visual" style="
                            width: 70px;
                            height: 60px;
                            background: #f5f5f5;
                            border-radius: 6px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            position: relative;
                        ">
                            <div style="
                                width: 35px;
                                height: 35px;
                                background: #fff;
                                border: 1px solid #ccc;
                                border-radius: 4px;
                                position: relative;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 14px;
                            ">🖼️
                                <div style="
                                    position: absolute;
                                    top: -8px;
                                    right: -8px;
                                    width: 20px;
                                    height: 20px;
                                    background: #6366f1;
                                    border-radius: 50%;
                                    animation: doubleClickPulse 2s ease-in-out infinite;
                                "></div>
                            </div>
                        </div>
                        <div>
                            <div style="
                                font-size: 0.8rem;
                                font-weight: 500;
                                color: #333;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            ">작품 감상</div>
                            <div style="
                                font-size: 0.65rem;
                                color: #666;
                                text-align: center;
                                line-height: 1.3;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            ">작품을 더블클릭하여 상세보기</div>
                        </div>
                    </div>

                    <div class="control-item" style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 8px;
                        padding: 12px;
                    ">
                        <div class="control-visual" style="
                            width: 70px;
                            height: 50px;
                            background: #f5f5f5;
                            border-radius: 6px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            position: relative;
                        ">
                            <div style="position: relative; width: 40px; height: 40px;">
                                <div style="
                                    width: 32px;
                                    height: 32px;
                                    background: #fff;
                                    border: 1px solid #ccc;
                                    border-radius: 50%;
                                    position: absolute;
                                    top: 4px;
                                    left: 4px;
                                "></div>
                                <div style="
                                    width: 12px;
                                    height: 12px;
                                    background: #6366f1;
                                    border-radius: 50%;
                                    position: absolute;
                                    top: 14px;
                                    left: 14px;
                                    animation: joystickMove 3s ease-in-out infinite;
                                "></div>
                                <div style="
                                    position: absolute;
                                    bottom: -3px;
                                    right: -3px;
                                    background: #10b981;
                                    color: white;
                                    border-radius: 4px;
                                    padding: 2px 4px;
                                    font-size: 8px;
                                    font-weight: bold;
                                ">📱</div>
                            </div>
                        </div>
                        <div>
                            <div style="
                                font-size: 0.8rem;
                                font-weight: 500;
                                color: #333;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            ">모바일 이동</div>
                            <div style="
                                font-size: 0.65rem;
                                color: #666;
                                text-align: center;
                                line-height: 1.3;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            ">화면 좌하단 조이스틱으로 이동</div>
                        </div>
                    </div>
                </div>

                <button id="start-gallery-button" style="
                    background: #6366f1;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    margin-top: 5px;
                ">시작하기</button>
            </div>
        </div>
    `;

    // HTML을 body에 추가
    document.body.insertAdjacentHTML('beforeend', guideHTML);
    
    const guide = document.getElementById('control-guide');
    const startButton = document.getElementById('start-gallery-button');

    // 버튼 호버 효과
    startButton.addEventListener('mouseenter', () => {
        startButton.style.background = '#5856eb';
    });

    startButton.addEventListener('mouseleave', () => {
        startButton.style.background = '#6366f1';
    });

    // 시작 버튼 클릭 이벤트
    startButton.addEventListener('click', hideControlGuide);

    // 모바일 감지하여 조이스틱 표시
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        const joystick = document.getElementById('joystick-container');
        if (joystick) {
            joystick.style.display = 'block';
        }
    }

    return guide;
}

export function showControlGuide() {
    const guide = createControlGuide();
    
    // 애니메이션 없이 바로 표시
    guide.style.opacity = '1';
}

export function hideControlGuide() {
    const guide = document.getElementById('control-guide');
    if (guide) {
        guide.style.opacity = '0';
        setTimeout(() => {
            guide.remove();
            // 가이드 사라진 후 간단한 힌트 (선택사항)
            showBriefHint();
        }, 300);
    }
}

function showBriefHint() {
    const hint = document.createElement('div');
    hint.innerHTML = '💡 작품을 더블클릭해보세요!';
    hint.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 0.9rem;
        pointer-events: none;
    `;
    
    document.body.appendChild(hint);
    
    setTimeout(() => hint.style.opacity = '1', 100);
    setTimeout(() => {
        hint.style.opacity = '0';
        setTimeout(() => {
            if (hint.parentNode) {
                hint.parentNode.removeChild(hint);
            }
        }, 300);
    }, 3000);
}