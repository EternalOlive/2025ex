import * as THREE from 'three';
// 빛, 렌더러, 카메라 세팅

// Scene setup
export function setupScene() {
    const scene = new THREE.Scene();
    // Load sky image as background
    const loader = new THREE.TextureLoader();
    const texture = loader.load(
        'img/sky.jpeg', // 경로 수정: model.html 기준 art-gallery/img/sky.jpeg
        undefined,
        undefined,
        function(err) { console.error('이미지 로드 실패:', err); }
    );
    scene.background = texture;
    return scene;
}

// Camera setup
export function setupCamera() {
    const camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight,  
        0.1, 
        1000 
    );
    camera.position.set(-84.612, 1.5, -6);
    return camera;
}

// Renderer setup
export function setupRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    return renderer;
}

// Lighting setup
export function setupLighting(scene) {
    // 환경광 - 전체적인 기본 밝기
    // let ambientLight = new THREE.AmbientLight(0xfaf6f0, 2); // 0.5 → 0.7로 증가
    let ambientLight = new THREE.AmbientLight(0xffe7d1, 2.0); // 0.5 → 0.7로 증가
    // ece8db
    
    // 방향광 - 메인 조명
    // let sunLight = new THREE.DirectionalLight(0xfff5eb, 2); // 흰색으로 변경
    let sunLight = new THREE.DirectionalLight(0xfff5eb, 1); // 흰색으로 변경
    sunLight.position.set(-5,5,5); // x,z 위치도 설정

    // 3. 벽면 간접광 (벽 반사 느낌)
    // let wallLight = new THREE.DirectionalLight(0xf5f5f5, 1.5);
    let wallLight = new THREE.DirectionalLight(0xfff5eb, 1.55);
    wallLight.position.set(3, 5, 3);
    
    return { ambientLight, sunLight, wallLight };
}

