import gc from "@sg/game-client-base";
import { _decorator } from 'cc';
import { CascadingWebViewGuide } from './cascading-web-view-guide';
const { ccclass } = _decorator;

@ccclass
export class PortraitCascadingWebViewGuide extends CascadingWebViewGuide {
    loadGameGuide(url: string) {
        super.loadGameGuide(url + "&mode=portrait");
    }
}


