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

const texture = new THREE.TextureLoader().load("texture.png");
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(4, 4);

const material = new THREE.MeshBasicMaterial({
  map: texture,
});
const cube = new THREE.Mesh(geometry, material);
cube.position.x = 5;
cube.position.y = 6;
cube.position.z = 5;
scene.add(cube);

let cube2 = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
);
cube2.position.z = 2;
cube2.position.y = 15;
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

let meshVOX;
loader.load("1.vox", function (chunks) {
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    meshVOX = new VOXMesh(chunk);
    meshVOX.scale.setScalar(1);
    meshVOX.position.z = -10;
    meshVOX.position.y = chunk.size.y / 2 - 1;

    console.log(chunk);
    console.log(meshVOX);

    scene.add(meshVOX);
  }
});

// sky
const textureCiel = new THREE.TextureLoader().load("sky.jpg");
textureCiel.wrapS = THREE.RepeatWrapping;
textureCiel.wrapT = THREE.RepeatWrapping;
textureCiel.repeat.set(1, 1);
const sphereCiel = new THREE.Mesh(
  new THREE.SphereGeometry(950, 3, 3),
  new THREE.MeshBasicMaterial({
    map: textureCiel,
    side: THREE.BackSide,
  })
);
scene.add(sphereCiel);

// helpers
scene.add(new THREE.GridHelper(100, 100));
//scene.add( new THREE.AxesHelper( 5 ) );

// render

camera.position.x = -10;
camera.position.y = 10;
camera.position.z = 5;
let i = 0;
function animate() {
  i++;
  renderer.render(scene, camera);
  cube.rotation.x += 0.001;
  cube.rotation.y += 0.01;
  //camera.rotateY(-0.001)

  sphereCiel.position.x = camera.position.x;
  sphereCiel.position.y = camera.position.y;
  sphereCiel.position.z = camera.position.z;

  if (meshVOX && i % 200 == 0) {
    i = 0;
    meshVOX.material.wireframe = !meshVOX.material.wireframe;
  }
}
renderer.setAnimationLoop(animate);

document.addEventListener("keypress", (event) => {
  if (event.key == "z") {
    camera.position.z -= 1;
  }
  if (event.key == "q") {
    camera.position.x -= 1;
  }
  if (event.key == "s") {
    camera.position.z += 1;
  }
  if (event.key == "d") {
    camera.position.x += 1;
  }
  if (event.key == "e") {
    camera.rotation.y -= Math.PI / 64;
  }
  if (event.key == "a") {
    camera.rotation.y += Math.PI / 64;
  }
});
