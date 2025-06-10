import { CascadingSlotState } from "../../assets/cascading-slot-state";
import { SlotNotification, SpinButtonState } from "../../assets/cascading-slot-utils";
import { AutoPlayStore } from "../../assets/stores/auto-play-store";
import { CascadingSlotConfigsStore } from "../../assets/stores/cascading-slot-configs-store";
import { CascadingSlotTumblesStore } from "../../assets/stores/cascading-slot-tumbles-store";
import { CascadingUIStore } from "../../assets/stores/cascading-ui-store";
import { HoldActionStore } from "../../assets/stores/hold-action-store";

// Mock the dependencies
jest.mock("../../assets/stores/auto-play-store");
jest.mock("../../assets/stores/cascading-slot-configs-store");
jest.mock("../../assets/stores/cascading-slot-tumbles-store");
jest.mock("../../assets/stores/hold-action-store");

// Mock the gc module
const mockMainPlayerStore = {
    balance: 1000,
};

jest.mock("@sg/game-client-base", () => ({
    Player: {
        MainPlayerStore: jest.fn(() => mockMainPlayerStore),
    },
}));

describe("CascadingUIStore", () => {
    let store: CascadingUIStore;
    let mockAutoPlayStore: jest.Mocked<AutoPlayStore>;
    let mockTumblesStore: jest.Mocked<CascadingSlotTumblesStore>;
    let mockConfigsStore: jest.Mocked<CascadingSlotConfigsStore>;
    let mockHoldActionStore: jest.Mocked<HoldActionStore>;

    beforeEach(() => {
        // Create mock instances
        mockAutoPlayStore = {
            isAutoplay: false,
        } as any;

        mockTumblesStore = {
            tumbles: [],
        } as any;

        mockConfigsStore = {
            trialUser: null,
        } as any;

        mockHoldActionStore = {
            isHolding: false,
            triggerAction: null,
        } as any;

        // Create store instance
        store = new CascadingUIStore();

        // Manually inject the mocked dependencies
        (store as any).autoPlayStore = mockAutoPlayStore;
        (store as any).tumblesStore = mockTumblesStore;
        (store as any).configsStore = mockConfigsStore;
        (store as any).holdActionStore = mockHoldActionStore;
        (store as any).mainPlayerStore = mockMainPlayerStore;
    });

    describe("constructor and initial state", () => {
        it("should initialize with default values", () => {
            expect(store.totalWin).toBe(0);
            expect(store.totalTumbleWin).toBe(0);
            expect(store.isActualWin).toBe(false);
            expect(store.multiplier).toBe(0);
            expect(store.totalMultiplier).toBe(0);
            expect(store.isShowTotalMultiplierJoinGame).toBe(false);
            expect(store.isTurboModeUI).toBe(false);
            expect(store.isTrialMode).toBe(false);
            expect(store.cascadingState).toBe(CascadingSlotState.NOT_READY_BET);
            expect(store.isSymbolPreviewVisible).toBe(false);
            expect(store.bottomMessageState).toBe(SlotNotification.BEFORE_SPIN);
            expect(store.haveBigWin).toBe(false);
            expect(store.bigWinAmount).toBe(0);
            expect(store.isBigWinCompleted).toBe(false);
            expect(store.highlightScatters).toBe(false);
            expect(store.isHighlightScattersCompleted).toBe(false);
            expect(store.freeSpinsTotal).toBe(0);
            expect(store.freeSpinsByRound).toBe(0);
            expect(store.haveFreeSpin).toBe(false);
            expect(store.isFreeSpinEffectCompleted).toBe(false);
            expect(store.freespinCountMsgBottom).toBe(0);
            expect(store.isConnectedTrialService).toBe(false);
            expect(store.changeUserBalance).toBe(true);
            expect(store.showReachMaxWin).toBe(false);
            expect(store.roundId).toBe(0);
            expect(store.triggerCancelAutoPlay).toBeNull();
            expect(store.triggerWinMultiplier).toBeNull();
        });
    });

    describe("cascadingState property", () => {
        it("should get cascading state", () => {
            expect(store.cascadingState).toBe(CascadingSlotState.NOT_READY_BET);
        });

        it("should set cascading state", () => {
            store.cascadingState = CascadingSlotState.READY_BET;
            expect(store.cascadingState).toBe(CascadingSlotState.READY_BET);

            store.cascadingState = CascadingSlotState.SPINNING;
            expect(store.cascadingState).toBe(CascadingSlotState.SPINNING);

            store.cascadingState = CascadingSlotState.SETTLED;
            expect(store.cascadingState).toBe(CascadingSlotState.SETTLED);
        });
    });

    describe("isSymbolPreviewVisible property", () => {
        it("should get symbol preview visibility", () => {
            expect(store.isSymbolPreviewVisible).toBe(false);
        });

        it("should set symbol preview visibility", () => {
            store.isSymbolPreviewVisible = true;
            expect(store.isSymbolPreviewVisible).toBe(true);

            store.isSymbolPreviewVisible = false;
            expect(store.isSymbolPreviewVisible).toBe(false);
        });
    });

    describe("bottomMessageState property", () => {
        it("should get bottom message state", () => {
            expect(store.bottomMessageState).toBe(SlotNotification.BEFORE_SPIN);
        });

        it("should set bottom message state", () => {
            store.bottomMessageState = SlotNotification.SPINNING;
            expect(store.bottomMessageState).toBe(SlotNotification.SPINNING);

            store.bottomMessageState = SlotNotification.SETTLED;
            expect(store.bottomMessageState).toBe(SlotNotification.SETTLED);

            store.bottomMessageState = SlotNotification.TUMBLE_WIN;
            expect(store.bottomMessageState).toBe(SlotNotification.TUMBLE_WIN);
        });
    });

    describe("isTurboMode computed property", () => {
        it("should return true when isTurboModeUI is true", () => {
            store.isTurboModeUI = true;
            expect(store.isTurboMode).toBe(true);
        });

        it("should return true when holdActionStore.isHolding is true and not in trial mode", () => {
            store.isTurboModeUI = false;
            store.isTrialMode = false;
            mockHoldActionStore.isHolding = true;
            expect(store.isTurboMode).toBe(true);
        });

        it("should return false when holdActionStore.isHolding is true but in trial mode", () => {
            store.isTurboModeUI = false;
            store.isTrialMode = true;
            mockHoldActionStore.isHolding = true;
            expect(store.isTurboMode).toBe(false);
        });

        it("should return false when both conditions are false", () => {
            store.isTurboModeUI = false;
            store.isTrialMode = false;
            mockHoldActionStore.isHolding = false;
            expect(store.isTurboMode).toBe(false);
        });
    });

    describe("isShowBigWin computed property", () => {
        it("should return true when haveBigWin is true", () => {
            store.haveBigWin = true;
            store.isBigWinCompleted = true;
            expect(store.isShowBigWin).toBe(true);
        });

        it("should return true when isBigWinCompleted is false", () => {
            store.haveBigWin = false;
            store.isBigWinCompleted = false;
            expect(store.isShowBigWin).toBe(true);
        });

        it("should return false when haveBigWin is false and isBigWinCompleted is true", () => {
            store.haveBigWin = false;
            store.isBigWinCompleted = true;
            expect(store.isShowBigWin).toBe(false);
        });
    });

    describe("isShowHighlightScatters computed property", () => {
        it("should return true when both isBigWinCompleted and haveFreeSpin are true", () => {
            store.isBigWinCompleted = true;
            store.haveFreeSpin = true;
            expect(store.isShowHighlightScatters).toBe(true);
        });

        it("should return false when isBigWinCompleted is false", () => {
            store.isBigWinCompleted = false;
            store.haveFreeSpin = true;
            expect(store.isShowHighlightScatters).toBe(false);
        });

        it("should return false when haveFreeSpin is false", () => {
            store.isBigWinCompleted = true;
            store.haveFreeSpin = false;
            expect(store.isShowHighlightScatters).toBe(false);
        });
    });

    describe("isShowFreeSpinEffect computed property", () => {
        it("should return true when both isHighlightScattersCompleted and haveFreeSpin are true", () => {
            store.isHighlightScattersCompleted = true;
            store.haveFreeSpin = true;
            expect(store.isShowFreeSpinEffect).toBe(true);
        });

        it("should return false when isHighlightScattersCompleted is false", () => {
            store.isHighlightScattersCompleted = false;
            store.haveFreeSpin = true;
            expect(store.isShowFreeSpinEffect).toBe(false);
        });

        it("should return false when haveFreeSpin is false", () => {
            store.isHighlightScattersCompleted = true;
            store.haveFreeSpin = false;
            expect(store.isShowFreeSpinEffect).toBe(false);
        });
    });

    describe("isHideTopMessage computed property", () => {
        it("should return true when tumbles length > 1", () => {
            mockTumblesStore.tumbles = [{ win: 10 }, { win: 20 }] as any;
            store.totalMultiplier = 0;
            expect(store.isHideTopMessage).toBe(true);
        });

        it("should return true when totalMultiplier > 0", () => {
            mockTumblesStore.tumbles = [];
            store.totalMultiplier = 5;
            expect(store.isHideTopMessage).toBe(true);
        });

        it("should return false when both conditions are false", () => {
            mockTumblesStore.tumbles = [];
            store.totalMultiplier = 0;
            expect(store.isHideTopMessage).toBe(false);
        });
    });

    describe("isFreeSpins computed property", () => {
        it("should return true when freeSpinsTotal > 0", () => {
            store.freeSpinsTotal = 5;
            expect(store.isFreeSpins).toBe(true);
        });

        it("should return false when freeSpinsTotal is 0", () => {
            store.freeSpinsTotal = 0;
            expect(store.isFreeSpins).toBe(false);
        });
    });

    describe("userBalance computed property", () => {
        it("should return trial user balance when in trial mode", () => {
            store.isTrialMode = true;
            const mockTrialUser = { balance: 500, rate: 1, multiplier: 1 };
            mockConfigsStore.trialUser = mockTrialUser;
            expect(store.userBalance).toBe(500);
        });

        it("should return main player balance when not in trial mode", () => {
            store.isTrialMode = false;
            expect(store.userBalance).toBe(1000);
        });

        it("should return undefined when trial user is null in trial mode", () => {
            store.isTrialMode = true;
            mockConfigsStore.trialUser = null;
            expect(store.userBalance).toBeUndefined();
        });
    });

    describe("disabledTurboMode computed property", () => {
        it("should return true when holdActionStore.isHolding is true", () => {
            mockHoldActionStore.isHolding = true;
            store.isTrialMode = false;
            expect(store.disabledTurboMode).toBe(true);
        });

        it("should return true when isTrialMode is true", () => {
            mockHoldActionStore.isHolding = false;
            store.isTrialMode = true;
            expect(store.disabledTurboMode).toBe(true);
        });

        it("should return false when both conditions are false", () => {
            mockHoldActionStore.isHolding = false;
            store.isTrialMode = false;
            expect(store.disabledTurboMode).toBe(false);
        });
    });

    describe("haveEventGame computed property", () => {
        it("should return true when haveBigWin is true", () => {
            store.haveBigWin = true;
            store.isHighlightScattersCompleted = false;
            store.haveFreeSpin = false;
            expect(store.haveEventGame).toBe(true);
        });

        it("should return true when isShowFreeSpinEffect is true", () => {
            store.haveBigWin = false;
            store.isHighlightScattersCompleted = true;
            store.haveFreeSpin = true;
            expect(store.haveEventGame).toBe(true);
        });

        it("should return false when both conditions are false", () => {
            store.haveBigWin = false;
            store.isHighlightScattersCompleted = false;
            store.haveFreeSpin = false;
            expect(store.haveEventGame).toBe(false);
        });
    });

    describe("spinButtonState computed property", () => {
        it("should return WIN_TUMBLE_OR_EVENT when spinning and haveBigWin is true", () => {
            store.cascadingState = CascadingSlotState.SPINNING;
            store.haveBigWin = true;
            store.haveFreeSpin = false;
            mockTumblesStore.tumbles = [];
            expect(store.spinButtonState).toBe(SpinButtonState.WIN_TUMBLE_OR_EVENT);
        });

        it("should return WIN_TUMBLE_OR_EVENT when spinning and haveFreeSpin is true", () => {
            store.cascadingState = CascadingSlotState.SPINNING;
            store.haveBigWin = false;
            store.haveFreeSpin = true;
            mockTumblesStore.tumbles = [];
            expect(store.spinButtonState).toBe(SpinButtonState.WIN_TUMBLE_OR_EVENT);
        });

        it("should return WIN_TUMBLE_OR_EVENT when spinning and tumbles length > 1", () => {
            store.cascadingState = CascadingSlotState.SPINNING;
            store.haveBigWin = false;
            store.haveFreeSpin = false;
            mockTumblesStore.tumbles = [{ win: 10 }, { win: 20 }] as any;
            expect(store.spinButtonState).toBe(SpinButtonState.WIN_TUMBLE_OR_EVENT);
        });

        it("should return SPINNING when spinning and no special conditions", () => {
            store.cascadingState = CascadingSlotState.SPINNING;
            store.haveBigWin = false;
            store.haveFreeSpin = false;
            mockTumblesStore.tumbles = [];
            expect(store.spinButtonState).toBe(SpinButtonState.SPINNING);
        });

        it("should return IDLE when not spinning", () => {
            store.cascadingState = CascadingSlotState.READY_BET;
            expect(store.spinButtonState).toBe(SpinButtonState.IDLE);
        });
    });

    describe("disabledSpinButton computed property", () => {
        it("should return true when cascadingState is SPINNING", () => {
            store.cascadingState = CascadingSlotState.SPINNING;
            mockHoldActionStore.triggerAction = null;
            expect(store.disabledSpinButton).toBe(true);
        });

        it("should return true when cascadingState is NOT_READY_BET", () => {
            store.cascadingState = CascadingSlotState.NOT_READY_BET;
            mockHoldActionStore.triggerAction = null;
            expect(store.disabledSpinButton).toBe(true);
        });

        it("should return true when holdActionStore.triggerAction is truthy", () => {
            store.cascadingState = CascadingSlotState.READY_BET;
            mockHoldActionStore.triggerAction = {};
            expect(!!store.disabledSpinButton).toBe(true);
        });

        it("should return false when all conditions are false", () => {
            store.cascadingState = CascadingSlotState.READY_BET;
            mockHoldActionStore.triggerAction = null;
            expect(!!store.disabledSpinButton).toBe(false);
        });
    });

    describe("disabledChangeTrialMode computed property", () => {
        it("should return true when cascadingState is SPINNING", () => {
            store.cascadingState = CascadingSlotState.SPINNING;
            store.freeSpinsTotal = 0;
            store.isTrialMode = false;
            expect(store.disabledChangeTrialMode).toBe(true);
        });

        it("should return true when isFreeSpins is true and not in trial mode", () => {
            store.cascadingState = CascadingSlotState.READY_BET;
            store.freeSpinsTotal = 5;
            store.isTrialMode = false;
            expect(store.disabledChangeTrialMode).toBe(true);
        });

        it("should return false when isFreeSpins is true but in trial mode", () => {
            store.cascadingState = CascadingSlotState.READY_BET;
            store.freeSpinsTotal = 5;
            store.isTrialMode = true;
            expect(store.disabledChangeTrialMode).toBe(false);
        });

        it("should return false when all conditions are false", () => {
            store.cascadingState = CascadingSlotState.READY_BET;
            store.freeSpinsTotal = 0;
            store.isTrialMode = false;
            expect(store.disabledChangeTrialMode).toBe(false);
        });
    });

    describe("disabledAutoPlay computed property", () => {
        it("should return false when autoplay is active", () => {
            mockAutoPlayStore.isAutoplay = true;
            mockHoldActionStore.isHolding = true;
            store.freeSpinsTotal = 5;
            store.isTrialMode = true;
            store.cascadingState = CascadingSlotState.SPINNING;
            expect(store.disabledAutoPlay).toBe(false);
        });

        it("should return true when holdActionStore.isHolding is true and autoplay is inactive", () => {
            mockAutoPlayStore.isAutoplay = false;
            mockHoldActionStore.isHolding = true;
            store.freeSpinsTotal = 0;
            store.isTrialMode = false;
            store.cascadingState = CascadingSlotState.READY_BET;
            expect(store.disabledAutoPlay).toBe(true);
        });

        it("should return true when isFreeSpins is true and autoplay is inactive", () => {
            mockAutoPlayStore.isAutoplay = false;
            mockHoldActionStore.isHolding = false;
            store.freeSpinsTotal = 5;
            store.isTrialMode = false;
            store.cascadingState = CascadingSlotState.READY_BET;
            expect(store.disabledAutoPlay).toBe(true);
        });

        it("should return true when isTrialMode is true and autoplay is inactive", () => {
            mockAutoPlayStore.isAutoplay = false;
            mockHoldActionStore.isHolding = false;
            store.freeSpinsTotal = 0;
            store.isTrialMode = true;
            store.cascadingState = CascadingSlotState.READY_BET;
            expect(store.disabledAutoPlay).toBe(true);
        });

        it("should return true when cascadingState is SPINNING and autoplay is inactive", () => {
            mockAutoPlayStore.isAutoplay = false;
            mockHoldActionStore.isHolding = false;
            store.freeSpinsTotal = 0;
            store.isTrialMode = false;
            store.cascadingState = CascadingSlotState.SPINNING;
            expect(store.disabledAutoPlay).toBe(true);
        });

        it("should return false when all conditions are false and autoplay is inactive", () => {
            mockAutoPlayStore.isAutoplay = false;
            mockHoldActionStore.isHolding = false;
            store.freeSpinsTotal = 0;
            store.isTrialMode = false;
            store.cascadingState = CascadingSlotState.READY_BET;
            expect(store.disabledAutoPlay).toBe(false);
        });
    });

    describe("disabledOpenInputBet computed property", () => {
        it("should return true when isFreeSpins is true", () => {
            store.freeSpinsTotal = 5;
            store.cascadingState = CascadingSlotState.READY_BET;
            expect(store.disabledOpenInputBet).toBe(true);
        });

        it("should return true when cascadingState is SPINNING", () => {
            store.freeSpinsTotal = 0;
            store.cascadingState = CascadingSlotState.SPINNING;
            expect(store.disabledOpenInputBet).toBe(true);
        });

        it("should return false when both conditions are false", () => {
            store.freeSpinsTotal = 0;
            store.cascadingState = CascadingSlotState.READY_BET;
            expect(store.disabledOpenInputBet).toBe(false);
        });
    });

    describe("property updates", () => {
        it("should update basic properties correctly", () => {
            store.totalWin = 500;
            store.totalTumbleWin = 200;
            store.isActualWin = true;
            store.multiplier = 3;
            store.totalMultiplier = 10;
            store.isTurboModeUI = true;
            store.isTrialMode = true;

            expect(store.totalWin).toBe(500);
            expect(store.totalTumbleWin).toBe(200);
            expect(store.isActualWin).toBe(true);
            expect(store.multiplier).toBe(3);
            expect(store.totalMultiplier).toBe(10);
            expect(store.isTurboModeUI).toBe(true);
            expect(store.isTrialMode).toBe(true);
        });

        it("should update big win properties correctly", () => {
            store.haveBigWin = true;
            store.bigWinAmount = 1000;
            store.isBigWinCompleted = true;

            expect(store.haveBigWin).toBe(true);
            expect(store.bigWinAmount).toBe(1000);
            expect(store.isBigWinCompleted).toBe(true);
        });

        it("should update free spin properties correctly", () => {
            store.freeSpinsTotal = 10;
            store.freeSpinsByRound = 3;
            store.haveFreeSpin = true;
            store.isFreeSpinEffectCompleted = true;
            store.freespinCountMsgBottom = 7;

            expect(store.freeSpinsTotal).toBe(10);
            expect(store.freeSpinsByRound).toBe(3);
            expect(store.haveFreeSpin).toBe(true);
            expect(store.isFreeSpinEffectCompleted).toBe(true);
            expect(store.freespinCountMsgBottom).toBe(7);
        });
    });
});
