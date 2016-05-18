import {Injectable} from '@angular/core';
import {PlatformLayer} from "../common/platform";
import {PixiLayer} from "../common/platform/pixi";

/**
 * Service which provides the underlying rendering platform.
 * @author Martin Schade
 * @since 1.0.0
 */
@Injectable()
export class PlatformService {

    /**
     * Retrieve a newly initialized rendering layer, which
     * will be added to the DOM.
     * @param element A html canvas element. Currently only canvas is supported.
     * @returns {IPlatformLayer}
     */
    getPlatform(element: HTMLCanvasElement): PlatformLayer {
        return new PixiLayer(element);
    }
}
