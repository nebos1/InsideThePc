// Helper functions used by scene-switch.js for scroll math, renderer sizing, scene visibility, and small DOM state updates.

// Returns a value between two numbers based on t, where t is usually a normalized scroll value from 0 to 1.
export function lerp (a, b, t) {
    return a + (b - a) * t;
}

// Returns the total scrollable distance of the page; useful when logic needs full-document scroll measurements.
export function getMaxScroll() {
    return document.documentElement.scrollHeight - document.documentElement.clientHeight;
}

// Calculates how far the user has scrolled inside one scene, returning a clamped value from 0 to 1 for scene-switch logic.
export function getScrollPercentForScene(sceneNumber) {
    const sceneElement = document.getElementById(`scene-${sceneNumber}`);

    if (!sceneElement) return 0;

    const sceneTop = sceneElement.offsetTop;
    const sceneHeight = sceneElement.scrollHeight;
    const viewportHeight = window.innerHeight;

    const maxSceneScroll = Math.max(sceneHeight - viewportHeight, 1);
    const sceneScrollTop = window.scrollY - sceneTop;

    return clamp01(sceneScrollTop / maxSceneScroll);
}

// Scrolls the page to a specific percent inside a specific scene and returns the clamped percent that was applied.
export function scrollToScenePercent(sceneNumber, percent, behavior = 'auto') {
    const sceneElement = document.getElementById(`scene-${sceneNumber}`);

    if (!sceneElement) return 0;

    const nextPercent = clamp01(percent);

    const sceneTop = sceneElement.offsetTop;
    const sceneHeight = sceneElement.scrollHeight;
    const viewportHeight = window.innerHeight;

    const maxSceneScroll = Math.max(sceneHeight - viewportHeight, 1);

    window.scrollTo({ top: sceneTop + maxSceneScroll * nextPercent, behavior });

    return nextPercent;
}

// Calculates the document Y coordinate for a percent inside a scene; scene-switch.js uses it for navbar navigation targets.
export function getSceneScrollY(sceneNumber, percent) {
    const sceneElement = document.getElementById(`scene-${sceneNumber}`);

    if (!sceneElement) return window.scrollY || window.pageYOffset || 0;

    const nextPercent = clamp01(percent);
    const sceneTop = sceneElement.offsetTop;
    const sceneHeight = sceneElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    const maxSceneScroll = Math.max(sceneHeight - viewportHeight, 1);

    return sceneTop + maxSceneScroll * nextPercent;
}

// Keeps the custom navbar scroll animation linear by returning its normalized progress unchanged.
export function linearScrollProgress(progress) {
    return progress;
}

// Animates the page to an exact document Y coordinate and calls onFrame after every scroll update so scene state stays synchronized.
export function animateScrollToY(
    targetY,
    duration = 900,
    shouldContinue = () => true,
    onFrame = () => {}
) {
    return new Promise((resolve) => {
        const startY = window.scrollY || window.pageYOffset || 0;
        const distance = targetY - startY;
        const startTime = performance.now();

        if (!shouldContinue()) {
            resolve(false);
            return;
        }

        if (duration <= 0 || distance === 0) {
            window.scrollTo(0, targetY);
            onFrame();
            resolve(true);
            return;
        }

        // Executes one animation frame, stopping immediately when a newer navbar navigation cancels this run.
        function step(now) {
            if (!shouldContinue()) {
                resolve(false);
                return;
            }

            const elapsed = now - startTime;
            const rawProgress = Math.min(elapsed / duration, 1);
            const progress = linearScrollProgress(rawProgress);

            window.scrollTo(0, startY + distance * progress);
            onFrame();

            if (rawProgress < 1) {
                requestAnimationFrame(step);
                return;
            }

            window.scrollTo(0, targetY);
            onFrame();
            resolve(true);
        }

        requestAnimationFrame(step);
    });
}

// Converts a scene percent to a document Y coordinate and runs the custom scroll animator used by navigateToScene1().
export function animateScrollToScenePercent(
    sceneNumber,
    percent,
    duration = 900,
    shouldContinue = () => true,
    onFrame = () => {}
) {
    const targetY = getSceneScrollY(sceneNumber, percent);
    return animateScrollToY(targetY, duration, shouldContinue, onFrame);
}

// Keeps the Three.js renderer and camera aspect ratio matched to the current canvas container size.
export function resizeRendererToContainer(container, camera, renderer) {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    return { width, height };
}

// Adds the active body scene class, such as scene-1 or scene-2, and removes inactive scene classes.
export function setActiveBodySceneClass(activeScene, sceneNumbers) {
    sceneNumbers.forEach((sceneNumber) => {
        document.body.classList.toggle(`scene-${sceneNumber}`, sceneNumber === activeScene);
    });
}

// Toggles one body class from scene-switch.js, used for state flags like locking the scene 1 canvas.
export function setBodyClass(className, isActive) {
    document.body.classList.toggle(className, isActive);
}

// Checks whether a scene is the active scene or directly beside it, so neighbour scenes can stay prepared/rendered.
export function isSceneNeighbour(sceneNumber, activeScene) {
    return Math.abs(sceneNumber - activeScene) <= 1;
}

// Applies neighbour visibility to Three.js scene groups, keeping the active scene and its neighbours visible.
export function setNeighbourSceneGroupVisibility(sceneGroups, activeScene) {
    Object.entries(sceneGroups).forEach(([sceneNumber, group]) => {
        group.visible = isSceneNeighbour(Number(sceneNumber), activeScene);
    });
}

// Makes only the active scene's main model/object visible while keeping non-active neighbour groups available.
export function setActiveSceneObjectVisibility(sceneObjects, activeScene) {
    Object.entries(sceneObjects).forEach(([sceneNumber, object]) => {
        object.visible = Number(sceneNumber) === activeScene;
    });
}

// Updates the debug scroll text in the bottom-right corner so scene-switch.js can show the current scene and percent.
export function updateScrollProgressText(currentScene, scrollPercent) {
    const info = document.getElementById('scroll-progress');

    if (info) {
        info.textContent = `SCENE: ${currentScene} | SCROLL: ${(scrollPercent * 100).toFixed(1)}%`;
    }
}

// Keeps percent-based values inside the valid 0 to 1 range before they are used by scroll and lerp logic.
function clamp01(value) {
    return Math.min(Math.max(value, 0), 1);
}
