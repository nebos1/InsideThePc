// Additional scripts in the scene 1 that are not related to the 3D model, but to the UI and interactions of the scene

// Fades the scene 1 heading out between two viewport-based scroll points; used by scene1.jsx for the H1 intro text.
export function fadeOutH1OnScroll(start = 5, end = 30) {
    const scene1Heading = document.querySelector('#scene-1 h1');
    if (!scene1Heading) return undefined;

    // Recalculates and applies the heading opacity on each scroll event based on the configured start/end range.
    function updateOpacity() {
        const startY = (start * window.innerHeight) / 100;
        const endY = (end * window.innerHeight) / 100;

        if (window.scrollY <= startY) {
            scene1Heading.style.opacity = '1';
            return;
        }

        if (window.scrollY >= endY) {
            scene1Heading.style.opacity = '0';
            return;
        }

        const progress = (window.scrollY - startY) / (endY - startY);
        scene1Heading.style.opacity = (1 - progress).toFixed(2);
    }

    updateOpacity();
    window.addEventListener('scroll', updateOpacity, { passive: true });

    // Cleanup function used by React's effect cleanup to remove the scroll listener when scene 1 unmounts.
    return () => {
        window.removeEventListener('scroll', updateOpacity);
    }
}
