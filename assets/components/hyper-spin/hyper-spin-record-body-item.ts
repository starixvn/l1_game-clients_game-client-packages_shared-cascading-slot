import { _decorator, Label, Node, Sprite, SpriteAtlas, UITransform } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { WinTag } from "../../stores/hyper-spin-store";

const { ccclass, property } = _decorator;

@ccclass
export default class HyperSpinRecordBodyItem extends ObserverComponent {
    @property(Label)
    lblSpinValue: Label = null;

    @property(Label)
    lblWinValue: Label = null;

    @property(Label)
    lblBalance: Label = null;

    @property(Label)
    lblMultiplierValue: Label = null;

    @property(Node)
    winningBgNode: Node = null;

    @property(Node)
    cascadeArrowIcon: Node = null;

    @property(Node)
    cascadeRecordBgNode: Node = null; // Background for cascade records

    // WinTag sprite - single sprite node with dynamic spriteFrame from atlas
    @property(Sprite)
    winTagSprite: Sprite = null;

    @property(SpriteAtlas)
    winTagAtlas: SpriteAtlas = null;

    /**
     * Set the spin record data
     * Follows the same pattern as HyperSpinRoundNumber.setValue
     */
    setSpinData(spinData: {
        spinId: string | number;
        spinWinAmount: string;
        spinWinAmountRaw: number;
        spinBalance: string;
        spinWinMultiplier: string;
        isCascadeRecord?: boolean;
        winTag?: WinTag;
    }) {

        // Check if this is a cascade record
        const isCascadeRecord = spinData.isCascadeRecord === true;

        // 2.1: handle spinId display - show arrow icon for cascade records
        if (this.lblSpinValue) {
            if (isCascadeRecord) {
                // For cascade records, show the step identifier (e.g., "↳ 1")
                this.lblSpinValue.node.active = true;
                this.lblSpinValue.string = spinData.spinId.toString();
            } else {
                // For regular records, show the spin ID
                this.lblSpinValue.node.active = true;
                this.lblSpinValue.string = spinData.spinId.toString();
            }
        }

        // Show/hide cascade arrow icon (for down arrow icon)
        if (this.cascadeArrowIcon) {
            this.cascadeArrowIcon.active = false; // Not used in new structure
        }

        // Show/hide cascade record background
        if (this.cascadeRecordBgNode) {
            this.cascadeRecordBgNode.active = isCascadeRecord;
        }

        // 2.2: assign spin.spinWinAmount to lbl-win-value
        if (this.lblWinValue) {
            this.lblWinValue.string = spinData.spinWinAmount;
        }

        // 2.3: assign spin.spinBalance to lbl-balance
        if (this.lblBalance) {
            this.lblBalance.string = spinData.spinBalance;
        }

        // 2.4: assign spin.spinWinMultiplier to lbl-multiplier-value
        if (this.lblMultiplierValue) {
            this.lblMultiplierValue.string = spinData.spinWinMultiplier;
        }

        // 2.5: activate winningBgNode for winning records (including cascade records as children of winning records)
        if (this.winningBgNode) {
            this.winningBgNode.active = spinData.spinWinAmountRaw > 0;
        }

        // 2.6: activate WinTag sprite based on winTag value
        this.activateWinTagSprite(spinData.winTag);
    }

    /**
     * Set the WinTag sprite dynamically using SpriteAtlas
     * Solution 1: Using SpriteAtlas with getSpriteFrame()
     */
    private activateWinTagSprite(winTag: WinTag) {
        if (!this.winTagSprite || !this.winTagAtlas) {
            return;
        }

        // If no winTag, hide the sprite
        if (winTag === null || winTag === undefined) {
            this.winTagSprite.node.active = false;
            return;
        }

        // Map WinTag to sprite frame name
        const spriteFrameName = `multiplier-${winTag.toLowerCase()}-tag`;
        const spriteFrame = this.winTagAtlas.getSpriteFrame(spriteFrameName);

        if (spriteFrame) {
            this.winTagSprite.spriteFrame = spriteFrame;
            this.winTagSprite.node.active = true;

            // Set sprite width to cover the multiplier label width
            this.setWinTagSpriteWidthToMatchMultiplierLabel();
        } else {
            console.warn(`[HyperSpinRecordBodyItem] Sprite frame not found in atlas: ${spriteFrameName}`);
            this.winTagSprite.node.active = false;
        }
    }

    /**
     * Set the winTagSprite width to match the lblMultiplierValue width
     * This ensures the sprite covers the entire multiplier text area
     */
    private setWinTagSpriteWidthToMatchMultiplierLabel() {
        if (!this.winTagSprite || !this.lblMultiplierValue) {
            return;
        }

        // Get UITransform components
        const spriteTransform = this.winTagSprite.node.getComponent(UITransform);
        const labelTransform = this.lblMultiplierValue.node.getComponent(UITransform);

        if (spriteTransform && labelTransform) {
            // Set sprite width to match label width
            spriteTransform.width = labelTransform.width + 20;

            // Optionally, you can also center the sprite horizontally on the label
            // by setting the sprite's x position to match the label's x position
            this.winTagSprite.node.setPosition(
                this.lblMultiplierValue.node.position.x,
                this.winTagSprite.node.position.y,
                this.winTagSprite.node.position.z
            );
        }
    }
}
