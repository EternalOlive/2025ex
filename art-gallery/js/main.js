import { setupScene, setupCamera, setupRenderer, setupLighting } from './setup.js';
import { checkCollision, checkDistance, addEventListeners } from './utilities.js';
import { setupJoystick, addJoystickListeners, updateJoystickMovement } from './joystick.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { showControlGuide } from './controlGuide.js';

// 제발되라
// 로딩 상태 관리
let isModelLoaded = false;
let isDataLoaded = false;

let works = [];
let awardsData = null;

// 로딩 완료 체크 함수
// 기존 checkAllLoaded 함수 수정
function checkAllLoaded() {
    if (isModelLoaded && isDataLoaded && window.hideLoadingScreen) {
        setTimeout(() => {
            window.hideLoadingScreen();
            // 로딩 완료 후 조작 가이드 표시
            showControlGuide();
            // 도움말 버튼 생성
            createHelpButton();
        }, 300);
    }
}

async function loadWorksData() {
    try {
        const response = await fetch('../assets/js/works.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        works = await response.json();
        const awardsRes = await fetch('../assets/js/awards.json');
        if (awardsRes.ok) awardsData = await awardsRes.json();
        else awardsData = null;
        
        isDataLoaded = true;
        checkAllLoaded();
        return works;
    } catch (error) {
        console.error('작품 데이터 로드 실패:', error);
        works = [];
        awardsData = null;
        isDataLoaded = true;
        checkAllLoaded();
        return works;
    }
}
loadWorksData();

// showWorkModal 모듈 import 및 오류 로그
let showWorkModal;
(async () => {
    try {
        const mod = await import('./showWorkModal.js');
        showWorkModal = mod.showWorkModal;
        // console.log('showWorkModal 모듈 import 성공');
    } catch (e) {
        console.error('showWorkModal 모듈 import 실패:', e);
    }
})();

// Set up scene, camera, and renderer
const scene = setupScene();
const camera = setupCamera();
const renderer = setupRenderer();
window.camera = camera;
window.scene = scene;

// 모바일 조이스틱 UI 초기화 (실제 모바일 디바이스에서만)
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
if (isMobile) {
    setupJoystick();
    addJoystickListeners(camera);
    // 조이스틱 컨테이너에 모바일 클래스 추가
    const joystickContainer = document.getElementById('joystick-container');
    if (joystickContainer) {
        joystickContainer.classList.add('mobile-only');
    }
}

// Set up lighting
const { ambientLight, sunLight, wallLight } = setupLighting(camera);
scene.add(ambientLight);
scene.add(sunLight);
scene.add(wallLight);

let jsonData = {};
// 텍스처-작품 매핑 데이터 로드
let textureWorkMap = [];
fetch('./js/textureWorkMap.json')
    .then(response => response.json())
    .then(data => { textureWorkMap = data; })
    .catch(error => console.error('Error loading textureWorkMap:', error));

// JSON 파일 로드 함수
function loadJSONData(url, callback) {
    fetch(url)
      .then(response => response.json())
      .then(data => callback(data))
      .catch(error => console.error('Error loading JSON:', error));
}

// 로딩 상태 관리
const loadingManager = {
    gltfProgress: 0,
    texturesLoaded: 0,
    totalTextures: 0,
    isGltfComplete: false,
    
    // 전체 진행률 계산 (GLTF 30%, 텍스처 70% 비중)
    getTotalProgress() {
        const gltfWeight = 0.3;
        const textureWeight = 0.7;
        
        const gltfPart = this.gltfProgress * gltfWeight;
        const texturePart = this.totalTextures > 0 ? 
            (this.texturesLoaded / this.totalTextures) * textureWeight : 0;
            
        return Math.min(gltfPart + texturePart, 1.0);
    },
    
    updateProgress() {
        const totalProgress = this.getTotalProgress();
        if (window.updateLoadingProgress) {
            window.updateLoadingProgress(totalProgress);
        }
        
        // console.log(`로딩 진행률: GLTF ${Math.round(this.gltfProgress * 100)}%, 텍스처 ${this.texturesLoaded}/${this.totalTextures}, 전체 ${Math.round(totalProgress * 100)}%`);
    }
};

// THREE.js LoadingManager 생성
const threeLoadingManager = new THREE.LoadingManager();

// 텍스처 품질 향상을 위한 설정
threeLoadingManager.onLoad = () => {
    console.log('모든 리소스 로딩 완료');
    
    // 로딩 완료 후 모든 텍스처의 필터링 개선
    scene.traverse((child) => {
        if (child.isMesh && child.material) {
            if (child.material.map) {
                child.material.map.generateMipmaps = true;
                child.material.map.minFilter = THREE.LinearMipmapLinearFilter;
                child.material.map.magFilter = THREE.LinearFilter;
                child.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
            }
        }
    });
    
    isModelLoaded = true;
    loadingManager.updateProgress();
    checkAllLoaded();
};

threeLoadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    loadingManager.totalTextures = itemsTotal;
    loadingManager.texturesLoaded = itemsLoaded;
    loadingManager.updateProgress();
};

