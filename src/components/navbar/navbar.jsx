import './navbar.css';
import logo from '../../assets/logo/logo.png';

function requestScene1Scroll() {
    window.dispatchEvent(new CustomEvent('insidepc:navigate-scene', {
        detail: { scene: 1 },
    }));
}

function navbar() {
    return (
        <nav className="navbar">
            
            <button className = "logo" type="button" onClick={requestScene1Scroll}>
                <img src={logo} className="logo" alt="" />
            </button>

            <span className="divider" aria-hidden="true" />

            <button className="title" type="button" onClick={requestScene1Scroll}>
                Inside the PC
            </button>

        </nav>
    );
}
export default navbar;
