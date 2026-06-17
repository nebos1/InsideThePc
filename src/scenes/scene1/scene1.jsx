import { useEffect } from 'react';
import './scene1.css';
import { fadeOutH1OnScroll } from './script1.js';

function scene1() {
    useEffect(() => fadeOutH1OnScroll(5, 30), []);

    return (
        <>
            <section id="scene-1" className="scene scene-1">
                <div>
                    <div id="space-before-h1" />
                    <h1>Explore the digital world !</h1>
                    <div id="space-after-h1" />
                </div>

                {/*canvas DOM for THREE starts here for scene 1*/}                
                <div id="scene-1-pcconfig-stage" aria-hidden="true" />

                <div className="scene-1-scroll-anchor" aria-hidden="true" />
            </section>
        </>
    );
}

export default scene1;
