import * as THREE from 'three';
// joystick.js
// PC/모바일 모두 지원하는 조이스틱 UI 및 입력 처리

// joystickActive를 window에 등록하여 updateJoystickMovement에서 접근 가능하게 함
window.joystickActive = false;
let joystickCenter = { x: 80, y: 80 };
let joystickVector = { x: 0, y: 0 };

export function setupJoystick() {
    const container = document.getElementById('joystick-container');
    if (!container) return;
    container.style.display = 'block'; // Always show joystick UI
}

export function addJoystickListeners(camera) {
    const container = document.getElementById('joystick-container');
    const knob = document.getElementById('joystick-knob');
    if (!container || !knob) return;

    // 모바일 터치 이벤트
    container.addEventListener('touchstart', function(e) {
        joystickActive = true;
        if (e.touches.length > 0) {
            joystickCenter = {
                x: e.touches[0].clientX - container.getBoundingClientRect().left,
                y: e.touches[0].clientY - container.getBoundingClientRect().top
            };
        }
    }, { passive: true });
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
    }, { passive: true });
    container.addEventListener('touchend', function(e) {
        joystickActive = false;
        knob.style.transform = 'translate(0px,0px)';
        joystickVector = { x: 0, y: 0 };
    }, { passive: true });

    // PC 마우스 이벤트
    container.addEventListener('mousedown', function(e) {
        window.joystickActive = true;
        joystickCenter = {
            x: e.clientX - container.getBoundingClientRect().left,
            y: e.clientY - container.getBoundingClientRect().top
        };
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    });

    // 화면 어디서든 마우스를 떼면 드래그 종료
    window.addEventListener('mouseup', function(e) {
        if (window.joystickActive) {
            window.joystickActive = false;
            knob.style.transform = 'translate(0px,0px)';
            joystickVector = { x: 0, y: 0 };
        }
    });

    function mouseMoveHandler(e) {
        if (!window.joystickActive) return;
        const rect = container.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        let dx = x - 60;
        let dy = y - 60;
        const maxDist = 40;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > maxDist) {
            dx = dx * maxDist / dist;
            dy = dy * maxDist / dist;
        }
        knob.style.transform = `translate(${dx}px,${dy}px)`;
        joystickVector = { x: dx / maxDist, y: dy / maxDist };
    }

    function mouseUpHandler(e) {
        window.joystickActive = false;
        knob.style.transform = 'translate(0px,0px)';
        joystickVector = { x: 0, y: 0 };
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    }
}

export function updateJoystickMovement(camera, collidableObjects) {
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    if (isMobile) {
        if (!joystickVector) return;
        const speed = 0.07;
        let forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        let right = new THREE.Vector3();
        right.crossVectors(forward, camera.up).normalize();
        let move = new THREE.Vector3();
        move.addScaledVector(forward, -joystickVector.y * speed);
        move.addScaledVector(right, joystickVector.x * speed);
        let nextPosition = camera.position.clone().add(move);
        if (typeof window.checkCollision === 'function') {
            if (!window.checkCollision(nextPosition, camera, collidableObjects)) {
                camera.position.add(move);
            }
        } else {
            camera.position.add(move);
        }
    } else {
        // PC 환경: 드래그 중일 때만 이동
        if (!window.joystickActive) return;
        if (!joystickVector) return;
        const speed = 0.07;
        let forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        let right = new THREE.Vector3();
        right.crossVectors(forward, camera.up).normalize();
        let move = new THREE.Vector3();
        move.addScaledVector(forward, -joystickVector.y * speed);
        move.addScaledVector(right, joystickVector.x * speed);
        let nextPosition = camera.position.clone().add(move);
        if (typeof window.checkCollision === 'function') {
            if (!window.checkCollision(nextPosition, camera, collidableObjects)) {
                camera.position.add(move);
            }
        } else {
            camera.position.add(move);
        }
    }
}
