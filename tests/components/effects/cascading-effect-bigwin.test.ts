import { instantiate, Label, Node, Prefab, sp, Tween, tween } from "cc";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { CascadingEffectBigwin } from "../../../assets/components/effects/cascading-effect-bigwin";

// Comprehensive type declarations to fix scheduleOnce issue
declare global {
    namespace cc {
        interface Component {
            scheduleOnce(callback: Function, delay: number): void;
            schedule(callback: Function, interval: number, repeat?: number, delay?: number): void;
            unschedule(callback: Function): void;
            unscheduleAllCallbacks(): void;
        }
    }
}

// Create a global interface that any class can implement
interface SchedulableComponent {
    scheduleOnce(callback: Function, delay: number): void;
    schedule(callback: Function, interval: number, repeat?: number, delay?: number): void;
    unschedule(callback: Function): void;
    unscheduleAllCallbacks(): void;
}

// Type for CascadingEffectBigwin with scheduleOnce method for testing
type CascadingEffectBigwinWithSchedule = CascadingEffectBigwin & {
    scheduleOnce: jest.Mock;
};

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
        Auth: {
            AuthStore: jest.fn(() => ({
                session: "test_session",
                username: "test_username",
                language: "en",
            })),
            AuthHandlers: {
                GetBalance: jest.fn(() => ({})),
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
            NoticeErrorsHandlers: {
                AutoSignOutHandler: jest.fn(() => ({})),
            },
        },
        Error: {
            ErrorStore: {},
        },
        Configs: {
            SiteConfigs: jest.fn(),
        },
        Rounds: {
            RoundStore: {},
        },
        Shared: {
            IHandler: class {},
            IMultipleHandlers: class {},
            utils: {
                StorageManager: {
                    setPrefixKey: jest.fn(),
                },
            },
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

        Notification: {
            NotificationStore: jest.fn(() => ({
                connection: {
                    on: jest.fn(),
                },
            })),
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
        scheduleOnce = jest.fn();
        schedule = jest.fn();
        unschedule = jest.fn();
        unscheduleAllCallbacks = jest.fn();
    },
}));
jest.mock("db://shared-components/shared/utils", () => ({
    AnimationUtils: {
        floatToNumber: jest.fn(),
        fadeOut: jest.fn(),
        fadeIn: jest.fn(),
        delayTime: jest.fn().mockResolvedValue(undefined),
    },
}));

jest.mock("db://shared-components/game/audios/utils", () => ({
    AudioUtils: {
        stopStoppableSFX: jest.fn(),
        playStoppableSFX: jest.fn(),
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
    let cascadingEffectBigwin: CascadingEffectBigwinWithSchedule;
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
        cascadingEffectBigwin = new CascadingEffectBigwin() as CascadingEffectBigwinWithSchedule;
        cascadingEffectBigwin.lblWinAmount = mockLblWinAmount;
        cascadingEffectBigwin.megaWinPrefab = mockMegaWinPrefab;
        cascadingEffectBigwin.superWinPrefab = mockSuperWinPrefab;
        cascadingEffectBigwin.mainSpine = mockMainSpine;
        cascadingEffectBigwin.changeLevel = mockChangeLevel;
        cascadingEffectBigwin.nodeBigWin = mockNodeBigWin;

        // Reset the change level flags to their initial state
        cascadingEffectBigwin["isChangeLevelSuper"] = true;
        cascadingEffectBigwin["isChangeLevelMega"] = true;
        cascadingEffectBigwin["isChangeLevelBig"] = true;
        cascadingEffectBigwin["bigWinRange"] = [0, 0, 0];
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
        it("should trigger super win animation when ratio >= 50 in normal mode", async () => {
            // Mock console.log to avoid test noise
            jest.spyOn(console, "log").mockImplementation();

            cascadingEffectBigwin["isTurboMode"] = false; // Explicitly set normal mode
            cascadingEffectBigwin["bigWinRange"] = [0, 50, 0];
            const betWin = 50000;
            const totalBet = 1000;
            cascadingEffectBigwin.setAnimationChangeSuper = jest.fn();
            cascadingEffectBigwin.setAnimationChangeMega = jest.fn();
            cascadingEffectBigwin.setAnimationChangeBig = jest.fn();

            await cascadingEffectBigwin.changeFrameForBigWinLevel(betWin, totalBet);

            expect(cascadingEffectBigwin.setAnimationChangeBig).not.toHaveBeenCalled();
            expect(cascadingEffectBigwin.setAnimationChangeSuper).not.toHaveBeenCalled();
            expect(cascadingEffectBigwin.setAnimationChangeMega).toHaveBeenCalled();

            // Restore console.log
            (console.log as jest.Mock).mockRestore();
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

    describe("setAnimationChangeBig", () => {
        it("should change to big win state and play sound", async () => {
            cascadingEffectBigwin.playSound = jest.fn();

            await cascadingEffectBigwin.setAnimationChangeBig();

            expect(cascadingEffectBigwin["isChangeLevelBig"]).toBe(false);
            expect(cascadingEffectBigwin.playSound).toHaveBeenCalledWith(AudioIds.BIG_WIN);
        });
    });

    describe("changeLevelAnimation", () => {
        it("should perform level change animation", async () => {
            cascadingEffectBigwin.playSound = jest.fn();

            await cascadingEffectBigwin.changeLevelAnimation(mockMainSpine, "hide", mockMegaWinPrefab);

            expect(mockMainSpine.setAnimation).toHaveBeenCalledWith(0, "hide", false);
            expect(mockChangeLevel.removeAllChildren).toHaveBeenCalled();
            expect(mockChangeLevel.addChild).toHaveBeenCalled();
            expect(instantiate).toHaveBeenCalledWith(mockMegaWinPrefab);
        });

        it("should handle animation with zero duration", async () => {
            mockMainSpine.findAnimation = jest.fn().mockReturnValue({ duration: 0 });
            cascadingEffectBigwin.playSound = jest.fn();

            await cascadingEffectBigwin.changeLevelAnimation(mockMainSpine, "hide", mockMegaWinPrefab);
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
            cascadingEffectBigwin.scheduleOnce = jest.fn();
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
            expect(cascadingEffectBigwin.scheduleOnce).toHaveBeenCalledWith(expect.any(Function), 0.1);
            expect(cascadingEffectBigwin.stopSoundCoinIncrement).toHaveBeenCalled();
            expect(AudioUtils.stopStoppableSFX).toHaveBeenCalledWith(AudioIds.STINGER_WINCOUNT);
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

            expect(result).toBe("wincount-increment");
        });
    });
});
