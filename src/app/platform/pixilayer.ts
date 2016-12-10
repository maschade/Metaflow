import { RenderLayer, ViewModelRenderer, Quality, Diagram } from "../common/layer";
import { ViewGroup, ViewItem, ViewVertex } from "../common/viewmodel";
import { Camera, CameraObserver } from "../common/camera";
import { XText, Mapper } from './render';

/**
 * Implements a pixi.js graph layer system.
 *
 * @author Martin Schade
 * @since 1.0.0
 */
export class PixiLayer implements RenderLayer, CameraObserver {
    
    readonly camera: Camera;

    /**
     * The full scene to be drawn.
     */
    private scene: PIXI.Container;
    
    /**
     * All node shapes.
     */
    private nodes: PIXI.Container;

    /**
     * 
     */
    private world: PIXI.Container;

    /**
     * 
     */
    private overlay: PIXI.Container;

    /**
     * 
     */
    private edges: PIXI.Container;

    /**
     * 
     */
    private labels: PIXI.Container;

    private active = true;

    private renderer: PIXI.SystemRenderer;
    private mapper: Mapper;
    private quality: Quality;
    private frames: number;
    private cachedGroups: ViewGroup[];

    getCamera(): Camera {
        return this.camera;
    }

    setQuality(quality: Quality) {
        if (quality < 0 || quality > 1) return;
        this.quality = quality;
        this.frames = 1000 / (60 * quality);
    }

    setActive(active: boolean) {

    }

    isActive() {
        return true;
    }
    
    hitTest(worldX: number, worldY: number): Array<ViewVertex> {
        let hits = [];

        return hits;
    }

    private update(level: ViewGroup) {
        this.nodes.removeChildren();
        this.labels.removeChildren();
        let leafs = new PIXI.Graphics();

        // first level
        let mapper = this.mapper;
        mapper.renderGroup(level, true, false);

        // second levels
        this.cachedGroups = [];
        let contents = level.contents;
        let length = contents.length;
        for (let i = 0; i < length; i++) {
            let item = contents[i];
            if (!item.isLeaf()) {
                let itm = item as ViewGroup;
                this.cachedGroups.push(itm);
                if (itm.contents && itm.contents.length > 0) {
                    mapper.renderGroup(itm, false, true);
                    /*
                    let subleafs = new PIXI.Graphics();
                    itm.contents.forEach(it => {
                        if (!it.isLeaf()) {
                            mapper.renderGroup(it as ViewGroup, false, true);
                        } else if (it.isLeaf()) {
                            mapper.renderItem(it as ViewItem, subleafs);
                        }
                        mapper.attach(it, itm);
                    });
                    */
                } else {
                    mapper.renderGroup(itm, false, true);
                }
            } else {
                mapper.renderItem(item as ViewItem, leafs);
            }

            mapper.renderLabels(item);
            if (item.labels) this.labels.addChild(item.labels);
            mapper.attach(item, level);
        }
        this.attachNode(level);
    }

    /** 
     * Simply issue drawing commands.
     */
    onViewResized() {
        let renderer = this.renderer;
        let width = this.camera.visualWidth;
        let height = this.camera.visualHeight;
        renderer.resize(width, height);
        if (this.active) renderer.render(this.scene);
    }

    /**
     * Simply issue drawing commands.
     * @param posX
     * @param posY
     */
    onPanChanged(posX: number, posY: number) {
        if (this.active) this.renderer.render(this.scene);
    }

    /**
     * Simply issue drawing commands.
     * @param zoom
     */
    onZoomChanged(zoom: number) {
        if (this.active) this.renderer.render(this.scene);
    }

    initialize(diagram: Diagram) {
        diagram.camera.subscribe(this);
        diagram.scope.subscribe(it => this.update(it));
    }

    private attachNode(level: ViewGroup) {
        this.nodes.addChild(level.visual);
    }

    constructor(element: HTMLCanvasElement) {
        this.scene = new PIXI.Container();

        /* overlays */
        // this.overlay = new PIXI.Container();
        this.labels = new PIXI.Container(); /*new PIXI.ParticleContainer(2000, {
            scale: true,
            position: true,
            rotation: false,
            uvs: false,
            alpha: false,
        });*/
        this.overlay = this.labels;

        /* worlds */
        // this.world = new PIXI.Container();
        // this.edges = new PIXI.Container();
        this.nodes = new PIXI.Container();
        this.world = this.nodes;

        /* assemble in order of rendering */
        // this.overlay.addChild(this.labels);
        // this.world.addChild(this.nodes);
        // this.world.addChild(this.edges);
        this.scene.addChild(this.world);
        this.scene.addChild(this.overlay);

        this.camera = new PixiCamera(this.world, this.overlay);
        this.mapper = new Mapper();

        this.renderer = new PIXI.WebGLRenderer(element.width, element.height, {
            antialias: true,
            transparent: true,
            resolution: 1.0,
            view: element
        });
    }
}

/**
 * Provides a pan-zoom surface for the PIXI renderer.
 *
 * TODO: Implement a LOD vs Text scaling loop
 * TODO: Combine with group caching etc.
 * TODO: No scaling if animating / rate limiting
 *
 * @author Martin Schade
 * @since 1.0.0
 */
export class PixiCamera extends Camera {

    private worldScale = this.world.scale;
    private worldPosition = this.world.position;
    private overlayPosition = this.overlay.position;
    private overlayScale = this.overlay.scale;

    protected translateWorldTo(tX: number, tY: number) {
        this.worldPosition.set(tX, tY);
        this.overlayPosition.set(tX, tY);
    }

    protected scaleWorldTo(zoom: number, last: number) {
        this.worldScale.set(zoom, zoom);
        this.overlayScale.set(zoom, zoom);

        let lbs = this.overlay.children as XText[];
        for (let i = 0, len = lbs.length; i < len; i++) {
            let label = lbs[i];
            let s = label.baseScale / zoom;
            label.scale.set(s, s);
            label.visible = (s < label.upperScale)
        }
    }

    constructor(
        private world: PIXI.Container,
        private overlay: PIXI.Container) {
        super();
    }
}

/**
 * A configuration object for the pixi layer system.
 * 
 * @author Martin Schade
 * @since 1.0.0
 */
class PixiConfig {
    labelResolution = 0.6
    backgroundStrength = 8
    baseScale = 0.5
    labelBatchSize = 500
} 