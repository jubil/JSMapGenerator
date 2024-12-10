import * as THREE from "../libs/three/three.module.js";
import { VOXLoader, VOXMesh } from "../libs/three/addons/loaders/VOXLoader.js";

let FOV = 80;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x82c8e5);

const camera = new THREE.PerspectiveCamera(
  FOV,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry(1, 1, 1);

const texture = new THREE.TextureLoader().load( "texture.png" );
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set( 0.5, 0.5 );

const material = new THREE.MeshBasicMaterial({
  map: texture,
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

let cube2 = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
);
cube2.position.z = 2;
cube2.position.y = 1;
cube2.rotateY(0.2);
scene.add(cube2);

//THREE.ColorManagement.enabled = true;
//renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

// light

const hemiLight = new THREE.HemisphereLight(0xcccccc, 0x444444, 3);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
dirLight.position.set(1.5, 3, 2.5);
scene.add(dirLight);

const loader = new VOXLoader();

loader.load("1.vox", function (chunks) {
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    const mesh = new VOXMesh(chunk);
    mesh.scale.setScalar(0.5);
    mesh.position.z = -10;
    
    scene.add(mesh);
  }
});

camera.position.z = 5;
camera.position.x = -10;
function animate() {
  renderer.render(scene, camera);
  cube.rotation.x += 0.001;
  cube.rotation.y += 0.01;
  camera.rotateY(-0.001)
  
  if(camera.rotation.y < -1.3){
    camera.rotation.y = 0.9
  }
}
renderer.setAnimationLoop(animate);

