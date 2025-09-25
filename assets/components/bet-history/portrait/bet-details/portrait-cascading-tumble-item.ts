import { _decorator, Node } from 'cc';
import { CascadingTumbleItem } from '../../../tumbles/cascading-tumble-item';
const { ccclass, property } = _decorator;

@ccclass
export class PortraitCascadingTumbleItem extends CascadingTumbleItem {
    @property(Node)
    tooltip: Node = null;

    handleToogleTooltip() {
        this.tooltip.active = !this.tooltip.active;
    }

}


