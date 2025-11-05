import gc from "@sg/game-client-base";
import { _decorator } from "cc";
import WebViewGuide from "db://shared-components/game/game-guide/scripts/web-view-guide";
import Observer from "observer";

import { BuyFreespinsStore } from "../../buy-freespins/handler/buy-freespins-store";
import { BetControlStore } from "../../stores/bet-control-store";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

const { ccclass } = _decorator;
const { render, handle } = Observer;

@ccclass
export class CascadingWebViewGuide extends WebViewGuide {
    public level = 0;
    public coin = 0;
    public readonly Features = {
        BuyFreeSpins: {
            enabled: false,
        },
    };

    @handle(gc.GameGuide.GameGuideHandlers.GetGuideURL)
    initUrl(specialDirection = "", scrollToId = "") {
        cascadingSlotLogger.info("[CASCADING_WEB_VIEW_GUIDE] initUrl called", {
            specialDirection,
            scrollToId,
            theme: "classic-slot-template",
            timestamp: new Date().toISOString()
        });

        const theme = "classic-slot-template";
        const result = { theme, specialDirection, scrollToId };

        cascadingSlotLogger.info("[CASCADING_WEB_VIEW_GUIDE] initUrl completed", {
            result,
            timestamp: new Date().toISOString()
        });

        return result;
    }

    @render(BetControlStore, (store) => store.betLevel)
    getBetLevel(betLevel: number) {
        cascadingSlotLogger.info("[CASCADING_WEB_VIEW_GUIDE] getBetLevel called", {
            betLevel,
            previousLevel: this.level,
            timestamp: new Date().toISOString()
        });

        this.level = betLevel;

        cascadingSlotLogger.info("[CASCADING_WEB_VIEW_GUIDE] getBetLevel completed", {
            level: this.level,
            timestamp: new Date().toISOString()
        });
    }

    @render(BetControlStore, (store) => store.coinValue)
    getCoin(coin: number) {
        cascadingSlotLogger.info("[CASCADING_WEB_VIEW_GUIDE] getCoin called", {
            coin,
            previousCoin: this.coin,
            timestamp: new Date().toISOString()
        });

        this.coin = coin;

        cascadingSlotLogger.info("[CASCADING_WEB_VIEW_GUIDE] getCoin completed", {
            coin: this.coin,
            timestamp: new Date().toISOString()
        });
    }

    @render(BuyFreespinsStore, (store) => store.enabled)
    setBuyFsEnabled(enabled: boolean) {
        cascadingSlotLogger.info("[CASCADING_WEB_VIEW_GUIDE] setBuyFsEnabled called", {
            enabled,
            previousEnabled: this.Features.BuyFreeSpins.enabled,
            timestamp: new Date().toISOString()
        });

        this.Features.BuyFreeSpins.enabled = enabled;

        cascadingSlotLogger.info("[CASCADING_WEB_VIEW_GUIDE] setBuyFsEnabled completed", {
            buyFreeSpinsEnabled: this.Features.BuyFreeSpins.enabled,
            timestamp: new Date().toISOString()
        });
    }

    sendDataToIframe(gameConfigs: gc.GameConfigs.GameConfigStore) {
        cascadingSlotLogger.info("[CASCADING_WEB_VIEW_GUIDE] sendDataToIframe called", {
            gameConfigs,
            coin: this.coin,
            level: this.level,
            features: this.Features,
            hasUrl: !!this.url,
            timestamp: new Date().toISOString()
        });

        const guideUrl = gc.UrlUtils.getSubDomain(this.url);
        cascadingSlotLogger.info("[CASCADING_WEB_VIEW_GUIDE] Guide URL extracted", {
            guideUrl,
            originalUrl: this.url,
            timestamp: new Date().toISOString()
        });

        this.onWebViewLoaded = () => {
            cascadingSlotLogger.info("[CASCADING_WEB_VIEW_GUIDE] onWebViewLoaded callback triggered", {
                willPrepareConfigsWithBetInfo: true,
                timestamp: new Date().toISOString()
            });

            const configsWithBetInfo = {
                ...gameConfigs,
                coin: this.coin,
                level: this.level,
                features: this.Features,
            };

            cascadingSlotLogger.info("[CASCADING_WEB_VIEW_GUIDE] Posting message to iframe", {
                configsWithBetInfo,
                guideUrl,
                willPostMessage: true,
                timestamp: new Date().toISOString()
            });

            (document.getElementById("webview") as HTMLIFrameElement)?.contentWindow?.postMessage(
                JSON.stringify(configsWithBetInfo),
                guideUrl
            );

            cascadingSlotLogger.info("[CASCADING_WEB_VIEW_GUIDE] Message posted to iframe", {
                messagePosted: true,
                timestamp: new Date().toISOString()
            });
        };

        cascadingSlotLogger.info("[CASCADING_WEB_VIEW_GUIDE] sendDataToIframe completed - callback set", {
            timestamp: new Date().toISOString()
        });
    }
}



