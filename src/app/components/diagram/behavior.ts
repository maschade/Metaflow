import {Camera} from '../../common/camera';
import {ViewGroup, ViewVertex} from '../../common/viewmodel';
import {Animation} from '../../common/animations';
import Kinetics from '../../common/kinetics';
import DiagramImpl from './diagram';

/**
 * All possible diagram events.
 * 
 * @author Martin Schade
 * @since 1.0.0
 */
export interface DiagramEvents {

    /**
     * Handle a target event.
     */
    handleNavigation(vertex: ViewVertex);

    /**
     * Handle a single/double click.
     */
    handleClick(x: number, y: number, double: boolean);

    /**
     * 
     */
    handleMouseDown(x: number, y: number);

    /**
     * 
     */
    handleMouseMove(x: number, y: number);

    /**
     * 
     */
    handleMouseUp(x: number, y: number);

    /**
     * 
     */
    handleZoom(x: number, y: number, f: number);

    /**
     * Handle a key event.
     */
    handleKey(event: KeyboardEvent);

    /**
     * Force the immediate cancellation of the current's states acitivites.
     * Mainly used for recovery of the state machinery.
     */
    handleAbort();

    /**
     * Notify the state that is should terminate, but does not need to.
     */
    handleStop();
}

/**
 * Diagram state definition.
 * 
 * @author Martin Schade
 * @since 1.0.0
 */
export interface DiagramState extends DiagramEvents {

    name: string;

    /**
     * Enter the state and execute it's initialization.
     * @param params Optional initialization parameters.
     */
    enterState(params?: any);
 
    /**
     * Exit the current state and perform cleanup.
     */
    leaveState();
}

/**
 * State machine interface.
 * 
 * @author Martin Schade
 * @since 1.0.0
 */
export interface StateMachine {

    /**
     * Execute a state transition.
     * @param state The state to go to. An empty string will do nothing.
     * @param params
     */
    goto(state: string, params?: any);

    /**
     * Reenter the current state with different or no parameters.
     */
    reenter(params?: any);

    /**
     * Return the current state.
     */
    currentState(): string;

    /**
     * Return the last state from history.
     */
    lastState(): string;

    /**
     * Return the list of names which are
     * supported by this state machine.
     */
    supportedStates(): Array<string>;
}


/**
 * The state machine for the diagramming view.
 * Simply delegates all events to the currently active state.
 * 
 * @author Martin Schade
 * @since 1.0.0
 */
export default class DiagramBehavior implements StateMachine, DiagramEvents {
    
    private current: DiagramState;
    private last: DiagramState;
    private states: Array<DiagramState>;
    private lookup: any;
    private debug = false;

    currentState(): string {
        return this.current.name;
    }

    lastState(): string {
        return this.last.name;
    }

    supportedStates(): Array<string> {
        return ['idle', 'panning', 'animating'];
    }

    handleNavigation(vertex: ViewVertex) {
        this.current.handleNavigation(vertex);
    }

    handleClick(x: number, y: number, double: boolean) {
        this.current.handleClick(x, y, double);
    }

    handleMouseDown(x: number, y: number) {
        this.current.handleMouseDown(x, y);
    }

    handleMouseMove(x: number, y: number) {
        this.current.handleMouseMove(x, y);
    }

    handleMouseUp(x: number, y: number) {
        this.current.handleMouseUp(x, y);
    }

    handleZoom(x: number, y: number, f: number) {
        this.current.handleZoom(x, y, f);
    }

    handleKey(event: KeyboardEvent) {
        this.current.handleKey(event);
    }

    handleAbort() {
        this.current.handleAbort();
    }

    handleStop() {
        this.current.handleStop();
    }

    goto(state: string, params?: any) {
        let newState = this.lookup[state];
        if (newState) {
            if (this.current) {
                this.current.leaveState();
            }
            this.last = this.current;
            this.current = newState;
            newState.enterState(params);

            if (this.debug) {
                console.log('diagram state: ' + state);
            }
        } else if (this.debug) {
            console.log(`diagram state '${state}' not found`);
        }
    }

