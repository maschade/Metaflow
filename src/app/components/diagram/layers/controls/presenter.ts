import {Component, EventEmitter, Output} from '@angular/core';
import {Layer, Diagram} from "../../../../common/layer";
import {ViewGroup} from "../../../../common/viewmodel";
import {Camera} from "../../../../common/camera";
/**
 * Diagramming overlay controls. 
 * 
 * @author Martin Schade    
 * @since 1.0.0
 */
@Component({
    selector: 'presenter',
    styles: [require('./presenter.scss')],
    template: require('./presenter.html'),
})
export default class Presenter implements Layer {
    private showControls = true;

    diagram : Diagram;
    
    initialize(diagram: Diagram) {
        this.diagram = diagram;
        diagram.model.subscribe(it => {
            this.showControls = (it && it.root) ? true : false;
        });
    }

    setActive(active: boolean) {

    }

    isActive() {
        return true;
    }

    private onZoomIn(event: MouseEvent) {
        let c = this.diagram.camera;
        let x = c.centerX;
        let y = c.centerY;
        let s = c.scale;
        c.zoomAndMoveTo(1.05 * s, x / s, y / s);
    }

    private onZoomOut(event: MouseEvent) {

    }

    private onFitIn(event: MouseEvent) {

    }
}
