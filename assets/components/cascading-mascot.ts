import { _decorator, sp } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { CascadingUIStore } from "../stores/cascading-ui-store";

const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass
export class CascadingMascot extends ObserverComponent {
    @property(sp.Skeleton)
    spineMascot: sp.Skeleton = null;

    onLoad() {
        AnimationUtils.playSpine(this.spineMascot, "idle", true);
        super.onLoad();
    }

    @render(CascadingUIStore, (store) => store.haveEventGame)
    async playAnimEventGame(haveEventGame: boolean) {
        haveEventGame && (await AnimationUtils.playSpine(this.spineMascot, "event", false));
        AnimationUtils.playSpine(this.spineMascot, "idle", true);
    }
}
