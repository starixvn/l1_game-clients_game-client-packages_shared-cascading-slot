import { _decorator } from "cc";
import Observer from "observer";

import { MultipleNodeContainer } from "db://shared-components/shared/common-components/node-container/multiple-node-container";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class BuyFreespinsContainer extends MultipleNodeContainer {}
