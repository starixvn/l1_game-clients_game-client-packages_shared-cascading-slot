import { _decorator, Node, Sprite, SpriteAtlas } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { GameServiceMessageCascading } from "../game-messages-cascading";
import { CascadingSlotConfigsStore } from "../stores/cascading-slot-configs-store";

const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass("CascadingVolatilityView")
export class CascadingVolatilityView extends ObserverComponent {
    @property(Node)
    container: Node = null;

    @property
    prefixSprite = "volatility-";

    private sprites: Sprite[] = [];
    private atlas: SpriteAtlas = null;

    onLoad() {
        this.sprites = this.container.getComponentsInChildren(Sprite);
        if (this.sprites.length > 0) {
            this.atlas = this.sprites[0].spriteAtlas;
        }
        super.onLoad();
    }

    @render(CascadingSlotConfigsStore, (store) => store.gameInfo)
    renderGameInfo(gameInfo: GameServiceMessageCascading.GameInfoMsg) {
        if (!gameInfo) {
            return;
        }
        const volatility = gameInfo.volatility;
        this.updateVolatility(volatility);
    }

    updateVolatility(volatility: number) {
        if (!this.atlas) {
            return
        }
        this.sprites.forEach((sprite, index) => {
            const suffix = index < volatility ? "on" : "off";
            sprite.spriteFrame = this.atlas.getSpriteFrame(`${this.prefixSprite}${suffix}`);
        });
    }
}
