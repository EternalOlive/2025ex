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
    camera.position.set(-84.612, 1.9, -6);
    return camera;
}

// Renderer setup
export function setupRenderer() {
    // 모바일 디바이스 감지
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const renderer = new THREE.WebGLRenderer({ 
        antialias: !isMobile, // 모바일에서는 안티에일리어싱 비활성화
        powerPreference: isMobile ? "default" : "high-performance",
        precision: isMobile ? "mediump" : "highp",
        alpha: false,
        stencil: false
    });
    
    // 모바일 최적화된 픽셀 비율
    if (isMobile) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
    } else {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    }
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // 렌더링 품질 설정
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    if (isMobile) {
        // 모바일: 기본 톤매핑으로 성능 향상
        renderer.toneMapping = THREE.LinearToneMapping;
        renderer.toneMappingExposure = 1.0;
        // 그림자 비활성화
        renderer.shadowMap.enabled = false;
    } else {
        // 데스크탑: 고품질 설정
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        // 그림자 설정 (필요시)
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
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

