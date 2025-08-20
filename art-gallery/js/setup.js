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
    camera.position.set(0, 1.5, 5);
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
export function setupLighting(camera) {
    let ambientLight = new THREE.AmbientLight("white", 2.5);
    ambientLight.position.set(camera.position);
    
    let sunLight = new THREE.DirectionalLight(0xfffcfa, 3.0);
    sunLight.position.set(5, -15, 5); // x=10, y=15, z=5
    
    return { ambientLight, sunLight };
}

