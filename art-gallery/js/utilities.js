// utilities.js

import { displayPaintingInfo, hidePaintingInfo } from './paintingInfo.js';

import * as THREE from 'three';
// ...existing code...

// 키보드 입력 상태 추적을 위한 변수들
let keys = {};
let keyboardMovement = new THREE.Vector3();
let targetMovement = new THREE.Vector3();
let smoothingFactor = 0.3; // 0.15 → 0.3으로 증가 (더 빠른 반응)

export function addEventListeners(camera, collidableObjects) {
    document.addEventListener("keydown", (event) => onKeyDown(event, camera, collidableObjects), false);
    document.addEventListener("keyup", (event) => onKeyUp(event), false); // keyup 이벤트 추가
    document.addEventListener("mousedown", (event) => onMouseDown(event, camera), false);
    // document.addEventListener("mousedown", (event) => onTouchMove(event, camera), false);
    document.addEventListener("mouseup", (event) => onMouseUp(), false);
    document.addEventListener("touchstart", (event) => { isDragging = true; previousMousePosition = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }, false);
    document.addEventListener("touchmove", (event) => onTouchMove(event, camera), false);
    document.addEventListener("touchend", (event) => { isDragging = false; }, false);
    
    // 연속적인 키보드 움직임을 위한 애니메이션 루프 시작
    startKeyboardMovementLoop(camera, collidableObjects);
}

let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

function onMouseDown(event, camera) {
    if (document.getElementById('work-modal')) return;
    isDragging = true;
    previousMousePosition = { x: event.clientX, y: event.clientY };
    document.addEventListener("mousemove", (event) => onMouseMove(event, camera), false);  // camera를 바로 넘기지 않고, onMouseMove에서 사용
}

function onMouseUp() {
    isDragging = false;
    document.removeEventListener("mousemove", onMouseMove, false);  // 여기서 camera를 넘겨주지 않고, 아래에서 사용
}

function onMouseMove(event, camera) {
    if (!isDragging || document.getElementById('work-modal')) return;
    handleRotation(event.clientX, event.clientY, camera);  // camera는 global로 접근할 수 있도록 처리
}

// 터치 움직임 감지
function onTouchMove(event, camera) {
    if (!isDragging || event.touches.length !== 1 || document.getElementById('work-modal')) return;
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

// 키보드 이벤트 처리 - 키 상태만 업데이트
function onKeyDown(event, camera, collidableObjects) {
    if (document.getElementById('work-modal')) return;
    
    // 키 상태 저장
    switch (event.key) {
        case "ArrowUp":
        case "w":
        case "W":
            keys.forward = true;
            break;
        case "ArrowDown":
        case "s":
        case "S":
            keys.backward = true;
            break;
        case "ArrowLeft":
        case "a":
        case "A":
            keys.left = true;
            break;
        case "ArrowRight":
        case "d":
        case "D":
            keys.right = true;
            break;
    }
    
    event.preventDefault();
}

// 키보드 키업 이벤트 처리
function onKeyUp(event) {
    // 키 상태 해제
    switch (event.key) {
        case "ArrowUp":
        case "w":
        case "W":
            keys.forward = false;
            break;
        case "ArrowDown":
        case "s":
        case "S":
            keys.backward = false;
            break;
        case "ArrowLeft":
        case "a":
        case "A":
            keys.left = false;
            break;
        case "ArrowRight":
        case "d":
        case "D":
            keys.right = false;
            break;
    }
}

// 연속적이고 부드러운 키보드 움직임 처리
function startKeyboardMovementLoop(camera, collidableObjects) {
    function updateKeyboardMovement() {
        if (document.getElementById('work-modal')) {
            requestAnimationFrame(updateKeyboardMovement);
            return;
        }

        // 목표 움직임 벡터 계산
        targetMovement.set(0, 0, 0);
        
        if (keys.forward || keys.backward || keys.left || keys.right) {
            let speed = 0.25; // 0.2 → 0.25로 증가
            let direction = new THREE.Vector3();
            
            camera.getWorldDirection(direction);
            direction.y = 0; 
            direction.normalize();

            let right = new THREE.Vector3();
            right.set(-direction.z, 0, direction.x).normalize();

            if (keys.forward) targetMovement.addScaledVector(direction, speed);
            if (keys.backward) targetMovement.addScaledVector(direction, -speed);
            if (keys.left) targetMovement.addScaledVector(right, -speed);
            if (keys.right) targetMovement.addScaledVector(right, speed);
        } else {
            // 키를 누르지 않을 때 더 빠른 감속
            keyboardMovement.multiplyScalar(0.85); // 추가 감속
        }

        // 부드러운 보간을 통한 움직임
        keyboardMovement.lerp(targetMovement, smoothingFactor);
        
        // 움직임이 거의 0에 가까우면 완전히 멈춤 (임계값 증가로 더 빠른 정지)
        if (keyboardMovement.length() < 0.005) { // 0.001 → 0.005로 증가
            keyboardMovement.set(0, 0, 0);
        }
        
        // 실제 움직임 적용 (충돌 검사 포함)
        if (keyboardMovement.length() > 0) {
            let nextPosition = camera.position.clone().add(keyboardMovement);
            
            if (!checkCollision(nextPosition, camera, collidableObjects)) {
                camera.position.add(keyboardMovement);
            } else {
                // 충돌 시 움직임을 빠르게 완전히 멈춤
                keyboardMovement.set(0, 0, 0);
            }
        }

        requestAnimationFrame(updateKeyboardMovement);
    }
    
    updateKeyboardMovement();
}

// 충돌 검사 함수
export function checkCollision(nextPosition, camera, collidableObjects) {
    let raycaster = new THREE.Raycaster();
    let direction = new THREE.Vector3();
    direction.subVectors(nextPosition, camera.position).normalize(); // 방향 벡터 계산

    raycaster.set(camera.position, direction);

    let intersects = raycaster.intersectObjects(collidableObjects, true);
    for (let i = 0; i < intersects.length; i++) {
        if (intersects[i].distance < 2) { // 0.5 → 5로 증가 (벽에서 더 멀리 멈춤)
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

