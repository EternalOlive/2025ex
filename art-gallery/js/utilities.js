// utilities.js
import * as THREE from 'three';
import { displayPaintingInfo, hidePaintingInfo } from './paintingInfo.js';

// 모바일 환경 감지
function isMobile() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

// 조이스틱 UI 표시
export function setupJoystick() {
    const container = document.getElementById('joystick-container');
    if (!container) return;
    container.style.display = isMobile() ? 'block' : 'none';
}

let joystickActive = false;
let joystickCenter = { x: 80, y: 80 };
let joystickVector = { x: 0, y: 0 };

export function addJoystickListeners(camera) {
    if (!isMobile()) return;
    const container = document.getElementById('joystick-container');
    const knob = document.getElementById('joystick-knob');
    if (!container || !knob) return;

    container.addEventListener('touchstart', function(e) {
        joystickActive = true;
        if (e.touches.length > 0) {
            joystickCenter = {
                x: e.touches[0].clientX - container.getBoundingClientRect().left,
                y: e.touches[0].clientY - container.getBoundingClientRect().top
            };
        }
    });
    container.addEventListener('touchmove', function(e) {
        if (!joystickActive || e.touches.length === 0) return;
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        let x = touch.clientX - rect.left;
        let y = touch.clientY - rect.top;
        let dx = x - 60;
        let dy = y - 60;
        // 최대 반경 제한
        const maxDist = 40;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > maxDist) {
            dx = dx * maxDist / dist;
            dy = dy * maxDist / dist;
        }
        knob.style.transform = `translate(${dx}px,${dy}px)`;
        joystickVector = { x: dx / maxDist, y: dy / maxDist };
    });
    container.addEventListener('touchend', function(e) {
        joystickActive = false;
        knob.style.transform = 'translate(0px,0px)';
        joystickVector = { x: 0, y: 0 };
    });
}

// 매 프레임마다 호출해서 카메라 이동
export function updateJoystickMovement(camera) {
    if (!isMobile() || !joystickVector) return;
    const speed = 0.07; // 이동속도 증가 (기존 0.05)
    // 카메라의 방향 기준으로 이동
    let forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    let right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();
    let move = new THREE.Vector3();
    move.addScaledVector(forward, -joystickVector.y * speed);
    move.addScaledVector(right, joystickVector.x * speed);
    camera.position.add(move);
}


export function addEventListeners(camera, collidableObjects) {
    document.addEventListener("keydown", (event) => onKeyDown(event, camera, collidableObjects), false);
    document.addEventListener("mousedown", (event) => onMouseDown(event, camera), false);
    // document.addEventListener("mousedown", (event) => onTouchMove(event, camera), false);
    document.addEventListener("mouseup", (event) => onMouseUp(), false);
    document.addEventListener("touchstart", (event) => { isDragging = true; previousMousePosition = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }, false);
document.addEventListener("touchmove", (event) => onTouchMove(event, camera), false);
document.addEventListener("touchend", (event) => { isDragging = false; }, false);
}

let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

function onMouseDown(event, camera) {
    isDragging = true;
    previousMousePosition = { x: event.clientX, y: event.clientY };
    document.addEventListener("mousemove", (event) => onMouseMove(event, camera), false);  // camera를 바로 넘기지 않고, onMouseMove에서 사용
}

function onMouseUp() {
    isDragging = false;
    document.removeEventListener("mousemove", onMouseMove, false);  // 여기서 camera를 넘겨주지 않고, 아래에서 사용
}

function onMouseMove(event, camera) {
    if (!isDragging) return;
    handleRotation(event.clientX, event.clientY, camera);  // camera는 global로 접근할 수 있도록 처리
}

// 터치 움직임 감지
function onTouchMove(event, camera) {
    if (!isDragging || event.touches.length !== 1) return;
    let touch = event.touches[0];
    handleRotation(touch.clientX, touch.clientY, camera);
}  

// 회전 처리 함수
function handleRotation(currentX, currentY, camera) {  
    let deltaX = currentX - previousMousePosition.x;
    previousMousePosition = { x: currentX, y: currentY };

    let rotationSpeed = 0.005;
    // 여기에서 camera는 global로 사용하고 있습니다.
    camera.rotation.y -= deltaX * rotationSpeed;
}

// 키보드 이벤트 처리
function onKeyDown(event, camera, collidableObjects) {
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

    if (!checkCollision(nextPosition, camera, collidableObjects)) {
        camera.position.add(movement);
    }
}

// 충돌 검사 함수
export function checkCollision(nextPosition, camera, collidableObjects) {
    let raycaster = new THREE.Raycaster();
    let direction = new THREE.Vector3();
    direction.subVectors(nextPosition, camera.position).normalize(); // 방향 벡터 계산

    raycaster.set(camera.position, direction);

    let intersects = raycaster.intersectObjects(collidableObjects, true);
    for (let i = 0; i < intersects.length; i++) {
        if (intersects[i].distance < 0.5) { // 너무 가까우면 충돌로 간주
            return true;
        }
    }
    return false;
}

// 카메라와 그림(또는 오브젝트) 간의 거리 체크
export function checkDistance(camera, collidableObjects, threshold = 3, jsonData) {
    let closestObject = null;
    let minDistance = Infinity;

    collidableObjects.forEach(object => {
      const distance = camera.position.distanceTo(object.position);
      
      if (distance < threshold && distance < minDistance) {
        closestObject = object;
        minDistance = distance;
      }
    });

    if (closestObject) {
        if (closestObject.name && jsonData && jsonData[closestObject.name]) {
          displayPaintingInfo(jsonData[closestObject.name]);
        }
    } else {
        hidePaintingInfo();
    }
}

