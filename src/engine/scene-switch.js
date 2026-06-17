import * as THREE from 'three';
import { buildScene1 } from '../scenes/scene1/scene1.js';
import { buildScene2 } from '../scenes/scene2/scene2.js';

import { animateScrollToScenePercent, getSceneScrollY, getScrollPercentForScene, lerp, resizeRendererToContainer, scrollToScenePercent, setActiveBodySceneClass, setActiveSceneObjectVisibility, setBodyClass, setNeighbourSceneGroupVisibility, updateScrollProgressText, } from './helpers.js';

// Creates the shared Three.js renderer, builds all scene groups, and connects scroll/resize/navigation events for the app.
export function initScenes(container) {
    if (!container) return () => {};

    // MAIN SCENE
    const scene = new THREE.Scene();

    // GROUPS
    const scene1group = new THREE.Group();
    const scene2group = new THREE.Group();

    scene.add(scene1group);
    scene.add(scene2group);

    // BUILD SCENES
    const scene1result = buildScene1(scene1group);
    const scene2result = buildScene2(scene2group);

    const pcConfig = scene1result.pcConfig;
    const CPU = scene2result.CPU;

    const sceneGroups = {
        1: scene1group,
        2: scene2group,
    };

    const sceneModels = {
        1: pcConfig,
        2: CPU,
    };
    
    const sceneNumbers = Object.keys(sceneGroups).map(Number);

    // DEFAULT VISIBILITY
    scene1group.visible = true;
    scene2group.visible = false;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 8));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 100);

    // GLOBAL STATE
    let frameId = null;
    let scrollPercent = 0;
    let currentScene = 1; // default start with 1
    let resettingScroll = false;
    let navigatingToScene1 = false;
    let navigationRunId = 0;

    // SCENE 1 STATES

    // camera lerp movement
    const scene1CameraMoveStart = 0.275;
    const scene1CameraMoveEnd = 0.95;

    // positions of pcConfig, camera before movement and after lerp (last) camera position
    const pcConfigPosition = new THREE.Vector3(5, -2.2, 0);
    const cameraStartPos = new THREE.Vector3(2.5, 1, 10);
    const cameraEndPos = new THREE.Vector3(8.9, 1, -2.9);

    const cameraStartLookAt = new THREE.Vector3(2, -2, -3);
    const cameraEndLookAt = new THREE.Vector3(8.9, 1, -2.9);

    const cameraStartFov = 75;
    const cameraEndFov = 90;


    // SCENE 2 STATES
    const scene2CameraStart = new THREE.Vector3(1.6, 1.35, 8);
    const scene2CameraEnd = new THREE.Vector3(-3.6, 1.35, 7.2);
    const scene2CameraLookAt = new THREE.Vector3(-1.15, 0, 0);
    const scene2CameraMoveStart = 0.25;
    const scene2CameraMoveEnd = 0.85;

    let scene2CanvasLocked = false;
    let scene2LockedTop = 0;
    let scene2LockedLeft = 0;
    
    // Applies the active scene state to Three.js groups, main scene models, and body classes in one place.
    function updateActiveSceneState(activeScene) {
        setNeighbourSceneGroupVisibility(sceneGroups, activeScene);
        setActiveSceneObjectVisibility(sceneModels, activeScene);
        setActiveBodySceneClass(activeScene, sceneNumbers);
    }
    
    // Changes the active scene number and refreshes all scene-related visual/body/debug state.
    function setCurrentScene(nextScene) {
        currentScene = nextScene;
        updateActiveSceneState(nextScene);

        if (nextScene !== 1) {
            setBodyClass('scene-1-canvas-locked', false);
        }

        updateScrollProgressText(currentScene, scrollPercent);
    }
    
    // Programmatically moves the document to a percentage inside the current scene while blocking scroll handling during the reset.
    function resetScrollTo(percent) {
        resettingScroll = true;
    
        requestAnimationFrame(() => {
            scrollPercent = scrollToScenePercent(currentScene, percent);
            resettingScroll = false;
            updateScrollProgressText(currentScene, scrollPercent);
        });
    }
    
    // Switches between scenes when the active scene reaches its top/bottom scroll thresholds.
    function scrollLogicDependingOnScene() {
        if (currentScene === 1 && scrollPercent > 0.95) {
            setCurrentScene(2);
            resetScrollTo(0.1);
            return;
        }
    
        if (currentScene === 2 && scrollPercent < 0.05) {
            setCurrentScene(1);
            resetScrollTo(0.95);
            return;
        }
    
    }

    // Main scroll listener: updates scene-local scroll percent, runs scene switch checks, and refreshes debug/canvas lock state.
    function handleScroll() {
        if (resettingScroll) return;

        scrollPercent = getScrollPercentForScene(currentScene);

        if (!navigatingToScene1) {
            scrollLogicDependingOnScene();
        }

        updateScene1CanvasLock();
        updateScrollProgressText(currentScene, scrollPercent);
    }

    // Locks the canvas to the viewport after scene 1 reaches the camera movement phase, controlled through a body class.
    function updateScene1CanvasLock() {
        const shouldLockCanvas = currentScene === 1 && scrollPercent >= scene1CameraMoveStart;

        setBodyClass('scene-1-canvas-locked', shouldLockCanvas);
    }
    
    // Runs scene 1 3D action: keeps PCConfig fixed, then lerps camera position/lookAt/FOV after the configured scroll start.
    function cameraUpdateForScene1() {
        // starting positions
        pcConfig.position.copy(pcConfigPosition);
        camera.position.copy(cameraStartPos);
        camera.lookAt(cameraStartLookAt);
        camera.fov = cameraStartFov;
        camera.updateProjectionMatrix();

        if (scrollPercent < scene1CameraMoveStart) {
            return;
        }

        const t0 = (scrollPercent - scene1CameraMoveStart) / (scene1CameraMoveEnd - scene1CameraMoveStart);
        const t = THREE.MathUtils.clamp(t0, 0, 1);

        camera.position.x = lerp(cameraStartPos.x, cameraEndPos.x, t);
        camera.position.y = lerp(cameraStartPos.y, cameraEndPos.y, t);
        camera.position.z = lerp(cameraStartPos.z, cameraEndPos.z, t);

        const currentLookAt = new THREE.Vector3(
            lerp(cameraStartLookAt.x, cameraEndLookAt.x, t),
            lerp(cameraStartLookAt.y, cameraEndLookAt.y, t),
            lerp(cameraStartLookAt.z, cameraEndLookAt.z, t)
        );

        camera.lookAt(currentLookAt);

        camera.fov = lerp(cameraStartFov, cameraEndFov, t);
        camera.updateProjectionMatrix();
    }

    // Runs scene 2 3D action: keeps the CPU fixed and moves the camera across the X axis during the configured scroll range.
    function cameraUpdateForScene2() {
        const t0 = (scrollPercent - scene2CameraMoveStart) / (scene2CameraMoveEnd - scene2CameraMoveStart);
        const t = THREE.MathUtils.clamp(t0, 0, 1);

        camera.position.x = lerp(scene2CameraStart.x, scene2CameraEnd.x, t);
        camera.position.y = scene2CameraStart.y;
        camera.position.z = lerp(scene2CameraStart.z, scene2CameraEnd.z, t);
        camera.lookAt(scene2CameraLookAt);
    }
    
    // Runs the correct camera update for the active scene and renders the shared Three.js scene on every frame.
    function animate() {
        frameId = requestAnimationFrame(animate);

        if (currentScene === 1) {
            renderer.setClearColor(0x000000, 0);
            cameraUpdateForScene1();
        }

        if (currentScene === 2) {
            renderer.setClearColor(0x000000, 0);
            cameraUpdateForScene2();
        }

        renderer.render(scene, camera);
    }
    
    // Resize listener: updates renderer size and camera aspect whenever the canvas container or browser size changes.
    function resize() {
        const dimensions = resizeRendererToContainer(container, camera, renderer);
        width = dimensions.width;
        height = dimensions.height;
    
        if (scene2CanvasLocked) {
            container.style.width = `${width}px`;
            container.style.height = `${height}px`;
            container.style.left = `${scene2LockedLeft}px`;
            container.style.top = `${scene2LockedTop}px`;
        }
    }
    
    // Recalculates scene-switch state after each custom scroll frame so camera movement, canvas lock, and debug text follow the animation.
    function syncScrollStateForNavigation() {
        scrollPercent = getScrollPercentForScene(currentScene);
        updateScene1CanvasLock();
        updateScrollProgressText(currentScene, scrollPercent);
    }

    // Coordinates the navbar return: scrolls the current scene to its top, switches to scene 1 at percent 0.95, then scrolls scene 1 to its top.
    async function navigateToScene1() {
        const runId = ++navigationRunId;
        const isCurrentRun = () => runId === navigationRunId;
        navigatingToScene1 = true;

        if (currentScene === 1) {
            await animateScrollToScenePercent(1, 0, 1200, isCurrentRun, syncScrollStateForNavigation);

            if (!isCurrentRun()) return;

            scrollPercent = getScrollPercentForScene(1);
            navigatingToScene1 = false;
            handleScroll();
            return;
        }

        const sceneBeforeNavigation = currentScene;

        // 1 Smooth custom scroll to the top of the current scene before changing layout.
        await animateScrollToScenePercent(sceneBeforeNavigation, 0, 900, isCurrentRun, syncScrollStateForNavigation);

        if (!isCurrentRun()) return;

        // 2 Instant logical switch to scene 1 near its bottom; this layout jump is deliberate and hidden between animations.
        resettingScroll = true;
        setCurrentScene(1);
        window.scrollTo(0, getSceneScrollY(1, 0.95));
        scrollPercent = getScrollPercentForScene(1);
        updateScene1CanvasLock();
        updateScrollProgressText(currentScene, scrollPercent);

        await new Promise((resolve) => requestAnimationFrame(resolve));

        if (!isCurrentRun()) {
            resettingScroll = false;
            return;
        }

        resettingScroll = false;

        // 3 Smooth custom scroll through scene 1 so its camera lerp returns naturally from 0.95 to 0.
        await animateScrollToScenePercent(1, 0, 1300, isCurrentRun, syncScrollStateForNavigation);

        if (!isCurrentRun()) return;

        scrollPercent = getScrollPercentForScene(1);
        navigatingToScene1 = false;
        handleScroll();
    }
    
    // Receives global navigation events from the navbar and routes scene 1 requests to navigateToScene1().
    function handleSceneNavigation(event) {
        if (event.detail?.scene !== 1) return;
    
        event.preventDefault();
        navigateToScene1();
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', resize);
    window.addEventListener('insidepc:navigate-scene', handleSceneNavigation);
    
    scrollToScenePercent(1, 0);
    setCurrentScene(1);
    handleScroll();
    animate();
    
    // Cleanup function used by React effect cleanup to stop animation/events and dispose the renderer on unmount.
    return () => {
        navigationRunId += 1;
        cancelAnimationFrame(frameId);
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', resize);
        window.removeEventListener('insidepc:navigate-scene', handleSceneNavigation);
    
        if (renderer.domElement && renderer.domElement.parentNode === container) {
            container.removeChild(renderer.domElement);
        }
    
        renderer.dispose();
    };
}
