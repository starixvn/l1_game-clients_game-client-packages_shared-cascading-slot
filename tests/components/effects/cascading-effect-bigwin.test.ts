import { instantiate, Label, Node, Prefab, sp, Tween, tween } from "cc";
import { CascadingEffectBigwin } from "../../../assets/components/effects/cascading-effect-bigwin";

// Mock external dependencies
jest.mock("@sg/game-client-base", () => {
    const mockGc = {
        Connection: {},
        Audios: {
            AudioHandler: {},
            AudioIds: {
                CLICK: "click_sound",
            },
        },
        Player: {
            MainPlayerStore: jest.fn(() => ({ balance: 1000, name: "test_player" })),
        },
        Bet: {
            BetStore: {},
            BetHandler: class {},
        },
        Notices: {
            NoticeStore: {},
        },
        Error: {
            ErrorStore: {},
        },
        Rounds: {
            RoundStore: {},
        },
        Shared: {
            IHandler: class {},
            IMultipleHandlers: class {},
        },
        UserSettings: {
            UserSettingHandlers: class {
                handle() {}
            },
        },
        GameUserSettings: {
            GameUserSettingHandler: class {
                handle() {}
            },
        },
        FormatUtils: {
            numberWithCommas: jest.fn((value: number) => value.toLocaleString()),
        },
    };
    return mockGc;
});

jest.mock("../../../assets/stores/bet-control-store");
jest.mock("../../../assets/stores/cascading-ui-store");
jest.mock("../../../assets/handlers/cascading-ui-handler");
jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => ({
    ObserverComponent: class {
        onLoad() {}
    },
}));
jest.mock("db://shared-components/shared/utils", () => ({
    AnimationUtils: {
        floatToNumber: jest.fn(),
        fadeOut: jest.fn(),
        fadeIn: jest.fn(),
    },
    FunctionUtils: {
        delay: jest.fn().mockResolvedValue(undefined),
    },
}));
jest.mock("observer", () => ({
    observer: jest.fn(),
    render: jest.fn((store, callback) => {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            return descriptor;
        };
    }),
    handle: jest.fn((handler, callback) => {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const originalMethod = descriptor.value;
            descriptor.value = function (...args: any[]) {
                return originalMethod.apply(this, args);
            };
            return descriptor;
        };
    }),
}));

// Mock tween
jest.mock("cc", () => {
    const originalModule = jest.requireActual("cc");
    return {
        ...originalModule,
        tween: jest.fn(() => ({
            delay: jest.fn().mockReturnThis(),
            call: jest.fn().mockReturnThis(),
            repeat: jest.fn().mockReturnThis(),
            start: jest.fn(() => ({ stop: jest.fn() })),
        })),
        instantiate: jest.fn(() => ({})),
    };
});

