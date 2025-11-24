import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { BuyFreespinsStore } from "db://shared-cascading-slot/buy-freespins/handler/buy-freespins-store";
import { CascadingUIStore } from "db://shared-cascading-slot/stores/cascading-ui-store";
import inversify from "inversify";
import { stub } from "jest-auto-stub";
import mobx from "mobx";
import { CascadingSlotState } from "../../assets/cascading-slot-state";
import { SlotNotification } from "../../assets/cascading-slot-utils";
import { GameServiceMessageCascading } from "../../assets/game-messages-cascading";
import { CascadingUIHandler } from "../../assets/handlers/cascading-ui-handler";

// Mock dependencies
jest.mock("@sg/game-client-base");
jest.mock("inversify");
jest.mock("mobx");

// Mock stores
const mockUIStore = stub<CascadingUIStore>();
Object.defineProperty(mockUIStore, "isFreeSpins", {
    get() {
        return this.freeSpinsTotal > 0;
    },
});

const mockTumblesStore = {
    tumbles: [],
};

const mockSettlementStore = {
    finishData: null,
};

const mockBetControlStore = {
    coinValue: 0.01,
    betLevel: 1,
    lastSetting: null,
    needClearLastSetting: false,
};

const mockConfigsStore = {};

const mockBetControlHandlers = {
    init: jest.fn(),
    setTotalBet: jest.fn(),
};

const mockUserSettingHandlers = {};

const mockGameUserSettingHandler = {
    saveTempStorage: jest.fn(),
};

const mockFSBPromotionUIStore = {
    isFSBPromotionInProgress: false,
    isSpinningFSB: false,
};

