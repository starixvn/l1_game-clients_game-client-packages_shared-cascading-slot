import { _decorator, Component, instantiate, Node, Prefab } from "cc";
import { bundleManager } from "db://shared-components/shared/common-components/bundle-manager/bundle-manager";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";

const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass
export class CascadingMascotDecor extends Component {
    @property(Node)
    nodeMascotBlur: Node = null;

    private prfMascot = null;
    private readonly FADE_IN_OUT_DURATION = 0.5;

    async onLoad() {
        this.nodeMascotBlur.active = true;
        try {
            await this.createNodeAsync();
        } catch (err) {
            console.log(err);
        }
    }

    async createNodeAsync() {
        try {
            if (!this.prfMascot) {
                this.prfMascot = await bundleManager.loadAssetsFromBundle<Prefab>("resources", "prefabs/mascot", Prefab, null);
                const nodeMascot = instantiate(this.prfMascot);
                nodeMascot.active = false;
                this.node.addChild(nodeMascot);
                AnimationUtils.fadeOutAndDeactivate(this.nodeMascotBlur, this.FADE_IN_OUT_DURATION);
                AnimationUtils.fadeIn(nodeMascot, this.FADE_IN_OUT_DURATION);
            }
        } catch (err) {
            console.log(err);
            return null;
        }
    }
}
