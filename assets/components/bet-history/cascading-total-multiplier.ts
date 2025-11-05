import gc from "@sg/game-client-base";
import { _decorator, Component, instantiate, Node, Prefab } from "cc";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { CascadingTotalMultiplierItem } from "./cascading-total-multiplier-item";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

cascadingSlotLogger.info('[CASCADING_TOTAL_MULTIPLIER] Initializing CascadingTotalMultiplier class');

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
        cascadingSlotLogger.info('[CASCADING_TOTAL_MULTIPLIER] Setting data for total multiplier:', {
            roundsCount: rounds?.length || 0,
            hasContentNode: !!this.content,
            hasItemPrefab: !!this.totalMultiplierItemPrefab
        });

        AnimationUtils.delayTime(0.2).then(() => {
            cascadingSlotLogger.info('[CASCADING_TOTAL_MULTIPLIER] Starting to instantiate multiplier items after delay');
            rounds.forEach((round, index) => {
                const itemNode = instantiate(this.totalMultiplierItemPrefab);
                const itemControl = itemNode.getComponent(CascadingTotalMultiplierItem);
                itemControl.setData(round, index + 1);
                this.content.addChild(itemNode);
                cascadingSlotLogger.info(`[CASCADING_TOTAL_MULTIPLIER] Added multiplier item ${index + 1}/${rounds.length}`);
            });
            cascadingSlotLogger.info('[CASCADING_TOTAL_MULTIPLIER] All multiplier items instantiated');
        });
    }

    @handle(gc.Audios.AudioHandler, (handle) => handle.playSFX(gc.Audios.AudioIds.CLICK))
    onClickClose() {
        cascadingSlotLogger.info('[CASCADING_TOTAL_MULTIPLIER] Close button clicked');
        const dialogs = this.getComponentsInChildren(Dialog);
        cascadingSlotLogger.info('[CASCADING_TOTAL_MULTIPLIER] Found dialogs:', { count: dialogs.length });
        AudioUtils.playClick();
        if (dialogs.length > 0) {
            cascadingSlotLogger.info('[CASCADING_TOTAL_MULTIPLIER] Hiding dialog component');
            dialogs[0].hide();
        } else {
            cascadingSlotLogger.info('[CASCADING_TOTAL_MULTIPLIER] Destroying multiplier node');
            this.node.destroy();
        }
    }
}



