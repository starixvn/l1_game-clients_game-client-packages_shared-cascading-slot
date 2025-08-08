import gc from "@sg/game-client-base";
import { _decorator, Component, instantiate, Node, Prefab } from "cc";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { CascadingTotalMultiplierItem } from "./cascading-total-multiplier-item";
const { ccclass, property } = _decorator;
const { handle } = Observer;

@ccclass
export class CascadingTotalMultiplier extends Component {
    @property(Node)
    content: Node = null;

    @property(Prefab)
    totalMultiplierItemPrefab: Prefab = null;

    setData(data: any) {
        const rounds = data.totalMultipliers.rounds;
        AnimationUtils.delayTime(0.2).then(() => {
            rounds.forEach((round, index) => {
                const itemNode = instantiate(this.totalMultiplierItemPrefab);
                const itemControl = itemNode.getComponent(CascadingTotalMultiplierItem);
                itemControl.setData(round, index + 1);
                this.content.addChild(itemNode);
            });
        });
    }

    @handle(gc.Audios.AudioHandler, (handle) => handle.playSFX(gc.Audios.AudioIds.CLICK))
    onClickClose() {
        const dialogs = this.getComponentsInChildren(Dialog);

        if (dialogs.length > 0) {
            dialogs[0].hide();
        } else {
            this.node.destroy();
        }
    }
}
