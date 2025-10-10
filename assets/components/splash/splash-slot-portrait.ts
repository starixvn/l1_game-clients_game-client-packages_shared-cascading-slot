import { _decorator, ProgressBar } from "cc";
import AutoTestSplash from "db://shared-components/shared/common-components/auto-test/auto-test-splash";
import Splash from "db://shared-components/splash/scripts/components/splash";
const { ccclass, property } = _decorator;

@ccclass
export class SplashSlotPortrait extends Splash {
    onLoad() {
        super.onLoad();
        this.addComponent(AutoTestSplash);
    }

    handleProgressIndex(progress: number) {
        super.handleProgressIndex(progress);
        if (progress > 0) {
            const progressBar = this.containerCustomize.children[0]?.getComponent(ProgressBar);
            progressBar && (progressBar.progress = progress);
        }
    }
}