    reenter(params?: any) {
        this.current.leaveState();
        this.current.enterState(params);
    }

    constructor(private diagram: DiagramImpl) {
        this.lookup = Object.create(null);
        this.states = [
            new Idle('idle', this, diagram),
            new Panning('panning', this, diagram),
            new Animating('animating', this, diagram)
        ];
        this.states.forEach(it => {
           this.lookup[it.name] = it;
        });

        /* Initial state */
        this.goto('idle', null);
        this.lastState = this.lookup['idle'];
    }
}

/**
 * Base state which contains reused state data.
 * @author Martin Schade
 * @since 1.0.0
 */
abstract class BaseState implements DiagramState {

    public name: string;
    protected camera: Camera;

    protected limits = {
        left: -800,
        top: -800,
        right: 2800,
        bottom: 2800
    };

    protected becomeIdle() {
        this.behavior.goto('idle');
    }

    enterState(params?: any) { /* ignore*/ }

    leaveState() { /* ignore*/ }

    handleNavigation(vertex: ViewVertex) { /* ignore */ }

    handleClick(x: number, y: number, double: boolean) { /* ignore*/ }

    handleMouseDown(x: number, y: number) { /* ignore*/ }

    handleMouseMove(x: number, y: number) { /* ignore*/ }

    handleMouseUp(x: number, y: number) { /* ignore*/ }

    handleZoom(x: number, y: number, f: number) { /* ignore */ }

    handleKey(event: KeyboardEvent) { /* ignore */ }

    handleAbort() { /* ignore */ }

    handleStop() { /* ignore */ }

    constructor(name: string, protected behavior: DiagramBehavior, protected diagram: DiagramImpl) {
        this.name = name;
        this.camera = diagram.camera;
    }
}

/**
 * Idle state.
 * 
 *  TODO hover effect
 *  TODO connection hover effect
 *  TODO click, the show info
 *  TODO border preview
 *  TODO border hover effect
 *  TODO lenses (?)
 *  TODO hand off descent detection & level loading to worker
 * 
 * @author Martin Schade
 * @since 0.6.0
 */
class Idle extends BaseState {

    private maxZoom = 10;

    /**
     * TODO detect (drag | pan | draw | select)
     */
    handleMouseDown(x: number, y: number) {
        this.behavior.goto('panning', { x: x, y: y });
    }

    handleNavigation(vertex: ViewVertex) {
        this.behavior.goto('animating', { 
            interpolator: Animation.navigateToItem(
                this.camera, 
                this.diagram.zoomPanPreference, 
                this.diagram.navigationVelocity, 
                vertex
            )});
    }

    handleClick(x: number, y: number, double: boolean) {
        if (double) {
            /*
                TODO: Check if border or diagram
                TODO: Check if something was double-clicked
                TODO: If nothing, check for nearest items within radius
                        if one -> zoom in
                        if many -> show selection for zooming
                        if none -> show click effect // navigateTo with current width // zoom in
            */
            this.behavior.goto('animating', {
                interpolator: Animation.navigateTo({
                    targetX: this.camera.castRayX(x),
                    targetY: this.camera.castRayY(y),
                    velocity: this.diagram.navigationVelocity,
                    panZoom: this.diagram.zoomPanPreference,
                    targetWidth: this.getAppropriateScale(),
                    camera: this.camera
                })
            });
        } else {
            if (!this.diagram.scope.current) return;
            
            this.behavior.goto('animating', {
                interpolator: Animation.navigateToItem(
                    this.diagram.camera, 
                    this.diagram.zoomPanPreference, 
                    this.diagram.navigationVelocity,
                    this.diagram.scope.current)
            });
            /*
                TODO: Check if something was selected
                        if one -> show in explorer
                        if many -> overlaps ? show selection within radius
                TODO: Check if border or diagram
            */
        }
    }

