import { setupScene, setupCamera, setupRenderer, setupLighting } from './setup.js';
import { checkCollision, checkDistance, addEventListeners } from './utilities.js';
import { setupJoystick, addJoystickListeners, updateJoystickMovement } from './utilities.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Set up scene, camera, and renderer
const scene = setupScene();
const camera = setupCamera();
const renderer = setupRenderer();

// 모바일 조이스틱 UI 초기화
setupJoystick();
addJoystickListeners(camera);

// Set up lighting
const { ambientLight, sunLight } = setupLighting(camera);
scene.add(ambientLight);
scene.add(sunLight);

let jsonData = {};

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
loader.load("models/250820.glb", function (gltf) {
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
    updateJoystickMovement(camera);
    renderer.render(scene, camera);
}
animate();

    // 좌상단에 버튼 추가
    const moveBtn = document.createElement('button');
    moveBtn.textContent = '다른 방으로';
    moveBtn.style.position = 'fixed';
    moveBtn.style.top = '20px';
    moveBtn.style.left = '20px';
    moveBtn.style.zIndex = '2000';
    moveBtn.style.padding = '10px 18px';
    moveBtn.style.background = '#1976d2';
    moveBtn.style.color = '#fff';
    moveBtn.style.border = 'none';
    moveBtn.style.borderRadius = '8px';
    moveBtn.style.cursor = 'pointer';
    moveBtn.style.fontSize = '16px';
    document.body.appendChild(moveBtn);

    let toggled = false;
    moveBtn.addEventListener('click', function() {
        if (toggled) {
            camera.position.set(0, 1.5, 5);
        } else {
            camera.position.set(13, 1.5, 5);
        }
        toggled = !toggled;
    });

// Add event listeners
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
        checkDistance(camera, collidableObjects, 3, jsonData);

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    render(); // 렌더링 시작
}