// GLTF 로더에 LoadingManager 적용
let loader = new GLTFLoader(threeLoadingManager);
let collidableObjects = [];
window.checkCollision = checkCollision;

// 모델 로딩 진행률 추적
loader.load(
    "models/gallery.gltf", 
    
    // onLoad 콜백
    function (gltf) {
        let model = gltf.scene;
        scene.add(model);

        model.traverse(function (child) {
            if (child.isMesh) {
                collidableObjects.push(child);
            }
        });

        loadingManager.isGltfComplete = true;
        console.log('GLTF 모델 로딩 완료');
        
        // 텍스처가 모두 로드될 때까지 기다림
        // THREE.LoadingManager의 onLoad에서 최종 완료 처리
    }, 
    
    // onProgress 콜백 - GLTF 파일만 추적
    function (progress) {
        if (progress.lengthComputable && progress.total > 0) {
            const percentComplete = Math.min(progress.loaded / progress.total, 1.0);
            loadingManager.gltfProgress = percentComplete;
            loadingManager.updateProgress();
        } else {
            console.log('GLTF 로딩 중...');
        }
    }, 
    
    // onError 콜백
    function (error) {
        console.error('모델 로딩 실패:', error);
        isModelLoaded = true;
        checkAllLoaded();
    }
);
// 애니메이션 루프에서 조이스틱 이동 적용
function animate() {
    requestAnimationFrame(animate);
    // 모달이 열려 있으면 카메라 이동/회전 차단
    if (!document.getElementById('work-modal')) {
        // 모바일에서만 조이스틱 업데이트
        if (isMobile) {
            updateJoystickMovement(camera, collidableObjects);
        }
    }
    renderer.render(scene, camera);
}

// 애니메이션 시작 (즉시 시작)
animate();

// 좌상단에 각 방으로 이동하는 버튼 그룹 추가
const rooms = [
    { name: '그림일기', x: -84.612, z: -6 },
    { name: '동시', x: 13 },
    { name: '네컷사진', x: 39 },
    { name: '글·시', x: 0 },
    { name: '네컷만화', x: 74.4 },
    { name: '사례', x: 91 }
];

// 네비게이션 컨테이너 생성
const navContainer = document.createElement('div');
navContainer.style.cssText = `
    position: fixed;
    top: 20px;
    left: 0;
    right: 0;
    z-index: 2000;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
`;

// 버튼 래퍼 생성
const btnWrapper = document.createElement('div');
btnWrapper.style.cssText = `
    background: white;
    border-radius: 8px;
    padding: 4px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    gap: 2px;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    max-width: calc(100vw - 40px);
    pointer-events: auto;
`;

// 스크롤바 숨기기
btnWrapper.style.setProperty('::-webkit-scrollbar', 'display: none');

let activeButton = null;

