import { _decorator } from "cc";
import Observer from "observer";
import { TumbleWinWiew } from "./tumble-win-view";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class PortraitTumbleWinWiew extends TumbleWinWiew {}
