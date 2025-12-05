import { _decorator, sp, v3 } from "cc";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import {
    GameSpeed,
    getConfigGameSpeed,
    resourcesCache,
    SLOT_COLUMN_MAX_INDEX,
    SPIN_FOREVER,
    SymbolBoard,
} from "db://shared-cascading-slot/cascading-slot-utils";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { CascadingSlotReelNew } from "../../slot-reel/cascading-slot-reel-new";
import { PortraitCascadingSlotBoard } from "./portrait-cascading-slot-board";
const { render, handle } = Observer;
const { ccclass } = _decorator;

@ccclass
export class PortraitCascadingSlotBoardNew extends PortraitCascadingSlotBoard {
    private readonly REEL_DURATION_OFFSET = 0.25;
    public startReelDelayTime = 0.075;

    public async spinResult(symbolsBoard: SymbolBoard, gameSpeed: string) {
        const { symbols, multipliers } = symbolsBoard;
        console.time("spinResult");
        console.log("symbols  spinResult +++++++++++++++++", symbols);

        this.playSpinAudio(gameSpeed);
        const duration = getConfigGameSpeed("spinDuration", gameSpeed);

        if (gameSpeed === GameSpeed.NORMAL) {
            const peekEffect = this.checkPeekEffect(symbols);
            if (peekEffect) {
                await this.spinNormal(duration, symbols, multipliers, peekEffect);
            } else {
                await this.spinNormal(duration, symbols, multipliers);
            }
        } else {
            await this.spinTurbo(duration, symbols, multipliers);
        }
        console.timeEnd("spinResult");
        AudioUtils.stopStoppableSFX(AudioIds.PEEK_EFFECT_REEL);
        this.hidePeekEffects();
    }

    async spinNormal(originalDuration: number, columns: number[][], multipliers: number[], peekEffect?: any) {
        return new Promise<void>(async (resolve) => {
            const minIndex = peekEffect ? peekEffect.peekIndex : SLOT_COLUMN_MAX_INDEX;

            let duration: number;
            for (let i = 0; i < this.reels.length; i++) {
                const reel = this.reels[i] as CascadingSlotReelNew;
                duration = originalDuration + i * this.REEL_DURATION_OFFSET;

                const current = i;

                if (i > 0) {
                    await AnimationUtils.delayTime(this.startReelDelayTime);
                }
                if (i < minIndex) {
                    reel.spinNormal(duration, columns[i], multipliers);
                } else {
                    const isEdgeItem = i === minIndex;
                    reel.spinNormal(isEdgeItem ? duration : SPIN_FOREVER, columns[i], multipliers).then(async () => {
                        await this.handleSpinReelEnded(current, columns, resolve);
                    });
                }
            }
        });
    }

    private async handleSpinReelEnded(current: number, columns: number[][], resolve: (value: void | PromiseLike<void>) => void) {
        this.hidePeekEffectAtIndex(current);
        //calculate peek effect at current
        const nextReelIndex = current + 1;

        const peekEffects = this.checkPeekEffect(columns);
        this.showScattersOnPreviousReels(current);

        if (current < SLOT_COLUMN_MAX_INDEX) {
            const reelNext = this.reels[nextReelIndex] as CascadingSlotReelNew;
            if (!reelNext.isFaster) {
                this.makeReelsMoveFast(current);
            }
            this.showPeekEffectNew(nextReelIndex);
            reelNext.stopSoon();
        } else {
            if (peekEffects) {
                await AnimationUtils.delayTime(1);
            }
            this.hidePeekEffects();

            resolve();
        }
    }

    showPeekEffectNew(reelIndex: number) {
        if (!resourcesCache.gameFeatures?.enablePeekEffect) {
            return;
        }
        this.peekEffectOverlay.active = true;
        this.peekEffectContainer.active = true;

        const peekEffectNode = this.peekEffectTumblePool.get();
        if (!peekEffectNode) {
            return;
        }
        peekEffectNode.active = true;

        const position = this.reels[reelIndex].node.position;
        peekEffectNode.setPosition(v3(position.x, 0));
        peekEffectNode.name = `reel-${reelIndex.toString()}`;
        this.peekEffectContainer.addChild(peekEffectNode);
        AnimationUtils.fadeIn(peekEffectNode, 0.3);
        const spine = peekEffectNode.getComponentInChildren(sp.Skeleton);
        spine.setAnimation(0, "show", true);
        //AudioUtils.playSFX(AudioIds.PEEK_EFFECT);
    }

    handleSymbolsPeekEffect(peekEffects: any, columns: number[][]) {
        if (!resourcesCache?.gameFeatures?.enablePeekEffect) {
            return;
        }
        if (!peekEffects) {
            return;
        }

        this.showPeekEffectInTumbles(columns);
    }

    async spinTurbo(duration: number, symbols: number[][], multipliers: number[]) {
        for (let i = 0; i < this.reels.length; i++) {
            const reel = this.reels[i] as CascadingSlotReelNew;
            if (i < SLOT_COLUMN_MAX_INDEX) {
                reel.spinTurbo(duration, symbols[i], multipliers);
            } else {
                await reel.spinTurbo(duration, symbols[i], multipliers);
            }
        }
    }

    makeReelsMoveFast(currentIndex: number) {
        this.reels.forEach((reel, index) => {
            if (index >= currentIndex) {
                (reel as CascadingSlotReelNew).moveFast();
            }
        });
    }
}
