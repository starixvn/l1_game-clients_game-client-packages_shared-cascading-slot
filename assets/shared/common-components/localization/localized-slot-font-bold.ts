import { _decorator } from "cc";
import { LocalizedFont } from "db://shared-components/shared/common-components/localization/localized-font";

const { ccclass, property } = _decorator;

@ccclass("LocalizedSlotFontBold")
export class LocalizedSlotFontBold extends LocalizedFont {
    initData() {
        this.fontBases = {
            vi: "Kodchasan-Bold",
            id: "Kodchasan-Bold",
            en: "Kodchasan-Bold",
            th: "NotoSerifThai-Bold",
            zh_cn: "NotoSerifZHCN-Bold",
            zh_tw: "NotoSerifZHTW-Bold",
        };
    }
}
