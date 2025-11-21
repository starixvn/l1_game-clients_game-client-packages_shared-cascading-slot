import { _decorator, instantiate, macro, Mask, Node, Prefab, ScrollView, SpriteAtlas, tween, UIOpacity, UITransform, v3, Vec3 } from "cc";
import { CascadingUIStore } from "db://shared-cascading-slot/stores/cascading-ui-store";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { WinIconDetail } from "../../cascading-slot-utils";
import { CascadingSlotTumblesStore } from "../../stores/cascading-slot-tumbles-store";
import { CascadingTumbleItem } from "./cascading-tumble-item";
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
        const scrollViewNode = this.scrollView.node;
        const mask = this.maskNode.getComponent(Mask);
        if (isTrialMode) {
            scrollViewNode.getComponent(UITransform).height = this.HEIGHT_CONTENT_TRIAL_MODE;
            mask.getComponent(UITransform).height = this.HEIGHT_CONTENT_TRIAL_MODE;
        } else {
            scrollViewNode.getComponent(UITransform).height = this.HEIGHT_CONTENT_REAL_MODE;
            mask.getComponent(UITransform).height = this.HEIGHT_CONTENT_REAL_MODE;
        }
    }

    get itemHeight() {
        return this.content.children.length > 0 ? this.content.children[0].getComponent(UITransform).height : this.HEIGHT_PER_ROW;
    }

    @render(CascadingSlotTumblesStore, (store) => store.tumble)
    addIcons(tumble: any) {
        if (!tumble) {
            return;
        }
        const { icons } = tumble;
        this.content.active = true;
        Object.entries(icons).forEach(([key, value]) => {
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
        this.content.getComponent(UITransform).height = contentHeight;
        const enabledScrollView = contentHeight > this.scrollView.node.getComponent(UITransform).height;
        this.scrollView.enabled = enabledScrollView;
        if (enabledScrollView) {
            this.scrollView.scrollToTop(0);
        } else {
            this.content.position = v3(0, 0);
        }
    }

    fall(node: Node) {
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
        if (tumbles.length === 0) {
            await Promise.all(this.content.children.map((child) => this.fall(child)));
            this.content.destroyAllChildren();
            this.updateContentHeight();
        }
    }

    setAnimation(node: Node, index: number) {
        const startY = (index + this.NUMBER_MAX_ITEM + 0.5) * this.itemHeight;
        const minY = this.scrollView.node.getComponent(UITransform).height - 0.5 * this.itemHeight;
        node.position = v3(0, Math.max(startY, minY), 0);

        const destY = (index + 0.5) * this.itemHeight;
        tween(node)
            .to(0.2, { position: v3(0, destY, 0) }, { easing: "sineOut" })
            .to(0.1, { position: v3(0, destY + 2, 0) }, { easing: "sineOut" })
            .to(0.1, { position: v3(0, destY, 0) }, { easing: "sineOut" })
            .start();
    }

    offerTrialMode(isTrialMode: boolean) {
        this.trialModeNode.active = isTrialMode;
        this.setHeightContent(isTrialMode);
        this.updateContentHeight();
        if (isTrialMode) {
            this.schedule(
                () => {
                    this.animTrialMsg();
                },
                300,
                macro.REPEAT_FOREVER,
                0
            );
        } else {
            this.unschedule(this.animTrialMsg);
        }
    }

    @render(CascadingUIStore, (store) => store.isTrialMode)
    renderTrialMode(isTrialMode: boolean) {
        this.offerTrialMode(isTrialMode);
    }
}
