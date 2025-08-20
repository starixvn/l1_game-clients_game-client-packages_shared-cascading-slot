import { _decorator, Component, instantiate, Node, Prefab } from "cc";
import { bundleManager } from "db://shared-components/shared/common-components/bundle-manager/bundle-manager";
import { AnimationUtils } from "db://shared-components/shared/utils/utils";
import Observer from "observer";
import { resourcesCache } from "../cascading-slot-utils";
import { CascadingUIStore } from "../stores/cascading-ui-store";
const { ccclass, property } = _decorator;
const { render } = Observer;

@ccclass
export class CascadingBackgroundGame extends Component {
    @property(Node)
    bgNormal: Node = null;

    @property(Node)
    bgFreeSpin: Node = null;
    private readonly FADE_IN_OUT_DURATION = 0.5;

    onLoad() {
        this.bgNormal.active = true;
        this.bgFreeSpin.active = false;
    }

    @render(CascadingUIStore, (store) => store.isInFreeSpinMode)
    async handleBackgroundGame(isInFreeSpinMode: boolean) {
        if (resourcesCache.gameFeatures?.allowBackgroundChangeOnFreeSpins) {
            if (isInFreeSpinMode) {
                try {
                    const prefabBgFreespin = await bundleManager.loadResourcesAsset<Prefab>("prefabs/effect-multiplier", Prefab);
                    const bgFreespin = instantiate(prefabBgFreespin);
                    this.bgFreeSpin.addChild(bgFreespin);
                    AnimationUtils.fadeOutAndDeactivate(this.bgNormal, this.FADE_IN_OUT_DURATION);
                    AnimationUtils.fadeIn(this.bgFreeSpin, this.FADE_IN_OUT_DURATION);
                } catch (err) {
                    console.log(err);
                }
            } else {
                AnimationUtils.fadeOutAndDeactivate(this.bgFreeSpin, this.FADE_IN_OUT_DURATION);
                AnimationUtils.fadeIn(this.bgNormal, this.FADE_IN_OUT_DURATION);
                this.bgFreeSpin.removeAllChildren();
            }
        }
    }
}
