import {Injectable} from "@angular/core";
import {ViewGroup, ViewItem} from "../common/viewmodel";
import {Style, GroupStyle} from '../common/styling';
import {Shape, ShapeType} from '../common/shapes';
import ShapeRenderer from '../platform/render';

/**
 * Model provider service.
 *
 * @author Martin Schade
 * @since 1.0.0
 */
@Injectable()
export default class ModelService {
    
    private model: ViewGroup;
    private empty: ViewGroup;

    private names = [
        'Population',
        'Market Size',
        'Price',
        'Stock',
        'Work in Progress',
        'Deliverables',
        'Workforce',
        'Customers',
        'Prospects',
        'Market Growth',
        'Ramp Up',
        'Projects',
        'Delayed Shippings',
        'Processed',
        'Inventory',
        'Unfinished Parts', 
        'Spare Parts',
        'Sales Volume',
        'Level',
        'Persons'
    ]

    private variableStyle: Style;
    private rateStyle: Style;
    private stockStyle: Style;
    private moduleStyle: GroupStyle;

    getModel(): ViewGroup {
        this.model = this.model || this.createDebugModel();
        return this.model;
    }

    private createStock() {
        let item = new ViewItem(
            this.randomName(),
            Math.random() * 20000,
            Math.random() * 20000,
            192,
            108
        );
        item.style = this.stockStyle;
        return item;
    }

    private createVariable() {
        let variable = new ViewItem(
            this.randomName(),
            Math.random() * 20000,
            Math.random() * 20000,
            32,
            32
        );
        variable.style = this.variableStyle;
        return variable;
    }

    private createRate() {
        let variable = new ViewItem(
            this.randomName(),
            Math.random() * 20000,
            Math.random() * 20000,
            64,
            64
        );
        variable.style = this.rateStyle;
        return variable;
    }

    private createModule() {
        let module = new ViewGroup(
            this.randomName(),
            Math.random() * 20000,
            Math.random() * 20000,
            300,
            260,
            1
        );
        module.style = this.moduleStyle;
        return module;
    }

    private randomName() {
        let n = Math.floor(Math.random() * this.names.length);
        return this.names[n < 0 ? 0 : n]; 
    }

    private createDebugModel(): ViewGroup {
        let MAX = 3;
        let i = MAX;
        let o : ViewGroup = null;
        let root: ViewGroup = null;
        while (i--) {
            let group = new ViewGroup(`Level #${MAX - i}`, 2000, 2000, 2000, 2000, 0.1);
            group.style = this.moduleStyle;

            let j = 180;
            while (j) {
                let rnd = Math.random();
                let item;
                if (rnd < .25) {
                    item = this.createStock();
                } else if (rnd < .5) {
                    item = this.createVariable();
                } else if (rnd < .75) {
                    item = this.createModule();
                } else {
                    item = this.createRate();
                }
                group.addContent(item);
                j--;
            }
            if (o) {
                o.addContent(group);
            } else {
                root = group;
            }
            o = group;
        }
        return root;
    }

    constructor() {
        this.moduleStyle = new GroupStyle();
        this.moduleStyle.actsAsPortal = true;
        this.moduleStyle.shape = new Shape(ShapeType.ROUNDED);
        this.moduleStyle.shape.a = 6;
        this.moduleStyle.fill = 'darkgrey';
        
        this.variableStyle = new Style();
        this.variableStyle.fill = 'mediumseagreen';
        this.variableStyle.shape = new Shape(ShapeType.CIRCLE);

        this.stockStyle = new Style();
        this.stockStyle.fill = 'cornflowerblue';
        this.stockStyle.shape = new Shape(ShapeType.RECTANGLE);

        this.rateStyle = new Style();
        this.rateStyle.fill = 'goldenrod';
        this.rateStyle.shape = new Shape(ShapeType.HOURGLASS);

        let render = new ShapeRenderer();
        render.cacheShape(this.moduleStyle);
        render.cacheShape(this.stockStyle);
        render.cacheShape(this.variableStyle);
        render.cacheShape(this.rateStyle);
    }
}
