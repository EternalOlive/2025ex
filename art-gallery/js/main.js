import { setupScene, setupCamera, setupRenderer, setupLighting } from './setup.js';
import { checkCollision, checkDistance, addEventListeners } from './utilities.js';
import { setupJoystick, addJoystickListeners, updateJoystickMovement } from './joystick.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
// 모듈 import 경로 및 오류 로그 보강
let works = [];
let awardsData = null;

async function loadWorksData() {
    try {
        const response = await fetch('../assets/js/works.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        works = await response.json();
        const awardsRes = await fetch('../assets/js/awards.json');
        if (awardsRes.ok) awardsData = await awardsRes.json();
        else awardsData = null;
        return works;
    } catch (error) {
        console.error('작품 데이터 로드 실패:', error);
        works = [];
        awardsData = null;
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
        console.log('showWorkModal 모듈 import 성공');
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

// 모바일 조이스틱 UI 초기화
setupJoystick();
addJoystickListeners(camera);

// Set up lighting
const { ambientLight, sunLight,wallLight } = setupLighting(camera);
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

// Load the 3D model and add it to the scene
let loader = new GLTFLoader();
let collidableObjects = [];
// checkCollision을 window에 등록하여 joystick.js에서 접근 가능하게 함
window.checkCollision = checkCollision;
loader.load("models/gallery.gltf", function (gltf) {
    let model = gltf.scene;
    scene.add(model);

    model.traverse(function (child) {
        if (child.isMesh) {
            collidableObjects.push(child);
        }
    });
}, undefined, function (error) {
    console.error(error);
});

// 애니메이션 루프에서 조이스틱 이동 적용

function animate() {
    requestAnimationFrame(animate);
    // 모달이 열려 있으면 카메라 이동/회전 차단
    if (!document.getElementById('work-modal')) {
        updateJoystickMovement(camera, collidableObjects);
    }
    renderer.render(scene, camera);
}
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

        console.log(`카메라 이동: ${room.name} (${room.x}, 1.5, ${room.z || 0})`);
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
// Add event listeners
// 마우스 클릭 시 해당 mesh의 텍스처 이름 출력
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener('pointerdown', function(event) {
    // 모달이 열려 있으면 텍스처 클릭 시 아무 동작도 하지 않음
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
            // textureWorkMap에서 filename 찾기
            const mapping = textureWorkMap.find(m => m.textureName === textureName);
            if (mapping) {
                if (showWorkModal && works.length > 0) {
                    try {
                        showWorkModal(mapping.filename, works, awardsData, { imageBasePath: '../assets/images/works', medalBasePath: '../assets/images' });
                        console.log('모달 오픈:', mapping.filename);
                    } catch (e) {
                        console.error('모달 오픈 실패:', e);
                        alert('모달 오픈 중 오류 발생');
                    }
                } else {
                    console.warn('showWorkModal 함수 또는 작품 데이터 없음');
                    alert('작품 정보를 찾을 수 없습니다.');
                }
            } else {
                console.warn('textureWorkMap 매핑 없음:', textureName);
            }
        } else {
            console.log('텍스처 없음:', mesh.name || mesh.uuid);
        }
    }
});
addEventListeners(camera, collidableObjects);

// Resize event listener
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

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
