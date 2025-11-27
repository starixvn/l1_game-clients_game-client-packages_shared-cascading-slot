import { _decorator, Label, Node, UITransform } from "cc";
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

    @property(Node)
    winningBgNode: Node = null;

    @property(Node)
    cascadeArrowIcon: Node = null;

    @property(Node)
    cascadeRecordBgNode: Node = null; // Background for cascade records

    // Win tag sprites (serve as background for multiplier value)
    @property(Node)
    bronzeWinSprite: Node = null; // Bronze win tag background for multiplier

    @property(Node)
    silverWinSprite: Node = null; // Silver win tag background for multiplier

    @property(Node)
    goldWinSprite: Node = null; // Gold win tag background for multiplier

    @property(Node)
    amethystWinSprite: Node = null; // Amethyst win tag background for multiplier

    // Main multiplier label for winTag=null (no special win tag)
    @property(Label)
    lblMultiplierValue: Label = null;

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

        // 2.4: set multiplier text based on winTag
        this.setMultiplierText(spinData.winTag, spinData.spinWinMultiplier);

        // 2.5: activate winningBgNode for winning records (including cascade records as children of winning records)
        if (this.winningBgNode) {
            this.winningBgNode.active = spinData.spinWinAmountRaw > 0;
        }

        // 2.6: activate win tag sprites based on winTag (with dynamic sizing)
        // Use next frame to ensure text width is calculated after setting the string
        this.scheduleOnce(() => {
            this.activateWinTagSprite(spinData.winTag);
        }, 0);
    }

    private setMultiplierText(winTag: WinTag, multiplierText: string) {
        // Clear all multiplier labels first
        if (this.lblMultiplierValue) {
            this.lblMultiplierValue.string = "";
        }

        // Clear child labels in all win tag sprites
        this.clearChildMultiplierLabels();

        // Set multiplier text based on winTag
        if (winTag === null) {
            // For winTag=null, use the main multiplier label
            if (this.lblMultiplierValue) {
                this.lblMultiplierValue.string = multiplierText;
            }
        } else {
            // For specific win tags, set text on the child label within the sprite
            this.setChildMultiplierLabel(winTag, multiplierText);
        }
    }

    private clearChildMultiplierLabels() {
        // Clear child multiplier labels in all win tag sprites
        const sprites = [this.bronzeWinSprite, this.silverWinSprite, this.goldWinSprite, this.amethystWinSprite];

        sprites.forEach(sprite => {
            if (sprite) {
                const childLabel = sprite.getChildByName("lblMultiplierValue")?.getComponent(Label);
                if (childLabel) {
                    childLabel.string = "";
                }
            }
        });
    }

    private setChildMultiplierLabel(winTag: WinTag, multiplierText: string) {
        let targetSprite: Node | null = null;

        // Get the target sprite based on winTag
        switch (winTag) {
            case "Bronze":
                targetSprite = this.bronzeWinSprite;
                break;
            case "Silver":
                targetSprite = this.silverWinSprite;
                break;
            case "Gold":
                targetSprite = this.goldWinSprite;
                break;
            case "Amethyst":
                targetSprite = this.amethystWinSprite;
                break;
        }

        // Set the multiplier text on the child label within the target sprite
        if (targetSprite) {
            const childLabel = targetSprite.getChildByName("lblMultiplierValue")?.getComponent(Label);
            if (childLabel) {
                childLabel.string = multiplierText;
            }
        }
    }

    private activateWinTagSprite(winTag: WinTag) {
        // Deactivate all win tag sprites first
        if (this.bronzeWinSprite) {
            this.bronzeWinSprite.active = false;
        }
        if (this.silverWinSprite) {
            this.silverWinSprite.active = false;
        }
        if (this.goldWinSprite) {
            this.goldWinSprite.active = false;
        }
        if (this.amethystWinSprite) {
            this.amethystWinSprite.active = false;
        }

        // Get the dimensions of the active multiplier label for dynamic sizing
        const { width: multiplierLabelWidth, height: multiplierLabelHeight } = this.getActiveMultiplierLabelDimensions(winTag);

        // Activate the appropriate sprite based on winTag and resize to fit multiplier text
        switch (winTag) {
            case "Bronze":
                if (this.bronzeWinSprite) {
                    this.bronzeWinSprite.active = true;
                    // Resize sprite to match multiplier text dimensions
                    this.resizeSpriteToText(this.bronzeWinSprite, multiplierLabelWidth, multiplierLabelHeight);
                }
                break;
            case "Silver":
                if (this.silverWinSprite) {
                    this.silverWinSprite.active = true;
                    // Resize sprite to match multiplier text dimensions
                    this.resizeSpriteToText(this.silverWinSprite, multiplierLabelWidth, multiplierLabelHeight);
                }
                break;
            case "Gold":
                if (this.goldWinSprite) {
                    this.goldWinSprite.active = true;
                    // Resize sprite to match multiplier text dimensions
                    this.resizeSpriteToText(this.goldWinSprite, multiplierLabelWidth, multiplierLabelHeight);
                }
                break;
            case "Amethyst":
                if (this.amethystWinSprite) {
                    this.amethystWinSprite.active = true;
                    // Resize sprite to match multiplier text dimensions
                    this.resizeSpriteToText(this.amethystWinSprite, multiplierLabelWidth, multiplierLabelHeight);
                }
                break;
            case null:
            default:
                // No win tag, all sprites remain inactive
                break;
        }
    }

    private getActiveMultiplierLabelDimensions(winTag: WinTag): { width: number; height: number } {
        let targetLabel: Label | null = null;

        if (winTag === null) {
            // For winTag=null, use the main multiplier label
            targetLabel = this.lblMultiplierValue;
        } else {
            // For specific win tags, use the child label within the sprite
            let targetSprite: Node | null = null;

            switch (winTag) {
                case "Bronze":
                    targetSprite = this.bronzeWinSprite;
                    break;
                case "Silver":
                    targetSprite = this.silverWinSprite;
                    break;
                case "Gold":
                    targetSprite = this.goldWinSprite;
                    break;
                case "Amethyst":
                    targetSprite = this.amethystWinSprite;
                    break;
            }

            if (targetSprite) {
                targetLabel = targetSprite.getChildByName("lblMultiplierValue")?.getComponent(Label) || null;
            }
        }

        // Get dimensions from the target label
        const labelTransform = targetLabel ? targetLabel.getComponent(UITransform) : null;
        const width = labelTransform ? labelTransform.width : 0;
        const height = labelTransform ? labelTransform.height : 0;

        return { width, height };
    }

    private resizeSpriteToText(spriteNode: Node, textWidth: number, textHeight: number) {
        if (!spriteNode) return;

        // Get the UITransform component of the sprite
        const spriteTransform = spriteNode.getComponent(UITransform);
        if (!spriteTransform) return;

        // Add some padding around the text
        const paddingX = 8; // Horizontal padding
        const paddingY = 4; // Vertical padding

        // Resize the sprite to fit the text with padding
        spriteTransform.setContentSize(textWidth + (paddingX * 2), textHeight + (paddingY * 2));

        // Optional: Center the sprite on the text (if needed)
        // This assumes the sprite should be centered behind the text
        // You may need to adjust positioning based on your UI layout
    }
}