    handleZoom(x: number, y: number, units: number) {
        let zoom = this.camera.scale;
        let factor = Math.pow(1.002, units);
        let target = factor * zoom;

        if (true /* !this.detectAndDoSwitch() */) {
            if (this.diagram.respectLimits) {
                let maxZoom = this.maxZoom;
                if (target >= maxZoom) {
                    target = maxZoom;
                } else {
                    const limits = this.limits;
                    const w = this.camera.visualWidth;
                    const h = this.camera.visualHeight;
                    const l = limits.right - limits.left;
                    const d = limits.bottom - limits.top;
                    const limit = (w > h) ? w / l : h / d;
                    target = (target <= limit) ? limit : target;
                }
            }

            this.camera.zoomToAbout(target,
                this.camera.castRayX(x),
                this.camera.castRayY(y)
            );
        }
    }

    /**
     * TODO change target width to level specific width scale.
     */
    private getAppropriateScale(level?: ViewGroup): number {
        return 1000;
    }
}

/**
 * Panning state.
 *  TODO drag vs pan vs connect vs
 *  TODO kinetics
 *  TODO banding
 *  TODO limit changing on level switch
 * 
 * @author Martin Schade
 * @since 0.6.1
 */
class Panning extends BaseState {

    protected anchorX = 0.0;
    protected anchorY = 0.0;
    protected pressedX = 0.0;
    protected pressedY = 0.0;
    protected kinetics: Kinetics;

    private left = false;
   	private right = false;
    private bottom = false;
    private top = false;

    enterState(params?: any) {
        this.kinetics = this.kinetics || new Kinetics();

        if (params) {
            this.handleMouseDown(
                params.x || 0,
                params.y || 0
            );
        }
    }

    leaveState() {
        this.kinetics.reset();
        this.anchorX = 0.0;
        this.anchorY = 0.0;
        this.pressedX = 0.0;
        this.pressedY = 0.0;
        this.resetViolations();
    }

    handleMouseDown(x: number, y: number) {
        this.pressedX = x;
        this.pressedY = y;
        this.anchorX = this.camera.cameraX;
        this.anchorY = this.camera.cameraY;
    }

    handleMouseMove(x: number, y: number) {
        const dragX = this.pressedX - this.anchorX - x;
        const dragY = this.pressedY - this.anchorY - y;

        let limitX = dragX, limitY = dragY;

        if (this.diagram.respectLimits) {
            limitX = this.handleLimits(true, dragX);
            limitY = this.handleLimits(false, dragY);
        }

        if (this.diagram.useKinetics) {
            this.kinetics.update(dragX, dragY);
        }

        this.camera.moveTo(limitX, limitY);
    }

    handleMouseUp(x: number, y: number) {
        if (this.isBanding()) {
            if (this.diagram.animatedNavigation) {
                const ca = this.camera;
                const wX = ca.worldX, wW = wX + ca.projWidth;
                const wY = ca.worldY, wH = wY + ca.projHeight;
                const dx = this.calcDisplacement(true, wX, wW);
                const dy = this.calcDisplacement(false, wY, wH);
                this.behavior.goto('animating', {
                    forced: false, interpolator: Animation.centerOnWorld(
                        wX + ca.projWidth / 2 - dx,
                        wY + ca.projHeight / 2 - dy,
                        300, this.camera
                    )
                });
            } else {
                this.becomeIdle();
            }
        } else if (this.isKinetic()) {
            this.behavior.goto('animating', {
                forced: false,
                interpolator: Animation.throwCamera(
                    this.camera,
                    this.kinetics.speed,
                    this.kinetics.angle,
                    333
                )
            });
        } else {
            this.becomeIdle();
        }
    }

    private resetViolations() {
        this.left = false;
        this.right = false;
        this.bottom = false;
        this.top = false;
    }

    private adjustLimit(level: ViewGroup) {
        let limits = this.limits;
        const widthSpan = 0.9 * level.width;
        const heightSpan = 0.9 * level.height;
        limits.left = level.left - widthSpan;
        limits.top = level.top - heightSpan;
        limits.bottom = level.left + level.height + heightSpan;
        limits.right = level.left + level.width + widthSpan;
    }

    private calcDisplacement(horizontal: boolean, min: number, max: number) {
        let v = this, limit = this.limits;
        let lower = horizontal ? v.left : v.top;
        let upper = horizontal ? v.top : v.bottom;
        let left = horizontal ? limit.left : limit.top;
        let right = horizontal ? limit.right : limit.bottom;
        return lower ? min - left : upper ? max - right : 0;
    }

