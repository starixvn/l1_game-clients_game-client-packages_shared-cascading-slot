import { _decorator, instantiate, Prefab } from "cc";
import Observer from "observer";

import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { CascadingWarningTurboMode } from "./cascading-warning-turbo-mode";

const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass
export class CascadingWarningTurboModeContainer extends ObserverComponent {
    @property(Prefab)
    prefabWarningTurboMode: Prefab = null;

    @render(CascadingUIStore, (store) => store.isTurboMode, { fireImmediately: false })
    renderTurboModeMsg(isTurboMode: boolean) {
        const turboNode = instantiate(this.prefabWarningTurboMode);
        const comp = turboNode.getComponent(CascadingWarningTurboMode);
        this.node.addChild(turboNode);
        //const msg = isTurboMode ? gc.Translator.gameTranslate("enable_turbo_mode") : gc.Translator.gameTranslate("disable_turbo_mode");
        comp.setData(isTurboMode);
    }
}
