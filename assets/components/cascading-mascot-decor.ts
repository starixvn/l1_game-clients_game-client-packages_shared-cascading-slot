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
                this.prfMascot = await bundleManager.loadAssetsFromBundle<T>("resources", "prefabs/mascot", Prefab, null);
                const nodeMascot = instantiate(this.prfMascot);
                nodeMascot.active = false;
                this.node.addChild(nodeMascot);
                AnimationUtils.fadeOutAndDeactivate(this.nodeMascotBlur, 0.4);
                AnimationUtils.fadeInAndActivate(nodeMascot, 0.4);
            }
        } catch (err) {
            console.log(err);
            return null;
        }
    }
}
