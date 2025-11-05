import { _decorator, instantiate, macro, Mask, Node, Prefab, ScrollView, SpriteAtlas, tween, UIOpacity, UITransform, v3, Vec3 } from "cc";
import { CascadingUIStore } from "db://shared-cascading-slot/stores/cascading-ui-store";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { WinIconDetail } from "../../cascading-slot-utils";
import { CascadingSlotTumblesStore } from "../../stores/cascading-slot-tumbles-store";
import { CascadingTumbleItem } from "./cascading-tumble-item";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class CascadingTumbleList extends ObserverComponent {
    @property(Prefab)
    tumbleItem: Prefab = null;

    @property(Node)
    content: Node = null;

    @property(Node)
    trialModeNode: Node = null;

    @property(ScrollView)
    scrollView: ScrollView = null;

    @property(Node)
    maskNode: Node = null;

    @property(SpriteAtlas)
    mainAtlas: SpriteAtlas = null;

    private readonly HEIGHT_PER_ROW = 42;
    NUMBER_MAX_ITEM = 6;
    HEIGHT_CONTENT_REAL_MODE = 252;
    HEIGHT_CONTENT_TRIAL_MODE = 210;

    onLoad() {
        cascadingSlotLogger.info(`[CascadingTumbleList] Component loaded, initializing scroll view and scheduling trial message animation`);
        super.onLoad();
        this.scrollView = this.scrollView.getComponent(ScrollView);
        this.schedule(
            () => {
                this.animTrialMsg();
            },
            300,
            macro.REPEAT_FOREVER,
            0
        );
    }

    animTrialMsg() {
        cascadingSlotLogger.info(`[CascadingTumbleList] animTrialMsg called - animating trial mode node`);
        // Scale animation with repeat
        const scaleAnim = tween(this.trialModeNode)
            .to(0.1, { scale: new Vec3(0.9, 0.9, 0.9) }, { easing: "sineIn" })
            .to(0.1, { scale: new Vec3(1, 1, 1) }, { easing: "sineIn" });

        // Rotation animation with repeat
        const rotateAnim = tween(this.trialModeNode)
            .to(0.1, { angle: -2 }, { easing: "sineIn" })
            .to(0.1, { angle: 2 }, { easing: "sineIn" })
            .to(0.1, { angle: 0 }, { easing: "sineIn" });

        // Run scale animation 3 times, then run rotation animation 2 times
        tween(this.trialModeNode).then(scaleAnim.clone().repeat(3)).delay(0.2).then(rotateAnim.clone().repeat(3)).start();
    }

    setHeightContent(isTrialMode: boolean) {
        cascadingSlotLogger.info(`[CascadingTumbleList] setHeightContent called with isTrialMode: ${isTrialMode}`);
        const scrollViewNode = this.scrollView.node;
        const mask = this.maskNode.getComponent(Mask);
        if (isTrialMode) {
            scrollViewNode.getComponent(UITransform).height = this.HEIGHT_CONTENT_TRIAL_MODE;
            mask.getComponent(UITransform).height = this.HEIGHT_CONTENT_TRIAL_MODE;
            cascadingSlotLogger.info(`[CascadingTumbleList] Set trial mode height: ${this.HEIGHT_CONTENT_TRIAL_MODE}`);
        } else {
            scrollViewNode.getComponent(UITransform).height = this.HEIGHT_CONTENT_REAL_MODE;
            mask.getComponent(UITransform).height = this.HEIGHT_CONTENT_REAL_MODE;
            cascadingSlotLogger.info(`[CascadingTumbleList] Set real mode height: ${this.HEIGHT_CONTENT_REAL_MODE}`);
        }
    }

    get itemHeight() {
        const height = this.content.children.length > 0 ? this.content.children[0].getComponent(UITransform).height : this.HEIGHT_PER_ROW;
        cascadingSlotLogger.info(`[CascadingTumbleList] itemHeight getter called, returning: ${height}`);
        return height;
    }

    @render(CascadingSlotTumblesStore, (store) => store.tumble)
    addIcons(tumble: any) {
        cascadingSlotLogger.info(`[CascadingTumbleList] addIcons called with tumble:`, tumble);
        if (!tumble) {
            cascadingSlotLogger.info(`[CascadingTumbleList] No tumble data, returning early`);
            return;
        }
        const { icons } = tumble;
        cascadingSlotLogger.info(`[CascadingTumbleList] Processing icons:`, icons);
        this.content.active = true;
        Object.entries(icons).forEach(([key, value]) => {
            cascadingSlotLogger.info(`[CascadingTumbleList] Creating tumble item for key: ${key}`);
            const tumbleNode = instantiate(this.tumbleItem);
            const control = this.getTumbleItemComp(tumbleNode);
            const { count, win } = value as WinIconDetail;
            control.setData(+key, count, win);
            this.setAnimation(tumbleNode, this.content.children.length);
            this.content.addChild(tumbleNode);
        });
        this.updateContentHeight();
    }

    getTumbleItemComp(tumbleNode: Node) {
        return tumbleNode.getComponent(CascadingTumbleItem);
    }

    updateContentHeight() {
        const contentHeight = this.content.children.length * this.itemHeight;
        cascadingSlotLogger.info(`[CascadingTumbleList] updateContentHeight - children: ${this.content.children.length}, itemHeight: ${this.itemHeight}, totalHeight: ${contentHeight}`);
        this.content.getComponent(UITransform).height = contentHeight;
        const enabledScrollView = contentHeight > this.scrollView.node.getComponent(UITransform).height;
        this.scrollView.enabled = enabledScrollView;
        cascadingSlotLogger.info(`[CascadingTumbleList] Scroll view enabled: ${enabledScrollView}`);
        if (enabledScrollView) {
            this.scrollView.scrollToTop(0);
            cascadingSlotLogger.info(`[CascadingTumbleList] Scrolled to top`);
        } else {
            this.content.position = v3(0, 0);
            cascadingSlotLogger.info(`[CascadingTumbleList] Reset content position`);
        }
    }

    fall(node: Node) {
        cascadingSlotLogger.info(`[CascadingTumbleList] fall called for node`);
        return new Promise<void>((resolve) => {
            tween(node)
                .to(0.4, { position: v3(0, this.itemHeight / 2, 0) }, { easing: "sineOut" })
                .call(() => resolve())
                .start();
            const uiOpacity = node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
            tween(uiOpacity)
                .to(0.4, { opacity: 0 }, { easing: "sineOut" })
                .call(() => resolve())
                .start();
        });
    }

    @render(CascadingSlotTumblesStore, (store) => store.tumbles)
    async clear(tumbles: any) {
        cascadingSlotLogger.info(`[CascadingTumbleList] clear called with tumbles length: ${tumbles.length}`);
        if (tumbles.length === 0) {
            cascadingSlotLogger.info(`[CascadingTumbleList] Clearing all children with fall animation`);
            await Promise.all(this.content.children.map((child) => this.fall(child)));
            this.content.destroyAllChildren();
            this.updateContentHeight();
            cascadingSlotLogger.info(`[CascadingTumbleList] Destroyed all children and updated content height`);
        }
    }

    setAnimation(node: Node, index: number) {
        cascadingSlotLogger.info(`[CascadingTumbleList] setAnimation called for node at index: ${index}`);
        const startY = (index + this.NUMBER_MAX_ITEM + 0.5) * this.itemHeight;
        const minY = this.scrollView.node.getComponent(UITransform).height - 0.5 * this.itemHeight;
        node.position = v3(0, Math.max(startY, minY), 0);
        cascadingSlotLogger.info(`[CascadingTumbleList] Set initial position to: ${node.position}`);

        const destY = (index + 0.5) * this.itemHeight;
        cascadingSlotLogger.info(`[CascadingTumbleList] Animating to destination Y: ${destY}`);
        tween(node)
            .to(0.2, { position: v3(0, destY, 0) }, { easing: "sineOut" })
            .to(0.1, { position: v3(0, destY + 2, 0) }, { easing: "sineOut" })
            .to(0.1, { position: v3(0, destY, 0) }, { easing: "sineOut" })
            .start();
    }

    offerTrialMode(isTrialMode: boolean) {
        cascadingSlotLogger.info(`[CascadingTumbleList] offerTrialMode called with isTrialMode: ${isTrialMode}`);
        this.trialModeNode.active = isTrialMode;
        this.setHeightContent(isTrialMode);
        this.updateContentHeight();
        if (isTrialMode) {
            cascadingSlotLogger.info(`[CascadingTumbleList] Scheduling trial message animation`);
            this.schedule(
                () => {
                    this.animTrialMsg();
                },
                300,
                macro.REPEAT_FOREVER,
                0
            );
        } else {
            cascadingSlotLogger.info(`[CascadingTumbleList] Unscheduling trial message animation`);
            this.unschedule(this.animTrialMsg);
        }
    }

    @render(CascadingUIStore, (store) => store.isTrialMode)
    renderTrialMode(isTrialMode: boolean) {
        cascadingSlotLogger.info(`[CascadingTumbleList] renderTrialMode called with isTrialMode: ${isTrialMode}`);
        this.offerTrialMode(isTrialMode);
    }
}


