import gc from "@sg/game-client-base";
import { _decorator } from 'cc';
import { CascadingWebViewGuide } from './cascading-web-view-guide';
const { ccclass } = _decorator;

@ccclass
export class PortraitCascadingWebViewGuide extends CascadingWebViewGuide {


    sendDataToIframe(gameConfigs: gc.GameConfigs.GameConfigStore) {
        const portraitUrl = this.url + "&mode=portrait";
        this.onWebViewLoaded = () => {
            const configsWithBetInfo = {
                ...gameConfigs,
                coin: this.coin,
                level: this.level,
                features: this.Features,
            };
            (document.getElementById("webview") as HTMLIFrameElement)?.contentWindow?.postMessage(
                JSON.stringify(configsWithBetInfo),
                gc.UrlUtils.getSubDomain(portraitUrl)
            );
        };
    }
}


