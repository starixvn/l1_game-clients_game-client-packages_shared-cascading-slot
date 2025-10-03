import gc from "@sg/game-client-base";
import { _decorator } from "cc";
import WebViewGuide from "db://shared-components/game/game-guide/scripts/web-view-guide";
import Observer from "observer";

import { BuyFreespinsStore } from "../../buy-freespins/handler/buy-freespins-store";
import { BetControlStore } from "../../stores/bet-control-store";
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
        const theme = "classic-slot-template";
        return { theme, specialDirection, scrollToId };
    }

    @render(BetControlStore, (store) => store.betLevel)
    getBetLevel(betLevel: number) {
        this.level = betLevel;
    }

    @render(BetControlStore, (store) => store.coinValue)
    getCoin(coin: number) {
        this.coin = coin;
    }

    @render(BuyFreespinsStore, (store) => store.enabled)
    setBuyFsEnabled(enabled: boolean) {
        this.Features.BuyFreeSpins.enabled = enabled;
    }

    sendDataToIframe(gameConfigs: gc.GameConfigs.GameConfigStore) {
        const guideUrl = gc.UrlUtils.getSubDomain(this.url);
        this.onWebViewLoaded = () => {
            const configsWithBetInfo = {
                ...gameConfigs,
                coin: this.coin,
                level: this.level,
                features: this.Features,
            };
            (document.getElementById("webview") as HTMLIFrameElement)?.contentWindow?.postMessage(
                JSON.stringify(configsWithBetInfo),
                guideUrl
            );
        };
    }
}
