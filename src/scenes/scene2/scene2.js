import * as THREE from 'three';
import { GLTFLoader as GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const cpuUrl = new URL('../../assets/3Dmodels/CPU.glb', import.meta.url).href;

export function buildScene2(group) {
    // light + shadow
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
    const dirLight = new THREE.DirectionalLight(0xffffff, 10);
    dirLight.position.set(-3, 4, -20);
    dirLight.castShadow = true;
    group.add(hemiLight);
    group.add(dirLight);

    // model
    const CPU = new THREE.Object3D();
    const loader = new GLTFLoader();

    loader.load(cpuUrl, (gltf) => {
        CPU.add(gltf.scene);
        group.add(CPU);

        CPU.scale.set(1.6, 1.6, 1.6);
        CPU.position.set(-2.25, 0, 0);
        CPU.rotateX(0.3);
        CPU.rotateY(2.2);
        CPU.rotateZ(0.9);

        CPU.traverse(object => {
            if (object.isMesh) {
                const oldMaterial = object.material;   
                object.material = new THREE.MeshBasicMaterial({
                    map: oldMaterial.map,
                    color: oldMaterial.color,
                    transparent: oldMaterial.transparent,
                    opacity: oldMaterial.opacity,
                });
            }
        });
    });

    return { CPU };
}