rooms.forEach((room, index) => {
    const btn = document.createElement('button');
    btn.textContent = room.name;
    btn.style.cssText = `
        background: transparent;
        border: none;
        padding: 12px 20px;
        color: #647937;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border-radius: 6px;
        white-space: nowrap;
        transition: all 0.2s ease;
        min-width: 80px;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // 첫 번째 버튼을 활성화
    if (index === 0) {
        btn.style.background = '#B2C784';
        btn.style.color = 'white';
        btn.style.fontWeight = '600';
        activeButton = btn;
    }

    // 호버 효과
    btn.addEventListener('mouseenter', () => {
        if (btn !== activeButton) {
            btn.style.background = '#f8f8f8';
        }
    });

    btn.addEventListener('mouseleave', () => {
        if (btn !== activeButton) {
            btn.style.background = 'transparent';
        }
    });

    // 클릭 이벤트
    btn.addEventListener('click', () => {
        // 모델이 로드되지 않았으면 이동 불가
        if (!isModelLoaded) {
            console.log('모델 로딩 중... 잠시 기다려주세요.');
            return;
        }

        // 이전 활성 버튼 스타일 초기화
        if (activeButton) {
            activeButton.style.background = 'transparent';
            activeButton.style.color = '#647937';
            activeButton.style.fontWeight = '500';
        }

        // 현재 버튼 활성화
        btn.style.background = '#B2C784';
        btn.style.color = 'white';
        btn.style.fontWeight = '600';
        activeButton = btn;

        // 모달이 열려 있으면 카메라 이동/회전 차단
        if (!document.getElementById('work-modal')) {
            camera.position.set(room.x, 1.5, room.z || 0);
            // 항상 -z축 방향(정면) 바라보게
            camera.lookAt(room.x, 1.5, (room.z || 0) - 10);
        }

        // 선택된 버튼이 보이도록 스크롤
        btn.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });

        // console.log(`카메라 이동: ${room.name} (${room.x}, 1.5, ${room.z || 0})`);
    });

    btnWrapper.appendChild(btn);
});

navContainer.appendChild(btnWrapper);
document.body.appendChild(navContainer);

// 터치 스크롤 지원 (모바일)
let startX, scrollLeft;

btnWrapper.addEventListener('touchstart', (e) => {
    startX = e.touches[0].pageX - btnWrapper.offsetLeft;
    scrollLeft = btnWrapper.scrollLeft;
});

btnWrapper.addEventListener('touchmove', (e) => {
    if (!startX) return;
    const x = e.touches[0].pageX - btnWrapper.offsetLeft;
    const walk = (x - startX) * 2;
    btnWrapper.scrollLeft = scrollLeft - walk;
});

btnWrapper.addEventListener('touchend', () => {
    startX = null;
});

// 반응형 스타일 적용
const mediaQuery = window.matchMedia('(max-width: 768px)');

function handleMobileView(e) {
    if (window.innerWidth <= 768) {
        // 모바일 스타일 (가운데 정렬)
        navContainer.style.justifyContent = 'center';
        navContainer.style.left = '15px';
        navContainer.style.right = '15px';
        navContainer.style.top = '15px';
        rooms.forEach((room, index) => {
            const btn = btnWrapper.children[index];
            btn.style.padding = '7px 10px';
            btn.style.fontSize = '12px';
            btn.style.minWidth = '55px';
        });
    } else {
        // 태블릿/데스크탑 스타일
        navContainer.style.justifyContent = 'center';
        navContainer.style.left = '0';
        navContainer.style.right = '0';
        navContainer.style.top = '20px';
        rooms.forEach((room, index) => {
            const btn = btnWrapper.children[index];
            btn.style.padding = '12px 20px';
            btn.style.fontSize = '14px';
            btn.style.minWidth = '80px';
        });
    }
}

// 모바일/데스크탑 스타일 적용을 위해 초기 실행 및 변경 감지 리스너 추가
handleMobileView(mediaQuery);
mediaQuery.addEventListener('change', handleMobileView);


// 더블 클릭(데스크탑) 또는 더블 탭(모바일) 시 모달 오픈
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function handleTextureModal(event) {
    if (document.getElementById('work-modal')) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        const mesh = intersects[0].object;
        if (mesh.material && mesh.material.map) {
            const tex = mesh.material.map;
            const textureName = tex.name || mesh.name || tex.uuid;
            const mapping = textureWorkMap.find(m => m.textureName === textureName);
            if (mapping) {
                if (showWorkModal && works.length > 0) {
                    try {
                        showWorkModal(mapping.filename, works, awardsData, { imageBasePath: '../assets/images/works', medalBasePath: '../assets/images' });
                        // console.log('모달 오픈:', mapping.filename);
                    } catch (e) {
                        console.error('모달 오픈 실패:', e);
                        alert('모달 오픈 중 오류 발생');
                    }
                } else {
                    console.warn('showWorkModal 함수 또는 작품 데이터 없음');
                    alert('작품 정보를 찾을 수 없습니다.');
                }
            }
        }
    }
}

// 데스크탑: 더블 클릭
window.addEventListener('dblclick', handleTextureModal);

// 모바일: 더블 탭 감지
let lastTap = 0;
window.addEventListener('touchend', function(event) {
    const now = Date.now();
    if (now - lastTap < 350) { // 350ms 이내 두 번 터치
        // 더블 탭으로 간주
        // touch 이벤트는 clientX, clientY가 없으므로 touches[0] 또는 changedTouches[0] 사용
        if (event.changedTouches && event.changedTouches.length > 0) {
            event.clientX = event.changedTouches[0].clientX;
            event.clientY = event.changedTouches[0].clientY;
        }
        handleTextureModal(event);
    }
    lastTap = now;
});

addEventListeners(camera, collidableObjects);

// 모바일에서 스크롤 방지 및 터치 제어 개선
function preventMobileScroll() {
    // 이미 정의된 isMobile 변수 사용
    if (isMobile) {
        // 전체 페이지 스크롤 방지
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        // 터치 이벤트에서 기본 동작 방지 (단, 조이스틱과 가이드 제외)
        document.addEventListener('touchstart', function(e) {
            // 조이스틱 영역이나 조작 가이드 영역이 아닌 경우만 방지
            if (!e.target.closest('#joystick-container') && !e.target.closest('#control-guide')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.addEventListener('touchend', function(e) {
            // 조이스틱 영역이나 조작 가이드 영역이 아닌 경우만 방지
            if (!e.target.closest('#joystick-container') && !e.target.closest('#control-guide')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        document.addEventListener('touchmove', function(e) {
            // 조이스틱 영역이나 조작 가이드 영역이 아닌 경우만 방지
            if (!e.target.closest('#joystick-container') && !e.target.closest('#control-guide')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // iOS Safari의 bounce 효과 방지
        document.addEventListener('touchmove', function(e) {
            if (e.scale !== 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // 더블탭 줌 방지
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // 뷰포트 메타태그 추가/수정 (줌 방지)
        let viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
        } else {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
            document.getElementsByTagName('head')[0].appendChild(viewport);
        }
    }
}

// 모바일 스크롤 방지 실행
preventMobileScroll();

// Resize event listener
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// PC에서 조작 가이드 다시 보기 버튼 추가
function createHelpButton() {
    // 기존에 있는 버튼이 있으면 제거
    const existingButton = document.getElementById('help-button');
    if (existingButton) {
        existingButton.remove();
    }

    const helpButton = document.createElement('div');
    helpButton.id = 'help-button';
    helpButton.innerHTML = '?';
    helpButton.style.cssText = `
        position: fixed;
        top: 21px;
        right: 20px;
        width: 45px;
        height: 45px;
        background: rgba(255, 255, 255, 0.9);
        border: 2px solid #e0e0e0;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        z-index: 1001;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        font-size: 18px;
        font-weight: bold;
        color: #666;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        transition: all 0.2s ease;
    `;

    // 호버 효과
    helpButton.addEventListener('mouseenter', () => {
        helpButton.style.background = 'rgba(255, 255, 255, 1)';
        helpButton.style.transform = 'scale(1.05)';
        helpButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    });

    helpButton.addEventListener('mouseleave', () => {
        helpButton.style.background = 'rgba(255, 255, 255, 0.9)';
        helpButton.style.transform = 'scale(1)';
        helpButton.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    });

    // 클릭 이벤트 - 조작 가이드 다시 표시
    helpButton.addEventListener('click', () => {
        showControlGuide();
    });

    helpButton.title = '조작 가이드 보기';
    document.body.appendChild(helpButton);
}

// JSON 파일을 로드하고 그 데이터로 콜백을 처리하는 부분
loadJSONData('data/paintingInfo.json', function(data) {
    jsonData = data;  // JSON 데이터를 로드 후 jsonData에 할당
    startRendering();  // 데이터 로드 완료 후 렌더링 시작
});

// Rendering loop
function startRendering() {
    function render() {
        // 거리 체크 및 그림 정보 표시
        // 모달이 열려 있으면 카메라 관련 거리 체크도 차단
        if (!document.getElementById('work-modal')) {
            checkDistance(camera, collidableObjects, 3, jsonData);
        }

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    render(); // 렌더링 시작

}