describe("CascadingUIHandler", () => {
    let uiHandler: CascadingUIHandler;
    let setTimeoutSpy: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        mockTumblesStore.tumbles = [];
        mockSettlementStore.finishData = null;
        mockBetControlStore.lastSetting = null;
        mockBetControlStore.needClearLastSetting = false;

        // Mock setTimeout to execute immediately
        setTimeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation((callback: any) => {
            if (typeof callback === "function") {
                callback();
            }
            return 1 as any;
        });

        // Mock mobx.reaction
        (mobx.reaction as jest.Mock) = jest.fn();

        // Set mock stores directly on the prototype
        (CascadingUIHandler.prototype as any).uiStore = mockUIStore;
        (CascadingUIHandler.prototype as any).tumblesStore = mockTumblesStore;
        (CascadingUIHandler.prototype as any).buyFsStore = stub<BuyFreespinsStore>();
        (CascadingUIHandler.prototype as any).settlementStore = mockSettlementStore;
        (CascadingUIHandler.prototype as any).betControlStore = mockBetControlStore;
        (CascadingUIHandler.prototype as any).configsStore = mockConfigsStore;
        (CascadingUIHandler.prototype as any).betControlHandlers = mockBetControlHandlers;
        (CascadingUIHandler.prototype as any).userSettingHandlers = mockUserSettingHandlers;
        (CascadingUIHandler.prototype as any).gameUserSettingHandler = mockGameUserSettingHandler;
        (CascadingUIHandler.prototype as any).fsbPromotionUIStore = mockFSBPromotionUIStore;

        // Mock inversify decorators
        (inversify.injectable as jest.Mock) = jest.fn(() => (target: any) => target);
        (inversify.inject as jest.Mock) = jest.fn(() => (target: any, propertyKey: string) => {});

        uiHandler = new CascadingUIHandler();
    });

    afterEach(() => {
        setTimeoutSpy?.mockRestore();
    });

    describe("constructor", () => {
        it("should create instance with proper dependencies", () => {
            expect(uiHandler).toBeInstanceOf(CascadingUIHandler);
            expect((uiHandler as any).uiStore).toBeDefined();
        });

        it("should set up mobx reactions for bet control changes", () => {
            expect(mobx.reaction).toHaveBeenCalledTimes(2);
        });
    });

    describe("handleTotalWin", () => {
        it("should accumulate win when isActualWin is false", () => {
            mockUIStore.totalWin = 0;
            uiHandler.handleTotalWin({ win: 100, isActualWin: false });

            expect(mockUIStore.isActualWin).toBe(false);
            expect(mockUIStore.totalWin).toBe(100);

            uiHandler.handleTotalWin({ win: 50, isActualWin: false });
            expect(mockUIStore.totalWin).toBe(150);
        });

        it("should set exact win when isActualWin is true", () => {
            mockUIStore.totalWin = 100;

            uiHandler.handleTotalWin({ win: 200, isActualWin: true });

            expect(mockUIStore.isActualWin).toBe(true);
            expect(mockUIStore.totalWin).toBe(200);
        });

        it("should default isActualWin to false", () => {
            mockUIStore.totalWin = 0;
            uiHandler.handleTotalWin({ win: 100 });

            expect(mockUIStore.isActualWin).toBe(false);
            expect(mockUIStore.totalWin).toBe(100);
        });
    });

    describe("handleFreeSpinsTotal", () => {
        it("should set free spins total", () => {
            uiHandler.handleFreeSpinsTotal(10);
            expect(mockUIStore.freeSpinsTotal).toBe(10);
        });
    });

    describe("handleFreeSpinsByRound", () => {
        it("should set free spins by round", () => {
            uiHandler.handleFreeSpinsByRound(5);
            expect(mockUIStore.freeSpinsByRound).toBe(5);
        });
    });

    describe("handleMultiplier", () => {
        it("should accumulate multiplier", () => {
            mockUIStore.multiplier = 0;
            uiHandler.handleMultiplier(2);
            expect(mockUIStore.multiplier).toBe(2);

            uiHandler.handleMultiplier(3);
            expect(mockUIStore.multiplier).toBe(5);
        });
    });

    describe("handleOnGameHide", () => {
        it("should reset bottom message state and trigger cancel auto play", () => {
            jest.spyOn(uiHandler, "resetBottomMessageState");
            uiHandler.handleOnGameHide();

            expect(uiHandler.resetBottomMessageState).toHaveBeenCalled();
            expect(mockUIStore.triggerCancelAutoPlay).toEqual({});
        });
    });

    describe("handlePlaceBetFailed", () => {
        describe("call handlePlaceBetFailed default FALSE", () => {
            it("should reset state and NOT clear free spins ,NOT reset bottom message state", () => {
                mockUIStore.freeSpinsTotal = 10;
                mockUIStore.freeSpinsByRound = 5;
                mockUIStore.isPlacingBet = true;
                mockUIStore.bottomMessageState = SlotNotification.FREESPINS;
                jest.spyOn(uiHandler, "resetBottomMessageState");

                uiHandler.handlePlaceBetFailed();

                expect(mockUIStore.cascadingState).toBe(CascadingSlotState.READY_BET);
                expect(uiHandler.resetBottomMessageState).not.toHaveBeenCalled();
                expect(mockUIStore.triggerCancelAutoPlay).toEqual({});
                expect(mockUIStore.isPlacingBet).toBe(false);
                expect(mockUIStore.freeSpinsTotal).toBe(10);
                expect(mockUIStore.freeSpinsByRound).toBe(5);
            });

            it("should call updateFreespinCountMsgBottom", () => {
                mockUIStore.freeSpinsTotal = 10;
                mockUIStore.freeSpinsByRound = 5;
                mockUIStore.isPlacingBet = true;
                jest.spyOn(uiHandler, "updateFreespinCountMsgBottom");

                uiHandler.handlePlaceBetFailed();

                expect(uiHandler.updateFreespinCountMsgBottom).toHaveBeenCalledWith(mockUIStore.freeSpinsTotal);
            });
        });

        it("should reset state and clear free spins, call reset bottom message state", () => {
            mockUIStore.freeSpinsTotal = 10;
            mockUIStore.freeSpinsByRound = 5;
            mockUIStore.isPlacingBet = true;
            jest.spyOn(uiHandler, "resetBottomMessageState");
            jest.spyOn(uiHandler, "updateFreespinCountMsgBottom");

            uiHandler.handlePlaceBetFailed(true);

            expect(mockUIStore.cascadingState).toBe(CascadingSlotState.READY_BET);
            expect(uiHandler.resetBottomMessageState).toHaveBeenCalled();
            expect(mockUIStore.triggerCancelAutoPlay).toEqual({});
            expect(mockUIStore.isPlacingBet).toBe(false);
            expect(mockUIStore.freeSpinsTotal).toBe(0);
            expect(mockUIStore.freeSpinsByRound).toBe(0);

            expect(uiHandler.updateFreespinCountMsgBottom).not.toBeCalled();
        });

        it("should call reset bottom message state, when auto spin", () => {
            mockUIStore.bottomMessageState = SlotNotification.AUTO_SPIN;
            jest.spyOn(uiHandler, "resetBottomMessageState");

            uiHandler.handlePlaceBetFailed();

            expect(uiHandler.resetBottomMessageState).toHaveBeenCalled();
        });
    });

    describe("resetBottomMessageState", () => {
        it("should set BEFORE_SPIN when not in trial mode", () => {
            mockUIStore.isTrialMode = false;

            uiHandler.resetBottomMessageState();

            expect(mockUIStore.bottomMessageState).toBe(SlotNotification.BEFORE_SPIN);
        });

        it("should set BEFORE_SPIN_TRIAL when in trial mode", () => {
            mockUIStore.isTrialMode = true;

            uiHandler.resetBottomMessageState();

            expect(mockUIStore.bottomMessageState).toBe(SlotNotification.BEFORE_SPIN_TRIAL);
        });
    });

    describe("handleNewRound", () => {
        it("should reset all round-specific state", () => {
            // Set up initial state
            mockTumblesStore.tumbles = [{ id: 1 }];
            mockUIStore.totalTumbleWin = 100;
            mockSettlementStore.finishData = { some: "data" };
            mockUIStore.isFreeSpinEffectCompleted = true;
            mockUIStore.isBigWinCompleted = true;
            mockUIStore.isHighlightScattersCompleted = true;
            mockUIStore.showReachMaxWin = true;
            mockUIStore.multiplier = 5;
            mockUIStore.totalMultiplier = 10;
            mockUIStore.totalWin = 200;

            uiHandler.handleNewRound();

            expect(mockTumblesStore.tumbles).toEqual([]);
            expect(mockUIStore.totalTumbleWin).toBe(0);
            expect(mockSettlementStore.finishData).toBe(null);
            expect(mockUIStore.isFreeSpinEffectCompleted).toBe(false);
            expect(mockUIStore.isBigWinCompleted).toBe(false);
            expect(mockUIStore.isHighlightScattersCompleted).toBe(false);
            expect(mockUIStore.showReachMaxWin).toBe(false);
            expect(mockUIStore.multiplier).toBe(0);
            expect(mockUIStore.totalMultiplier).toBe(0);
            expect(mockUIStore.totalWin).toBe(0);
        });

        it("should preserve totalMultiplier during free spins", () => {
            mockUIStore.totalMultiplier = 5;
            mockUIStore.totalMultiplier = 10;
            mockUIStore.freeSpinsTotal = 5;

            uiHandler.handleNewRound();

            expect(mockUIStore.totalMultiplier).toBe(10);
        });
    });

    describe("changeCascadingState", () => {
        it("should update cascading state", () => {
            uiHandler.changeCascadingState(CascadingSlotState.SPINNING);
            expect(mockUIStore.cascadingState).toBe(CascadingSlotState.SPINNING);
        });
    });

    describe("handleBottomMessage", () => {
        it("should update bottom message state", () => {
            uiHandler.handleBottomMessage(SlotNotification.SPINNING);
            expect(mockUIStore.bottomMessageState).toBe(SlotNotification.SPINNING);
        });

        it("should not change state when in FREESPINS mode", () => {
            mockUIStore.bottomMessageState = SlotNotification.FREESPINS;

            uiHandler.handleBottomMessage(SlotNotification.SPINNING);

            expect(mockUIStore.bottomMessageState).toBe(SlotNotification.FREESPINS);
        });

        it("should not change state when in AUTO_SPIN mode", () => {
            mockUIStore.bottomMessageState = SlotNotification.AUTO_SPIN;

            uiHandler.handleBottomMessage(SlotNotification.SPINNING);

            expect(mockUIStore.bottomMessageState).toBe(SlotNotification.AUTO_SPIN);
        });
    });

    describe("handleFreespinsJoinGame", () => {
        it("should handle valid freespins data", () => {
            const freespins = {
                total: 10,
                betLevel: 5,
                coinValue: 0.05,
                betMultiplier: 2,
            };

            uiHandler.handleFreespinsJoinGame(freespins);

            expect(mockUIStore.freeSpinsTotal).toBe(10);
            expect(mockUIStore.bottomMessageState).toBe(SlotNotification.FREESPINS);
            expect(mockUIStore.freespinCountMsgBottom).toBe(10);
            expect(mockBetControlHandlers.init).toHaveBeenCalledWith(0.05, 5);
        });

        it("should handle empty freespins with last setting", () => {
            mockBetControlStore.lastSetting = { betLevel: 3, coinValue: 0.02 };

            uiHandler.handleFreespinsJoinGame(null);

            expect(mockBetControlHandlers.init).toHaveBeenCalledWith(0.02, 3);
        });

        it("should handle empty freespins without last setting", () => {
            uiHandler.handleFreespinsJoinGame(null);

            expect(mockBetControlHandlers.init).toHaveBeenCalledWith();
        });
    });

    describe("handleChangeMode", () => {
        it("should switch to trial mode", () => {
            uiHandler.handleChangeMode(true);

            expect(mockUIStore.isTrialMode).toBe(true);
            expect(mockUIStore.bottomMessageState).toBe(SlotNotification.BEFORE_SPIN_TRIAL);
            expect(mockUIStore.gameSpeed).toBe(false);
            expect(mockUIStore.roundId).toBe(0);
            expect(mockBetControlStore.needClearLastSetting).toBe(true);
            expect(mockGameUserSettingHandler.saveTempStorage).toHaveBeenCalled();
        });

        it("should switch from trial mode when cascading state is READY_BET", () => {
            mockUIStore.cascadingState = CascadingSlotState.READY_BET;

            uiHandler.handleChangeMode(false);

            expect(mockUIStore.isTrialMode).toBe(false);
            expect(mockUIStore.bottomMessageState).toBe(SlotNotification.BEFORE_SPIN);
        });

        it("should switch from trial mode when cascading state is not READY_BET", () => {
            mockUIStore.cascadingState = CascadingSlotState.SPINNING;

            uiHandler.handleChangeMode(false);

            expect(mockUIStore.isTrialMode).toBe(false);
            expect(mockUIStore.bottomMessageState).toBe(SlotNotification.SETTLED);
        });
    });

    describe("eventHandleList", () => {
        it("should have correct event configuration", () => {
            expect(uiHandler.eventHandleList).toBeDefined();
            expect(Array.isArray(uiHandler.eventHandleList)).toBe(true);
            expect(uiHandler.eventHandleList).toHaveLength(2);
        });

        it("should have CascadingFreeSpinsMsg event mapped correctly", () => {
            const freeSpinsEvent = uiHandler.eventHandleList.find(
                (event) => event.name === GameServiceMessageCascading.CascadingFreeSpinsMsg.eventName
            );

            expect(freeSpinsEvent).toBeDefined();
            expect(freeSpinsEvent.handle).toBe(uiHandler.handleFreespinsJoinGame);
        });

        it("should have CascadingTotalMultiplierMsg event mapped correctly", () => {
            const multiplierEvent = uiHandler.eventHandleList.find(
                (event) => event.name === GameServiceMessageCascading.CascadingTotalMultiplierMsg.eventName
            );

            expect(multiplierEvent).toBeDefined();
            expect(multiplierEvent.handle).toBe(uiHandler.handleTotalMultiplier);
        });
    });

    describe("big win handling", () => {
        it("should handle big win amount", () => {
            uiHandler.handleBigWinAmount(500);
            expect(mockUIStore.bigWinAmount).toBe(500);
        });

        it("should handle have big win when settlement data exists", () => {
            mockSettlementStore.finishData = { freeSpins: 5, bigWin: true };

            uiHandler.handleHaveBigWin(true);

            expect(mockUIStore.haveBigWin).toBe(true);
        });

        it("should handle big win completed", () => {
            mockSettlementStore.finishData = { freeSpins: 0 };

            uiHandler.handleBigWinCompleted(true);

            expect(mockUIStore.haveBigWin).toBe(false);
            expect(mockUIStore.isBigWinCompleted).toBe(true);
        });
    });

    describe("utility methods", () => {
        it("should handle turbo mode UI", () => {
            uiHandler.handleTurboModeUI(true);
            expect(mockUIStore.gameSpeed).toBe(true);
        });

        it("should save game user settings", () => {
            uiHandler.saveGameUserSettings();
            expect(mockGameUserSettingHandler.saveTempStorage).toHaveBeenCalled();
        });

        it("should set reach max win", () => {
            uiHandler.setReachMaxWin(true);
            expect(mockUIStore.showReachMaxWin).toBe(true);
        });

        it("should trigger win multiplier", () => {
            uiHandler.handleTriggerWinMultiplier();
            expect(mockUIStore.triggerWinMultiplier).toEqual({});
        });
    });
});
