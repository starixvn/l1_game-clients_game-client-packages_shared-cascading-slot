import { _decorator, ProgressBar } from "cc";
import AutoTestSplash from "db://shared-components/shared/common-components/auto-test/auto-test-splash";
import Splash from "db://shared-components/splash/scripts/components/splash";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

const { ccclass, property } = _decorator;

@ccclass
export class SplashSlotPortrait extends Splash {
    onLoad() {
        cascadingSlotLogger.info(`[SplashSlotPortrait] Component loaded, calling super and adding AutoTestSplash component`);
        super.onLoad();
        this.addComponent(AutoTestSplash);
    }

    handleProgressIndex(progress: number) {
        cascadingSlotLogger.info(`[SplashSlotPortrait] handleProgressIndex called with progress: ${progress}`);
        super.handleProgressIndex(progress);
        if (progress > 0) {
            const progressBar = this.containerCustomize.children[0]?.getComponent(ProgressBar);
            if (progressBar) {
                progressBar.progress = progress;
                cascadingSlotLogger.info(`[SplashSlotPortrait] Updated progress bar to: ${progress}`);
            }
        }
    }
}



