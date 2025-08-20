import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 장면
const scene = new THREE.Scene(); // Create a scene
scene.background = new THREE.Color(0x000000); // Set the background color of the scene

// 카메라
const camera = new THREE.PerspectiveCamera( 
    75, // Field of view 숫자를 줄이면 확대됨 광각이면 숫자 크게 커질수록 투시 과하게
    window.innerWidth / window.innerHeight, // Aspect ratio 가로세로 비율
    0.1, // Near clipping plane 카메라 시점 시작되는 위치
    1000 // Far clipping plane 카메라 시점 끝나는 위치(렌더링과 관련)
); // Create a camera
scene.add(camera); // Add camera to scene
camera.position.y = 1; // Move camera back 5 units
camera.position.z = 4; // Move camera up 5 units


// 렌더러
const renderer = new THREE.WebGLRenderer({antialias: true}); // Create a renderer with antialiasing
renderer.setSize(window.innerWidth, window.innerHeight); // Set the size of the renderer to the window size
document.body.appendChild(renderer.domElement); // Append the renderer to the body

// Let there be light
// Ambient Light
let ambientLight = new THREE.AmbientLight("white", 0.5); // color, intensity
ambientLight.position.set(camera.position); // Light follows the camera
scene.add(ambientLight); // Add the ambient light to the scene

// Directional Light
let sunLight = new THREE.DirectionalLight(0xddddd, 1.0); // color, intensity
sunLight.position.y = 15
scene.add(sunLight); // Add the sunlight to the scene


// ★☆★☆★☆★☆★☆
// 카메라를 움직임 #여기서 마우스 클릭한 상태에서 드래그하면 화면 회전 추가 더블클릭하면 이동
// 모바일에서 구현 어떻게할지 생각
// Event listeners for when we press a key
document.addEventListener("keydown", onkeydown, false);
document.addEventListener("mousedown", onmousedown, false);
document.addEventListener("mouseup", onmouseup, false);

function onmousedown(event) {
    document.addEventListener("mousemove", onmousemove, false);
    
}

// 🚀 충돌 감지 함수 (카메라가 앞으로 이동할 때 충돌 감지)
function checkCollision(nextPosition) {
    let raycaster = new THREE.Raycaster();
    let direction = new THREE.Vector3();
    direction.subVectors(nextPosition, camera.position).normalize();

    raycaster.set(camera.position, direction);

    let intersects = raycaster.intersectObjects(collidableObjects, true); // 🛑 충돌 검사할 대상: collidableObjects 배열

    for (let i = 0; i < intersects.length; i++) {
        if (intersects[i].distance < 0.5) { // 🔥 카메라와 너무 가까운 오브젝트는 충돌로 간주
            return true;
        }
    }
    return false;
}

// 🚀 키보드 이동 시 충돌 감지 추가
function onkeydown(event) {
    let speed = 0.3;
    let direction = new THREE.Vector3();

    camera.getWorldDirection(direction);
    direction.y = 0; 
    direction.normalize();

    let right = new THREE.Vector3();
    right.set(-direction.z, 0, direction.x).normalize();

    let movement = new THREE.Vector3();

    switch (event.key) {
        case "ArrowUp":
            movement.addScaledVector(direction, speed);
            break;
        case "ArrowDown":
            movement.addScaledVector(direction, -speed);
            break;
        case "ArrowLeft":
            movement.addScaledVector(right, -speed);
            break;
        case "ArrowRight":
            movement.addScaledVector(right, speed);
            break;
    }

    let nextPosition = camera.position.clone().add(movement);

    if (!checkCollision(nextPosition)) {
        camera.position.add(movement);
    }
}


let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// PC 마우스 이벤트
document.addEventListener("mousedown", (event) => {
    isDragging = true;
    previousMousePosition = { x: event.clientX, y: event.clientY };
    document.addEventListener("mousemove", onMouseMove, false);
});

document.addEventListener("mouseup", () => {
    isDragging = false;
    document.removeEventListener("mousemove", onMouseMove, false);
});

// 모바일 터치 이벤트
document.addEventListener("touchstart", (event) => {
    isDragging = true;
    let touch = event.touches[0];
    previousMousePosition = { x: touch.clientX, y: touch.clientY };
    document.addEventListener("touchmove", onTouchMove, false);
});

document.addEventListener("touchend", () => {
    isDragging = false;
    document.removeEventListener("touchmove", onTouchMove, false);
});

// 마우스 움직임 감지
function onMouseMove(event) {
    if (!isDragging) return;
    handleRotation(event.clientX, event.clientY);
}

// 터치 움직임 감지
function onTouchMove(event) {
    if (!isDragging || event.touches.length !== 1) return;
    let touch = event.touches[0];
    handleRotation(touch.clientX, touch.clientY);
}

// 회전 처리 함수 (마우스 & 터치 공통)
function handleRotation(currentX, currentY) {
    let deltaX = currentX - previousMousePosition.x;
    // let deltaY = currentY - previousMousePosition.y;

    previousMousePosition = { x: currentX, y: currentY };

    let rotationSpeed = 0.005;
    camera.rotation.y -= deltaX * rotationSpeed; // 좌우 회전
    // camera.rotation.x -= deltaY * rotationSpeed; // 상하 회전

    // 상하 회전 제한 (너무 많이 뒤집히지 않도록)
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
}

let collidableObjects = []; // 충돌 감지할 오브젝트 리스트

// Load a 3D model
let loader = new GLTFLoader(); // Create a new loader
loader.load("models/scene.gltf", function(gltf) {
    let model = gltf.scene; // Get the model
    scene.add(model); // Add the gltf scene to the scene

    model.traverse(function(child) {
    if (child.isMesh) {
        collidableObjects.push(child); // 🛠️ 충돌 감지 리스트에 추가
        console.log("collidableObjects", collidableObjects);
    }
    });

}, undefined, function(error) {
    console.error(error); // Log any errors
});

//반응형 처리해줌
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onWindowResize, false);

// // 큐브 회전 씬마다 렌더링
let render = function() {


    renderer.render(scene, camera); // Render the scene and the camera

    requestAnimationFrame(render); // Call the render function

};
render(); // Call the render function


// Renderer
// renderer.render(scene, camera); // Render the scene and the camera
