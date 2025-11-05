import { _decorator, Node, Sprite, SpriteAtlas } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { GameServiceMessageCascading } from "../game-messages-cascading";
import { CascadingSlotConfigsStore } from "../stores/cascading-slot-configs-store";
import { cascadingSlotLogger } from "../cascading-slot-logger";


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
        cascadingSlotLogger.info("[CASCADING_VOLATILITY_VIEW] onLoad called", {
            hasContainer: !!this.container,
            prefixSprite: this.prefixSprite,
            spritesLength: this.sprites.length,
            hasAtlas: !!this.atlas,
            willGetSprites: true,
            willGetAtlas: true,
            willCallSuperOnLoad: true,
            willDeactivateNode: true,
            timestamp: new Date().toISOString()
        });

        this.sprites = this.container.getComponentsInChildren(Sprite);
        cascadingSlotLogger.info("[CASCADING_VOLATILITY_VIEW] Sprites retrieved from container", {
            spritesCount: this.sprites.length,
            hasSprites: this.sprites.length > 0,
            timestamp: new Date().toISOString()
        });

        if (this.sprites.length > 0) {
            this.atlas = this.sprites[0].spriteAtlas;
            cascadingSlotLogger.info("[CASCADING_VOLATILITY_VIEW] Atlas retrieved from first sprite", {
                hasAtlas: !!this.atlas,
                atlasName: this.atlas?.name,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.info("[CASCADING_VOLATILITY_VIEW] No sprites found, atlas not set", {
                timestamp: new Date().toISOString()
            });
        }

        super.onLoad();
        cascadingSlotLogger.info("[CASCADING_VOLATILITY_VIEW] super.onLoad() completed", {
            timestamp: new Date().toISOString()
        });

        this.node.active = false;
        cascadingSlotLogger.info("[CASCADING_VOLATILITY_VIEW] Node deactivated", {
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_VOLATILITY_VIEW] onLoad completed", {
            spritesCount: this.sprites.length,
            hasAtlas: !!this.atlas,
            nodeActive: this.node.active,
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingSlotConfigsStore, (store) => store.gameInfo)
    renderGameInfo(gameInfo: GameServiceMessageCascading.GameInfoMsg) {
        cascadingSlotLogger.info("[CASCADING_VOLATILITY_VIEW] renderGameInfo called", {
            hasGameInfo: !!gameInfo,
            gameInfoVolatility: gameInfo?.volatility,
            willSkipIfNoGameInfo: !gameInfo,
            willSetActive: !!gameInfo,
            willUpdateVolatility: !!gameInfo,
            timestamp: new Date().toISOString()
        });

        if (!gameInfo) {
            cascadingSlotLogger.info("[CASCADING_VOLATILITY_VIEW] Skipping render - no game info", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        const volatility = gameInfo.volatility;
        cascadingSlotLogger.info("[CASCADING_VOLATILITY_VIEW] Volatility extracted from game info", {
            volatility,
            currentNodeActive: this.node.active,
            willActivateNode: volatility > 0,
            timestamp: new Date().toISOString()
        });

        this.node.active = volatility > 0;
        cascadingSlotLogger.info("[CASCADING_VOLATILITY_VIEW] Node activation set", {
            volatility,
            nodeActive: this.node.active,
            timestamp: new Date().toISOString()
        });

        this.updateVolatility(volatility);
        cascadingSlotLogger.info("[CASCADING_VOLATILITY_VIEW] Volatility updated", {
            volatility,
            timestamp: new Date().toISOString()
        });
    }

    updateVolatility(volatility: number) {
        cascadingSlotLogger.info("[CASCADING_VOLATILITY_VIEW] updateVolatility called", {
            volatility,
            hasAtlas: !!this.atlas,
            spritesCount: this.sprites.length,
            willSkipIfNoAtlas: !this.atlas,
            willUpdateSprites: !!this.atlas && this.sprites.length > 0,
            timestamp: new Date().toISOString()
        });

        if (!this.atlas) {
            cascadingSlotLogger.info("[CASCADING_VOLATILITY_VIEW] Skipping update - no atlas available", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        this.sprites.forEach((sprite, index) => {
            const suffix = index < volatility ? "on" : "off";
            const spriteFrameName = `${this.prefixSprite}${suffix}`;

            cascadingSlotLogger.info("[CASCADING_VOLATILITY_VIEW] Updating sprite", {
                spriteIndex: index,
                volatility,
                suffix,
                spriteFrameName,
                willGetSpriteFrame: true,
                timestamp: new Date().toISOString()
            });

            sprite.spriteFrame = this.atlas.getSpriteFrame(spriteFrameName);

            cascadingSlotLogger.info("[CASCADING_VOLATILITY_VIEW] Sprite frame set", {
                spriteIndex: index,
                spriteFrameName,
                hasSpriteFrame: !!sprite.spriteFrame,
                timestamp: new Date().toISOString()
            });
        });

        cascadingSlotLogger.info("[CASCADING_VOLATILITY_VIEW] updateVolatility completed", {
            volatility,
            spritesUpdated: this.sprites.length,
            timestamp: new Date().toISOString()
        });
    }
}




