import gc from "@sg/game-client-base";
import { _decorator, Color, Label, macro, Node, Sprite, SpriteAtlas } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { random } from "lodash-es";
import Observer from "observer";
import { ColorJson, resourcesCache } from "../../cascading-slot-utils";
import { GameServiceMessageCascading } from "../../game-messages-cascading";
import { CascadingSlotConfigsStore } from "../../stores/cascading-slot-configs-store";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { cascadingSlotLogger } from "../../cascading-slot-logger";


const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class CascadingTopMessage extends ObserverComponent {
    @property(Sprite)
    iconMultiplier: Sprite = null;

    @property(Label)
    msg3: Label = null;

    @property(Node)
    nodeContent: Node = null;

    @property(SpriteAtlas)
    mainAtlas: SpriteAtlas = null;

    private colorConfig: ColorJson;
    private maxWinPerRound: number;
    msgList = [1, 2, 3];

    onLoad() {
        cascadingSlotLogger.info(`[CascadingTopMessage] Component loaded, initializing color config and scheduling message updates`);
        this.colorConfig = resourcesCache.colorJson;
        this.schedule(this.updateTopMessage, 5, macro.REPEAT_FOREVER, 0);
        super.onLoad();
        this.getComponentsInChildren(Label).forEach((comp) => {
            comp.color = new Color().fromHEX(this.colorConfig.topMessageTextColor);
        });
        cascadingSlotLogger.info(`[CascadingTopMessage] Set label colors to: ${this.colorConfig.topMessageTextColor}`);
    }

    @render(CascadingUIStore, (store) => store.isHideTopMessage)
    topMessageVisibility(isHideTopMessage: boolean) {
        cascadingSlotLogger.info(`[CascadingTopMessage] topMessageVisibility called with isHideTopMessage: ${isHideTopMessage}`);
        this.node.active = !isHideTopMessage;
        cascadingSlotLogger.info(`[CascadingTopMessage] Set node active to: ${this.node.active}`);
    }

    updateTopMessage() {
        cascadingSlotLogger.info(`[CascadingTopMessage] updateTopMessage called`);
        this.iconMultiplier.spriteFrame = this.mainAtlas.getSpriteFrame("symbol-13");
        this.nodeContent.children.forEach((child) => {
            child.active = false;
        });

        const item = this.msgList[random(this.msgList.length - 1)];
        this.nodeContent.children[item - 1].active = true;
        cascadingSlotLogger.info(`[CascadingTopMessage] Activated message item: ${item}`);
    }

    @render(CascadingSlotConfigsStore, (store) => store.gameConfigs)
    updateMaxWin(gameConfigs: GameServiceMessageCascading.CascadingSlotConfigsMsg) {
        cascadingSlotLogger.info(`[CascadingTopMessage] updateMaxWin called with gameConfigs:`, gameConfigs);
        if (!gameConfigs) {
            cascadingSlotLogger.info(`[CascadingTopMessage] No game configs provided, returning early`);
            return;
        }
        this.maxWinPerRound = gameConfigs.maxWinPerRound;
        cascadingSlotLogger.info(`[CascadingTopMessage] Updated maxWinPerRound to: ${this.maxWinPerRound}`);
        this.renderMsg3();
    }

    renderMsg3() {
        const msg = gc.Translator.gameTranslate(`top_message3`);
        this.msg3.string = msg.replace(/%{maxWin}/i, this.maxWinPerRound);
        cascadingSlotLogger.info(`[CascadingTopMessage] renderMsg3 set message to: ${this.msg3.string}`);
    }
}



