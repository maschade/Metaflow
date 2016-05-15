import {Component, Inject} from '@angular/core';
import PaletteRegistry from "../../../services/palettes";

@Component({
    selector: 'palette',
    template: require('./palette.html'),
    styles: [require('./palette.scss')]
})
export default class Palette {
    categories: Array<string>;
    
    constructor(@Inject(PaletteRegistry) registry: PaletteRegistry) {
        this.categories = registry.getPalettes();
    }
}