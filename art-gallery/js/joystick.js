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
        // 조이스틱 벡터 값을 안전하게 제한 (-1 ~ 1 범위)
        const vectorX = Math.max(-1, Math.min(1, dx / maxDist));
        const vectorY = Math.max(-1, Math.min(1, dy / maxDist));
        joystickVector = { x: vectorX, y: vectorY };
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
        // 마우스 이벤트에서도 조이스틱 벡터 값을 안전하게 제한
        const vectorX = Math.max(-1, Math.min(1, dx / maxDist));
        const vectorY = Math.max(-1, Math.min(1, dy / maxDist));
        joystickVector = { x: vectorX, y: vectorY };
    }

    function mouseUpHandler(e) {
        window.joystickActive = false;
        knob.style.transform = 'translate(0px,0px)';
        joystickVector = { x: 0, y: 0 };
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    }
}

// 이동 속도 제어를 위한 시간 기반 변수
let lastMoveTime = 0;

// 페이지 visibility 변경 시 타이머 리셋 (화면 껐다 켤 때 문제 해결)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // 페이지가 다시 보일 때 타이머를 현재 시간으로 리셋
        lastMoveTime = Date.now();
    }
});

export function updateJoystickMovement(camera, collidableObjects) {
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    if (isMobile) {
        if (!joystickVector) return;
        
        // 시간 기반 이동으로 프레임률에 독립적으로 만들기
        const now = Date.now();
        if (!lastMoveTime) lastMoveTime = now;
        const deltaTime = Math.min((now - lastMoveTime) / 1000, 0.1); // 초 단위, 최대 0.1초로 제한
        lastMoveTime = now;
        
        // 너무 짧은 시간 간격이면 스킵 (과도한 이동 방지)
        if (deltaTime < 0.016) return; // 약 60fps 제한
        
        // 조이스틱 벡터 값 제한 (비정상적으로 큰 값 방지)
        const clampedVector = {
            x: Math.max(-1, Math.min(1, joystickVector.x)),
            y: Math.max(-1, Math.min(1, joystickVector.y))
        };
        
        const speed = 3.0; // 모바일 속도 20% 증가 (2.5 → 3.0)
        let forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        let right = new THREE.Vector3();
        right.crossVectors(forward, camera.up).normalize();
        let move = new THREE.Vector3();
        move.addScaledVector(forward, -clampedVector.y * speed * deltaTime);
        move.addScaledVector(right, clampedVector.x * speed * deltaTime);
        
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
        
        // PC도 시간 기반 이동으로 변경
        const now = Date.now();
        if (!lastMoveTime) lastMoveTime = now;
        const deltaTime = Math.min((now - lastMoveTime) / 1000, 0.1); // 초 단위, 최대 0.1초로 제한
        lastMoveTime = now;
        
        if (deltaTime < 0.016) return; // 60fps 제한
        
        const clampedVector = {
            x: Math.max(-1, Math.min(1, joystickVector.x)),
            y: Math.max(-1, Math.min(1, joystickVector.y))
        };
        
        const speed = 3.5; // PC는 조금 더 빠르게 (units/second)
        let forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        let right = new THREE.Vector3();
        right.crossVectors(forward, camera.up).normalize();
        let move = new THREE.Vector3();
        move.addScaledVector(forward, -clampedVector.y * speed * deltaTime);
        move.addScaledVector(right, clampedVector.x * speed * deltaTime);
        
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