    private isBanding(): boolean {
        let v = this;
        return (this.diagram.rubberBanding && (v.left || v.right || v.bottom || v.top));
    }

    private isKinetic(): boolean {
        return (this.diagram.useKinetics && this.kinetics.hasEnoughMomentum());
    }

    private damp(actual: number, limit: number): number {
        let ratio = Math.abs(actual / limit);
        return 1 + Math.log10(ratio || 1);
    }

    private updateBanding(horizontal: boolean, lower: boolean, value: boolean) {
        if (horizontal) {
            if (lower) { 
                this.left = value; 
            } else { 
                this.right = value;
            }
        } else {
            if (lower) { 
                this.top = value; 
            } else { 
                this.bottom = value; 
            }
        }
    }

    private handleLimits(horizontal: boolean, drag: number): number {
        const cam = this.camera, limit = this.limits;
        const min = horizontal ? cam.worldX : cam.worldY;
        const wid = horizontal ? cam.projWidth : cam.projHeight;
        const lower = horizontal ? limit.left : limit.top;
        const higher = horizontal ? limit.right : limit.bottom;
        const band = this.diagram.rubberBanding;
        const scale = cam.scale, max = min + wid;

        if (min <= lower) {
            if (band) {
                this.updateBanding(horizontal, true, true);
                const factor = this.damp(drag / scale, lower);
                return factor * lower * scale;
            } else {
                return lower + 1;
            }
        } else {
            this.updateBanding(horizontal, true, false);
        }

        if (max >= higher) {
            if (band) {
                this.updateBanding(horizontal, false, true);
                const factor = this.damp(drag / scale + wid, higher);
                return (factor * higher - wid) * scale;
            } else {
                return higher - 1;
            }
        } else {
            this.updateBanding(horizontal, false, false);
        }

        return drag;
    }
}

/**
 * Animation parameter interface.
 */
export interface AnimationParams {
    forced: boolean;
    interpolator: Animation;
    easing: (number) => number;
}

/**
 * Animation state
 *  TODO interaction with banding
 */
class Animating extends BaseState {

    private forceAnimation = false;
    private animation: Animation;

    handleZoom(x, y, f) {
        if (!this.forceAnimation) {
            this.becomeIdle();
            this.behavior.handleZoom(x, y, f);
        }
    }

    handleMouseDown(x, y) {
        if (!this.forceAnimation) {
            this.behavior.goto('panning');
            this.behavior.handleMouseDown(x, y);
        }
    }

    handleStop() {
        if (!this.forceAnimation) {
            this.becomeIdle();
        }
    }

    handleAbort() {
        this.becomeIdle();
    }

    leaveState() {
        if (this.animation) {
            this.animation.stop();
            this.animation = undefined;
        }
    }

    enterState(params?: AnimationParams) {
        if (params) {
            this.forceAnimation = params.forced || false;
            this.animation = params.interpolator;
            this.animation.onFinished = () => this.becomeIdle();
            this.animation.play();
        } else {
            this.becomeIdle();
        }
    }

}

/**
 * Paint-like state.
 *  TODO startDrawing event
 *  TODO connect with palette
 *  TODO connect with editor
 *  TODO visual preview
 */
class Drawing extends Panning {

}

/**
 * Node drag state.
 *  TODO singular drag
 *  TODO multiple drag
 *  TODO node effect on possible drag
 */
class Dragging extends Panning {

}

/**
 * Edge drag state.
 *  TODO edge drag
 *  TODO visual connection effect
 */
class Connecting extends Panning {

}

/**
 * Selection state.
 *  TODO single click
 *  TODO rectangular selection
 *  TODO lasso selection
 *  TODO circular selection
 *  TODO pie selection
 *  TODO visual overlay effect
 */
class Selecting extends Panning {

}


/**
 * Property editing state.
 *  TODO edit detection
 *  TODO input overlay (else ?)
 */
class Editing extends BaseState {

}
