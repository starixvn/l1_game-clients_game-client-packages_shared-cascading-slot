import gc from "@sg/game-client-base";
import { _decorator, Color, JsonAsset, Label, macro, Node, Sprite, SpriteAtlas } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { random } from "lodash-es";
import Observer from "observer";
import { CascadingSlotConfigsStore } from "../../stores/cascading-slot-configs-store";
import { CascadingUIStore } from "../../stores/cascading-ui-store";

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
    @property(JsonAsset)
    colorInfo: JsonAsset = null;
    private colorConfig: any;
    private maxWinPerRound: any;

    onLoad() {
        this.colorConfig = this.colorInfo.json;
        this.schedule(this.updateTopMessage, 5, macro.REPEAT_FOREVER, 0);
        super.onLoad();
        this.getComponentsInChildren(Label).forEach((comp) => {
            comp.color = new Color().fromHEX(this.colorConfig.topMessageTextColor);
        });
    }

    @render(CascadingUIStore, (store) => store.isHideTopMessage)
    topMessageVisibility(isHideTopMessage: boolean) {
        this.node.active = !isHideTopMessage;
    }

    updateTopMessage() {
        this.iconMultiplier.spriteFrame = this.mainAtlas.getSpriteFrame("symbol-13");
        this.nodeContent.children.forEach((child) => {
            child.active = false;
        });
        const items = [1, 2, 3];
        const item = items[random(items.length - 1)];
        this.nodeContent.children[item - 1].active = true;
    }

    @render(CascadingSlotConfigsStore, (store) => store.gameConfigs)
    updateMaxWin(gameConfigs: any) {
        if (!gameConfigs) {
            return;
        }
        this.maxWinPerRound = gameConfigs.maxWinPerRound;
        this.renderMsg3();
    }

    renderMsg3() {
        const msg = gc.Translator.gameTranslate(`top_message3`);
        this.msg3.string = msg.replace(/%{maxWin}/i, this.maxWinPerRound);
    }
}
