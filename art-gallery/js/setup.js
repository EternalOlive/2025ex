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
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance",
        precision: "highp"
    });
    
    // 고해상도 디스플레이 지원
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // 렌더링 품질 향상
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0; // 1.0 → 1.3으로 증가 (더 밝게)
    
    // 그림자 설정 (필요시)
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    document.body.appendChild(renderer.domElement);
    return renderer;
}

// Lighting setup
export function setupLighting(scene) {
    // 환경광 - 전체적인 기본 밝기 (더 밝게)
    let ambientLight = new THREE.AmbientLight(0xffe7d1, 2.4); // 2.0 → 2.8로 증가
    
    // 방향광 - 메인 조명 (더 밝게)
    let sunLight = new THREE.DirectionalLight(0xfff5eb, 1.5); // 1 → 1.8로 증가
    sunLight.position.set(-5,5,5); // x,z 위치도 설정

    // 벽면 간접광 (벽 반사 느낌, 더 밝게)
    let wallLight = new THREE.DirectionalLight(0xfff5eb, 1.55); // 1.55 → 2.2로 증가
    wallLight.position.set(3, 5, 3);
    
    return { ambientLight, sunLight, wallLight };
}

