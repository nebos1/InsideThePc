import { createElement, useEffect, useRef } from 'react';

import './App.css';
import scene1 from './scenes/scene1/scene1.jsx';
import scene2 from './scenes/scene2/scene2.jsx';
import navbar from './components/navbar/navbar.jsx';
import { initScenes } from './engine/scene-switch.js';

function app() {
    const sceneContainer = useRef(null);

    useEffect(() => {
        if (!sceneContainer.current) return undefined;

        return initScenes(sceneContainer.current);
    }, []);

    return (
        <>
            {createElement(navbar)}

            <span id="scroll-progress" aria-hidden="true" />

            <main id="scenes">

                <div id="canvas-layer" aria-hidden="true">
                    <div id="canvas-container" ref={sceneContainer} />
                </div>

                {createElement(scene1)}
                {createElement(scene2)}
            </main>
        </>
    );
}

export default app;
