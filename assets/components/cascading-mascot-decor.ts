import { _decorator, Component, instantiate, log, Node, Prefab } from "cc";
import { bundleManager } from "db://shared-components/shared/common-components/bundle-manager/bundle-manager";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { cascadingSlotLogger } from "../cascading-slot-logger";


const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass
export class CascadingMascotDecor extends Component {
    @property(Node)
    nodeMascotBlur: Node = null;

    private prfMascot = null;
    private readonly FADE_IN_OUT_DURATION = 0.5;

    async onLoad() {
        cascadingSlotLogger.info("[CASCADING_MASCOT_DECOR] onLoad called", {
            hasNodeMascotBlur: !!this.nodeMascotBlur,
            fadeDuration: this.FADE_IN_OUT_DURATION,
            willSetBlurActive: true,
            willCreateNode: true,
            timestamp: new Date().toISOString()
        });

        this.nodeMascotBlur.active = true;

        try {
            cascadingSlotLogger.info("[CASCADING_MASCOT_DECOR] Creating node asynchronously", {
                timestamp: new Date().toISOString()
            });
            await this.createNodeAsync();
            cascadingSlotLogger.info("[CASCADING_MASCOT_DECOR] Node creation completed successfully", {
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            cascadingSlotLogger.info("[CASCADING_MASCOT_DECOR] Error during node creation", {
                error: err,
                timestamp: new Date().toISOString()
            });
            log(err);
        }

        cascadingSlotLogger.info("[CASCADING_MASCOT_DECOR] onLoad completed", {
            timestamp: new Date().toISOString()
        });
    }

    async createNodeAsync() {
        cascadingSlotLogger.info("[CASCADING_MASCOT_DECOR] createNodeAsync called", {
            hasPrfMascot: !!this.prfMascot,
            willLoadPrefab: !this.prfMascot,
            fadeDuration: this.FADE_IN_OUT_DURATION,
            timestamp: new Date().toISOString()
        });

        try {
            if (!this.prfMascot) {
                cascadingSlotLogger.info("[CASCADING_MASCOT_DECOR] Loading mascot prefab", {
                    bundle: "resources",
                    path: "prefabs/mascot",
                    timestamp: new Date().toISOString()
                });

                this.prfMascot = await bundleManager.loadAssetsFromBundle<Prefab>("resources", "prefabs/mascot", Prefab, null);

                cascadingSlotLogger.info("[CASCADING_MASCOT_DECOR] Mascot prefab loaded", {
                    hasPrefab: !!this.prfMascot,
                    willInstantiate: true,
                    timestamp: new Date().toISOString()
                });

                const nodeMascot = instantiate(this.prfMascot);
                nodeMascot.active = false;

                cascadingSlotLogger.info("[CASCADING_MASCOT_DECOR] Mascot node instantiated", {
                    nodeActive: false,
                    willAddToParent: true,
                    willStartAnimations: true,
                    timestamp: new Date().toISOString()
                });

                this.node.addChild(nodeMascot);
                AnimationUtils.fadeOutAndDeactivate(this.nodeMascotBlur, this.FADE_IN_OUT_DURATION);
                AnimationUtils.fadeIn(nodeMascot, this.FADE_IN_OUT_DURATION);

                cascadingSlotLogger.info("[CASCADING_MASCOT_DECOR] Animations started", {
                    blurFadeOutDuration: this.FADE_IN_OUT_DURATION,
                    mascotFadeInDuration: this.FADE_IN_OUT_DURATION,
                    timestamp: new Date().toISOString()
                });
            } else {
                cascadingSlotLogger.info("[CASCADING_MASCOT_DECOR] Mascot prefab already exists, skipping creation", {
                    timestamp: new Date().toISOString()
                });
            }

            cascadingSlotLogger.info("[CASCADING_MASCOT_DECOR] createNodeAsync completed successfully", {
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            cascadingSlotLogger.info("[CASCADING_MASCOT_DECOR] Error in createNodeAsync", {
                error: err,
                timestamp: new Date().toISOString()
            });
            cascadingSlotLogger.info(err);
        }
    }
}