describe("CascadingEffectBigwin", () => {
    let cascadingEffectBigwin: CascadingEffectBigwin;
    let mockLblWinAmount: Label;
    let mockMegaWinPrefab: Prefab;
    let mockSuperWinPrefab: Prefab;
    let mockMainSpine: sp.Skeleton;
    let mockChangeLevel: Node;
    let mockNodeBigWin: Node;
    let mockTweenBigWin: Tween<Node>;
    let mockTweenDelay: Tween<any>;

    beforeEach(() => {
        // Create mock label
        mockLblWinAmount = {
            node: {},
            string: "0",
        } as unknown as Label;

        // Create mock prefabs
        mockMegaWinPrefab = {} as Prefab;
        mockSuperWinPrefab = {} as Prefab;

        // Create mock skeleton
        mockMainSpine = {
            setAnimation: jest.fn(),
            findAnimation: jest.fn().mockReturnValue({ duration: 1.0 }),
        } as unknown as sp.Skeleton;

        // Create mock nodes
        mockChangeLevel = {
            removeAllChildren: jest.fn(),
            addChild: jest.fn(),
        } as unknown as Node;

        mockNodeBigWin = {
            active: true,
        } as unknown as Node;

        // Create mock tweens
        mockTweenBigWin = {
            stop: jest.fn(),
        } as unknown as Tween<Node>;

        mockTweenDelay = {
            stop: jest.fn(),
        } as unknown as Tween<any>;

        // Create instance of CascadingEffectBigwin
        cascadingEffectBigwin = new CascadingEffectBigwin();
        cascadingEffectBigwin.lblWinAmount = mockLblWinAmount;
        cascadingEffectBigwin.megaWinPrefab = mockMegaWinPrefab;
        cascadingEffectBigwin.superWinPrefab = mockSuperWinPrefab;
        cascadingEffectBigwin.mainSpine = mockMainSpine;
        cascadingEffectBigwin.changeLevel = mockChangeLevel;
        cascadingEffectBigwin.nodeBigWin = mockNodeBigWin;
    });

    describe("setAmount", () => {
        it("should set amount with default parameters", () => {
            const data = { amount: 1000 };

            cascadingEffectBigwin.setAmount(data);

            expect(tween).toHaveBeenCalledWith(mockLblWinAmount.node);
        });

        it("should set amount with custom parameters", () => {
            const data = {
                amount: 2000,
                duration: 2.0,
                delayTime: 1.0,
                noZeroSuffix: true,
            };

            cascadingEffectBigwin.setAmount(data);

            expect(tween).toHaveBeenCalledWith(mockLblWinAmount.node);
        });
    });

    describe("changeFrameForBigWinLevel", () => {
        it("should trigger super win animation when ratio >= 6", async () => {
            const betWin = 6000;
            const totalBet = 1000;
            cascadingEffectBigwin.setAnimationChangeSuper = jest.fn();

            await cascadingEffectBigwin.changeFrameForBigWinLevel(betWin, totalBet);

            expect(cascadingEffectBigwin.setAnimationChangeSuper).toHaveBeenCalled();
        });

        it("should trigger mega win animation when ratio >= 3", async () => {
            const betWin = 3000;
            const totalBet = 1000;
            cascadingEffectBigwin.setAnimationChangeMega = jest.fn();

            await cascadingEffectBigwin.changeFrameForBigWinLevel(betWin, totalBet);

            expect(cascadingEffectBigwin.setAnimationChangeMega).toHaveBeenCalled();
        });

        it("should not trigger any animation when ratio < 3", async () => {
            const betWin = 2000;
            const totalBet = 1000;
            cascadingEffectBigwin.setAnimationChangeSuper = jest.fn();
            cascadingEffectBigwin.setAnimationChangeMega = jest.fn();

            await cascadingEffectBigwin.changeFrameForBigWinLevel(betWin, totalBet);

            expect(cascadingEffectBigwin.setAnimationChangeSuper).not.toHaveBeenCalled();
            expect(cascadingEffectBigwin.setAnimationChangeMega).not.toHaveBeenCalled();
        });

        it("should not trigger super animation if already changed", async () => {
            cascadingEffectBigwin["isChangeLevelSuper"] = false;
            const betWin = 6000;
            const totalBet = 1000;
            cascadingEffectBigwin.setAnimationChangeSuper = jest.fn();

            await cascadingEffectBigwin.changeFrameForBigWinLevel(betWin, totalBet);

            expect(cascadingEffectBigwin.setAnimationChangeSuper).not.toHaveBeenCalled();
        });

        it("should not trigger mega animation if already changed", async () => {
            cascadingEffectBigwin["isChangeLevelMega"] = false;
            const betWin = 3000;
            const totalBet = 1000;
            cascadingEffectBigwin.setAnimationChangeMega = jest.fn();

            await cascadingEffectBigwin.changeFrameForBigWinLevel(betWin, totalBet);

            expect(cascadingEffectBigwin.setAnimationChangeMega).not.toHaveBeenCalled();
        });
    });

    describe("showHideBigWinNode", () => {
        it("should show big win node", () => {
            cascadingEffectBigwin.showHideBigWinNode(true);

            expect(mockNodeBigWin.active).toBe(true);
        });

        it("should hide big win node", () => {
            cascadingEffectBigwin.showHideBigWinNode(false);

            expect(mockNodeBigWin.active).toBe(false);
        });
    });

    describe("setAnimationChangeSuper", () => {
        it("should change to super win animation", async () => {
            cascadingEffectBigwin.changeLevelAnimation = jest.fn();

            await cascadingEffectBigwin.setAnimationChangeSuper();

            expect(cascadingEffectBigwin["isChangeLevelSuper"]).toBe(false);
            expect(cascadingEffectBigwin.changeLevelAnimation).toHaveBeenCalledWith(mockMainSpine, "hide", mockSuperWinPrefab);
        });
    });

    describe("setAnimationChangeMega", () => {
        it("should change to mega win animation", async () => {
            cascadingEffectBigwin.changeLevelAnimation = jest.fn();

            await cascadingEffectBigwin.setAnimationChangeMega();

            expect(cascadingEffectBigwin["isChangeLevelMega"]).toBe(false);
            expect(cascadingEffectBigwin.changeLevelAnimation).toHaveBeenCalledWith(mockMainSpine, "hide", mockMegaWinPrefab);
        });
    });

    describe("changeLevelAnimation", () => {
        it("should perform level change animation", async () => {
            const { FunctionUtils } = require("db://shared-components/shared/utils");
            cascadingEffectBigwin.playSound = jest.fn();

            await cascadingEffectBigwin.changeLevelAnimation(mockMainSpine, "hide", mockMegaWinPrefab);

            expect(cascadingEffectBigwin.playSound).toHaveBeenCalledWith("winning-level-up");
            expect(mockMainSpine.setAnimation).toHaveBeenCalledWith(0, "hide", false);
            expect(mockChangeLevel.removeAllChildren).toHaveBeenCalled();
            expect(mockChangeLevel.addChild).toHaveBeenCalled();
            expect(instantiate).toHaveBeenCalledWith(mockMegaWinPrefab);
        });

        it("should handle animation with zero duration", async () => {
            mockMainSpine.findAnimation = jest.fn().mockReturnValue({ duration: 0 });
            cascadingEffectBigwin.playSound = jest.fn();

            await cascadingEffectBigwin.changeLevelAnimation(mockMainSpine, "hide", mockMegaWinPrefab);

            expect(cascadingEffectBigwin.playSound).toHaveBeenCalledWith("winning-level-up");
            expect(mockMainSpine.setAnimation).toHaveBeenCalledWith(0, "hide", false);
            expect(mockChangeLevel.removeAllChildren).toHaveBeenCalled();
            expect(mockChangeLevel.addChild).toHaveBeenCalled();
        });
    });

    describe("floatNumberBigWin", () => {
        beforeEach(() => {
            cascadingEffectBigwin["tweenBigWin"] = mockTweenBigWin;
            cascadingEffectBigwin.handleBigWinActions = jest.fn();
            cascadingEffectBigwin.playSound = jest.fn();
            cascadingEffectBigwin.stopSoundCoinIncrement = jest.fn();
            cascadingEffectBigwin.changeFrameForBigWinLevel = jest.fn();
        });

        it("should start number floating animation", () => {
            const opt = {
                label: mockLblWinAmount,
                amount: 1000,
                totalBet: 100,
                coinValue: 1,
            };

            cascadingEffectBigwin.floatNumberBigWin(opt);

            expect(tween).toHaveBeenCalledWith(mockLblWinAmount.node);
        });

        it("should not start animation when range is zero", () => {
            const opt = {
                label: mockLblWinAmount,
                amount: 1000,
                start: 1000,
                totalBet: 100,
                coinValue: 1,
            };

            cascadingEffectBigwin.floatNumberBigWin(opt);

            // When range is zero, the method returns early before creating the main tween
            // but the initial tween setup might still be called
            expect(cascadingEffectBigwin.handleBigWinActions).not.toHaveBeenCalled();
            expect(cascadingEffectBigwin.playSound).not.toHaveBeenCalled();
        });
    });

    describe("calculateStepValue", () => {
        it("should calculate step value for integer coin value", () => {
            const result = cascadingEffectBigwin["calculateStepValue"](100);

            expect(result).toBe("100");
        });

        it("should calculate step value for decimal coin value", () => {
            const result = cascadingEffectBigwin["calculateStepValue"](0.1);

            expect(result).toBe("0.1");
        });

        it("should return coin value for decimal with more than 2 places", () => {
            const result = cascadingEffectBigwin["calculateStepValue"](0.123);

            expect(result).toBe("0.123");
        });
    });

    describe("winAmountForNoAnim", () => {
        it("should set win amount without animation", () => {
            cascadingEffectBigwin["totalBet"] = 100;
            cascadingEffectBigwin.changeFrameForBigWinLevel = jest.fn();
            cascadingEffectBigwin.setAmount = jest.fn();

            cascadingEffectBigwin["winAmountForNoAnim"](500);

            expect(cascadingEffectBigwin.changeFrameForBigWinLevel).toHaveBeenCalledWith(500, 100);
            expect(cascadingEffectBigwin.setAmount).toHaveBeenCalledWith({ amount: 500 });
        });
    });

    describe("updateTotalBet", () => {
        it("should update total bet", () => {
            const totalBet = 1000;

            cascadingEffectBigwin["updateTotalBet"](totalBet);

            expect(cascadingEffectBigwin["totalBet"]).toBe(1000);
        });
    });

    describe("setCoinValue", () => {
        it("should update coin value", () => {
            const coinValue = 0.5;

            cascadingEffectBigwin.setCoinValue(coinValue);

            expect(cascadingEffectBigwin["coinValue"]).toBe(0.5);
        });
    });

    describe("skipTouchToContinue", () => {
        it("should increment skip count and call handleBigWinActions", () => {
            cascadingEffectBigwin.handleBigWinActions = jest.fn();

            cascadingEffectBigwin.skipTouchToContinue();

            expect(cascadingEffectBigwin["skipClickCount"]).toBe(1);
            expect(cascadingEffectBigwin.handleBigWinActions).toHaveBeenCalledWith(true);
        });

        it("should not call handleBigWinActions after max clicks", () => {
            cascadingEffectBigwin["skipClickCount"] = 2;
            cascadingEffectBigwin.handleBigWinActions = jest.fn();

            cascadingEffectBigwin.skipTouchToContinue();

            expect(cascadingEffectBigwin["skipClickCount"]).toBe(3);
            expect(cascadingEffectBigwin.handleBigWinActions).not.toHaveBeenCalled();
        });
    });

    describe("renderTurboMode", () => {
        it("should update turbo mode state", () => {
            const isTurboMode = true;

            cascadingEffectBigwin.renderTurboMode(isTurboMode);

            expect(cascadingEffectBigwin["isTurboMode"]).toBe(true);
        });
    });

    describe("handleBigWinAmount", () => {
        beforeEach(() => {
            cascadingEffectBigwin["totalBet"] = 100;
            cascadingEffectBigwin["coinValue"] = 1;
        });

        it("should return early when win amount is 0", () => {
            cascadingEffectBigwin.floatNumberBigWin = jest.fn();
            cascadingEffectBigwin["winAmountForNoAnim"] = jest.fn();

            cascadingEffectBigwin.handleBigWinAmount(0);

            expect(cascadingEffectBigwin.floatNumberBigWin).not.toHaveBeenCalled();
            expect(cascadingEffectBigwin["winAmountForNoAnim"]).not.toHaveBeenCalled();
        });

        it("should handle big win in turbo mode", () => {
            cascadingEffectBigwin["isTurboMode"] = true;
            cascadingEffectBigwin["winAmountForNoAnim"] = jest.fn();
            cascadingEffectBigwin.showHideBigWinNode = jest.fn();
            cascadingEffectBigwin.handleBigWinActions = jest.fn();

            cascadingEffectBigwin.handleBigWinAmount(500);

            expect(cascadingEffectBigwin["winAmount"]).toBe(500);
            expect(cascadingEffectBigwin["winAmountForNoAnim"]).toHaveBeenCalledWith(500);
            expect(cascadingEffectBigwin.showHideBigWinNode).toHaveBeenCalledWith(false);
            expect(cascadingEffectBigwin.handleBigWinActions).toHaveBeenCalledWith(true);
        });

        it("should handle big win in normal mode", () => {
            cascadingEffectBigwin["isTurboMode"] = false;
            cascadingEffectBigwin.floatNumberBigWin = jest.fn();

            cascadingEffectBigwin.handleBigWinAmount(500);

            expect(cascadingEffectBigwin["winAmount"]).toBe(500);
            expect(cascadingEffectBigwin.floatNumberBigWin).toHaveBeenCalledWith({
                label: mockLblWinAmount,
                amount: 500,
                totalBet: 100,
                coinValue: 1,
            });
        });

        it("should show big win node for small wins in turbo mode", () => {
            cascadingEffectBigwin["isTurboMode"] = true;
            cascadingEffectBigwin["winAmountForNoAnim"] = jest.fn();
            cascadingEffectBigwin.showHideBigWinNode = jest.fn();
            cascadingEffectBigwin.handleBigWinActions = jest.fn();

            cascadingEffectBigwin.handleBigWinAmount(200); // ratio = 2

            expect(cascadingEffectBigwin.showHideBigWinNode).toHaveBeenCalledWith(true);
        });
    });

    describe("setBigWinCompleted", () => {
        it("should return the completed parameter", () => {
            const result = cascadingEffectBigwin.setBigWinCompleted(true);

            expect(result).toBe(true);
        });
    });

    describe("handleBigWinActions", () => {
        beforeEach(() => {
            cascadingEffectBigwin["tweenDelay"] = mockTweenDelay;
            cascadingEffectBigwin["tweenBigWin"] = mockTweenBigWin;
            cascadingEffectBigwin.setBigWinCompleted = jest.fn();
            cascadingEffectBigwin.playSound = jest.fn();
            cascadingEffectBigwin.stopSoundCoinIncrement = jest.fn();
            cascadingEffectBigwin["winAmountForNoAnim"] = jest.fn();
        });

        it("should handle completed action with skip count > 1", () => {
            cascadingEffectBigwin["skipClickCount"] = 2;

            cascadingEffectBigwin.handleBigWinActions(true);

            expect(mockTweenDelay.stop).toHaveBeenCalled();
            expect(cascadingEffectBigwin.setBigWinCompleted).toHaveBeenCalledWith(true);
        });

        it("should handle completed action with skip count = 1 and turbo mode", () => {
            cascadingEffectBigwin["skipClickCount"] = 1;
            cascadingEffectBigwin["isTurboMode"] = true;

            cascadingEffectBigwin.handleBigWinActions(true);

            expect(mockTweenDelay.stop).toHaveBeenCalled();
            expect(cascadingEffectBigwin.setBigWinCompleted).toHaveBeenCalledWith(true);
        });

        it("should handle normal big win action", () => {
            cascadingEffectBigwin["skipClickCount"] = 0;
            cascadingEffectBigwin["isTurboMode"] = false;

            cascadingEffectBigwin.handleBigWinActions(true);

            expect(mockTweenDelay.stop).toHaveBeenCalled();
            expect(mockTweenBigWin.stop).toHaveBeenCalled();
            expect(cascadingEffectBigwin["winAmountForNoAnim"]).toHaveBeenCalledWith(cascadingEffectBigwin["winAmount"]);
            expect(cascadingEffectBigwin.playSound).toHaveBeenCalledWith("big_win_stop");
            expect(cascadingEffectBigwin.playSound).toHaveBeenCalledWith("increment_stop");
            expect(cascadingEffectBigwin.stopSoundCoinIncrement).toHaveBeenCalled();
            expect(tween).toHaveBeenCalled();
        });
    });

    describe("playSound", () => {
        it("should return the sound id", () => {
            const result = cascadingEffectBigwin.playSound("test_sound");

            expect(result).toBe("test_sound");
        });
    });

    describe("stopSoundCoinIncrement", () => {
        it("should return increment sound id", () => {
            const result = cascadingEffectBigwin.stopSoundCoinIncrement();

            expect(result).toBe("increment");
        });
    });
});
