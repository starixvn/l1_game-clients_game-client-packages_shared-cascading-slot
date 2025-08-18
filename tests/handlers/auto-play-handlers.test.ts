import { CascadingSlotState } from "../../assets/cascading-slot-state";
import { SlotNotification } from "../../assets/cascading-slot-utils";
import { AutoPlayHandler } from "../../assets/handlers/auto-play-handlers";
import { CascadingUIHandler } from "../../assets/handlers/cascading-ui-handler";
import { SlotBetHandler } from "../../assets/handlers/slot-bet-handler";
import { AutoPlayStore } from "../../assets/stores/auto-play-store";
import { BetControlStore } from "../../assets/stores/bet-control-store";
import { CascadingUIStore } from "../../assets/stores/cascading-ui-store";
import { HoldActionStore } from "../../assets/stores/hold-action-store";
import mobx from "mobx";

// Mock the dependencies
jest.mock("../../assets/stores/auto-play-store");
jest.mock("../../assets/stores/bet-control-store");
jest.mock("../../assets/stores/cascading-ui-store");
jest.mock("../../assets/stores/hold-action-store");
jest.mock("../../assets/handlers/cascading-ui-handler");
jest.mock("../../assets/handlers/slot-bet-handler");

// Provide a harmless implementation for makeAutoObservable in tests
(mobx.makeAutoObservable as jest.Mock).mockImplementation(() => undefined);

// Mock the gc module
const mockBetStore = {
    availableBalance: 1000,
    lastReceivedBet: null,
    freebetEnabled: false,
};

const mockNoticeStore = {
    addWarning: jest.fn(),
};

const mockErrorStore = {
    apiError: null,
};

const mockRoundStore = {
    minBet: 1,
};

jest.mock("@sg/game-client-base", () => ({
    Bet: {
        BetStore: jest.fn(() => mockBetStore),
        BetHandler: class MockBetHandler { },
    },
    Notices: {
        NoticeStore: jest.fn(() => mockNoticeStore),
    },
    Error: {
        ErrorStore: jest.fn(() => mockErrorStore),
    },
    Rounds: {
        RoundStore: jest.fn(() => mockRoundStore),
    },
    Player: {
        MainPlayerStore: jest.fn(() => ({ balance: 1000 })),
    },
    Connection: {
        ConnectionTrialStore: jest.fn(() => ({
            send: jest.fn(),
        })),
    },
    UserSettings: {
        UserSettingHandlers: jest.fn(() => ({})),
    },

    GameUserSettings: {
        GameUserSettingHandler: jest.fn(() => ({})),
    },
    Translator: {
        commonTranslate: jest.fn((key, params) => {
            if (key === "not_enough_money") return "Not enough money";
            if (key === "not_enough_scoin") return "Not enough scoin";
            if (key === "message_min_bet_notice") return `Minimum bet is ${params?.minBet}`;
            return key;
        }),
    },
}));

// Mock setTimeout to avoid actual delays in tests
jest.useFakeTimers();

describe("AutoPlayHandler", () => {
    let handler: AutoPlayHandler;
    let mockAutoPlayStore: jest.Mocked<AutoPlayStore>;
    let mockCascadingUIStore: jest.Mocked<CascadingUIStore>;
    let mockBetControlStore: jest.Mocked<BetControlStore>;
    let mockHoldActionStore: jest.Mocked<HoldActionStore>;
    let mockCascadingUIHandler: jest.Mocked<CascadingUIHandler>;
    let mockSlotBetHandler: jest.Mocked<SlotBetHandler>;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        jest.clearAllTimers();

        // Create mock instances
        mockAutoPlayStore = {
            isAutoplay: false,
            isOpenAutoplayPopup: false,
            roundsAutoplay: 0,
            selectedRoundOnPopup: 10,
            roundsList: [10, 30, 50, 100],
            triggerBet: null,
        } as any;

        mockCascadingUIStore = {
            freeSpinsTotal: 0,
            bottomMessageState: SlotNotification.BEFORE_SPIN,
            triggerCancelAutoPlay: null,
        } as any;

        mockBetControlStore = {
            totalBet: 100,
            resumeLastBet: false,
        } as any;

        mockHoldActionStore = {
            triggerAction: null,
        } as any;

        mockCascadingUIHandler = {
            handlePlaceBetFailed: jest.fn(),
            handleNewRound: jest.fn(),
            updateFreespinCountMsgBottom: jest.fn(),
            resetBottomMessageState: jest.fn(),
            changeCascadingState: jest.fn(),
        } as any;

        mockSlotBetHandler = {
            handle: jest.fn().mockReturnValue(true),
        } as any;

        // Create handler instance
        handler = new AutoPlayHandler();

        // Manually inject the mocked dependencies
        (handler as any).autoPlayStore = mockAutoPlayStore;
        (handler as any).cascadingUIStore = mockCascadingUIStore;
        (handler as any).betControlStore = mockBetControlStore;
        (handler as any).holdActionStore = mockHoldActionStore;
        (handler as any).cascadingUIHandler = mockCascadingUIHandler;
        (handler as any).slotBetHandler = mockSlotBetHandler;
        (handler as any).betStore = mockBetStore;
        (handler as any).noticeStore = mockNoticeStore;
        (handler as any).errorStore = mockErrorStore;
        (handler as any).roundStore = mockRoundStore;
        (handler as any).fsbPromotionUIStore = { isFSBPromotionInProgress: false } as any;
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    describe("constructor and initialization", () => {
        it("should initialize properly", () => {
            expect(handler).toBeInstanceOf(AutoPlayHandler);
        });

        it("should set up MobX reactions with setTimeout", () => {
            // The reactions are set up in setTimeout(0), so we need to advance timers
            expect(() => jest.runOnlyPendingTimers()).not.toThrow();
        });
    });

    describe("handle method", () => {
        it("should be implemented as empty function", () => {
            expect(() => handler.handle()).not.toThrow();
        });
    });

    describe("handleAutoPlaceBet method", () => {
        it("should place bet when valid bet", async () => {
            jest.spyOn(handler, "isValidBet").mockReturnValue(true);
            jest.spyOn(handler, "placeBet");

            await handler.handleAutoPlaceBet();

            expect(handler.isValidBet).toHaveBeenCalled();
            expect(handler.placeBet).toHaveBeenCalled();
        });

        it("should handle error when invalid bet", async () => {
            jest.spyOn(handler, "isValidBet").mockReturnValue(false);
            jest.spyOn(handler, "handleError");

            await handler.handleAutoPlaceBet();

            expect(handler.isValidBet).toHaveBeenCalled();
            expect(handler.handleError).toHaveBeenCalled();
        });
    });

    describe("handleError method", () => {
        it("should call cascadingUIHandler.handlePlaceBetFailed", () => {
            handler.handleError();
            expect(mockCascadingUIHandler.handlePlaceBetFailed).toHaveBeenCalled();
        });
    });

    describe("placeBet method", () => {
        it("should set triggerBet and call placeBetSilent", () => {
            jest.spyOn(handler, "placeBetSilent");

            handler.placeBet();

            expect(mockAutoPlayStore.triggerBet).toStrictEqual({});
            expect(handler.placeBetSilent).toHaveBeenCalled();
        });
    });

    describe("placeBetSilent method", () => {
        it("should handle new round and place bet successfully", () => {
            mockSlotBetHandler.handle.mockReturnValue(true);
            mockCascadingUIStore.freeSpinsTotal = 0;

            handler.placeBetSilent();

            expect(mockCascadingUIHandler.handleNewRound).toHaveBeenCalled();
            expect(mockSlotBetHandler.handle).toHaveBeenCalled();
        });

        it("should update freespin count when free spins available", () => {
            mockSlotBetHandler.handle.mockReturnValue(true);
            mockCascadingUIStore.freeSpinsTotal = 5;

            handler.placeBetSilent();

            expect(mockCascadingUIHandler.updateFreespinCountMsgBottom).toHaveBeenCalledWith(4);
        });

        it("should not update freespin count when bet fails", () => {
            mockSlotBetHandler.handle.mockReturnValue(false);
            mockCascadingUIStore.freeSpinsTotal = 5;

            handler.placeBetSilent();

            expect(mockCascadingUIHandler.updateFreespinCountMsgBottom).not.toHaveBeenCalled();
        });
    });

    describe("openAutoPlayPopup method", () => {
        it("should open popup and set selected round", () => {
            handler.openAutoPlayPopup();

            expect(mockAutoPlayStore.isOpenAutoplayPopup).toBe(true);
            expect(mockAutoPlayStore.selectedRoundOnPopup).toBe(10);
        });
    });

    describe("clickAutoPlay method", () => {
        it("should open popup when not autoplay and valid bet", () => {
            mockAutoPlayStore.isAutoplay = false;
            jest.spyOn(handler, "isValidBet").mockReturnValue(true);
            jest.spyOn(handler, "openAutoPlayPopup");

            handler.clickAutoPlay();

            expect(handler.openAutoPlayPopup).toHaveBeenCalled();
        });

        it("should cancel autoplay when already autoplay", () => {
            mockAutoPlayStore.isAutoplay = true;
            jest.spyOn(handler, "cancelAutoPlay");

            handler.clickAutoPlay();

            expect(handler.cancelAutoPlay).toHaveBeenCalled();
            expect(mockCascadingUIHandler.resetBottomMessageState).toHaveBeenCalled();
        });

        it("should cancel autoplay when invalid bet", () => {
            mockAutoPlayStore.isAutoplay = false;
            jest.spyOn(handler, "isValidBet").mockReturnValue(false);
            jest.spyOn(handler, "cancelAutoPlay");

            handler.clickAutoPlay();

            expect(handler.cancelAutoPlay).toHaveBeenCalled();
            expect(mockCascadingUIHandler.resetBottomMessageState).toHaveBeenCalled();
        });
    });

    describe("cancelAutoPlay method", () => {
        it("should stop autoplay and reset rounds", () => {
            jest.spyOn(handler, "updateAutoPlayRounds");

            handler.cancelAutoPlay();

            expect(mockAutoPlayStore.isAutoplay).toBe(false);
            expect(handler.updateAutoPlayRounds).toHaveBeenCalledWith(0);
        });
    });

    describe("isValidBet method", () => {
        it("should return true when enough money", () => {
            jest.spyOn(handler, "isEnoughMoney").mockReturnValue(true);

            const result = handler.isValidBet();

            expect(result).toBe(true);
        });

        it("should return false and show message when not enough money", () => {
            jest.spyOn(handler, "isEnoughMoney").mockReturnValue(false);

            const result = handler.isValidBet();

            expect(result).toBe(false);
            expect(mockNoticeStore.addWarning).toHaveBeenCalled();
        });
    });

    describe("isEnoughMoney method", () => {
        it("should return true when total bet <= available balance", () => {
            mockBetControlStore.totalBet = 500;
            mockBetStore.availableBalance = 1000;

            const result = handler.isEnoughMoney();

            expect(result).toBe(true);
        });

        it("should return false when total bet > available balance", () => {
            mockBetControlStore.totalBet = 1500;
            mockBetStore.availableBalance = 1000;

            const result = handler.isEnoughMoney();

            expect(result).toBe(false);
        });

        it("should return true when total bet = available balance", () => {
            mockBetControlStore.totalBet = 1000;
            mockBetStore.availableBalance = 1000;

            const result = handler.isEnoughMoney();

            expect(result).toBe(true);
        });
    });

    describe("isAmountGreaterMinBet method", () => {
        it("should return true when total bet >= min bet", () => {
            mockBetControlStore.totalBet = 5;
            mockRoundStore.minBet = 1;

            const result = handler.isAmountGreaterMinBet();

            expect(result).toBe(true);
        });

        it("should return false when total bet < min bet", () => {
            mockBetControlStore.totalBet = 0.5;
            mockRoundStore.minBet = 1;

            const result = handler.isAmountGreaterMinBet();

            expect(result).toBe(false);
        });

        it("should return true when total bet = min bet", () => {
            mockBetControlStore.totalBet = 1;
            mockRoundStore.minBet = 1;

            const result = handler.isAmountGreaterMinBet();

            expect(result).toBe(true);
        });
    });

    describe("showNotEnoughMoney method", () => {
        it("should show 'not enough money' message when freebet disabled", () => {
            mockBetStore.freebetEnabled = false;

            (handler as any).showNotEnoughMoney();

            expect(mockNoticeStore.addWarning).toHaveBeenCalledWith("Not enough money");
        });

        it("should show 'not enough scoin' message when freebet enabled", () => {
            mockBetStore.freebetEnabled = true;

            (handler as any).showNotEnoughMoney();

            expect(mockNoticeStore.addWarning).toHaveBeenCalledWith("Not enough scoin");
        });
    });

    describe("showMsgMinBet method", () => {
        it("should show minimum bet message", () => {
            mockRoundStore.minBet = 5;

            handler.showMsgMinBet();

            expect(mockNoticeStore.addWarning).toHaveBeenCalledWith("Minimum bet is 5");
        });
    });

    describe("closeAutoPlayPopup method", () => {
        it("should close popup and cancel autoplay", () => {
            jest.spyOn(handler, "cancelAutoPlay");

            handler.closeAutoPlayPopup();

            expect(mockAutoPlayStore.isOpenAutoplayPopup).toBe(false);
            expect(handler.cancelAutoPlay).toHaveBeenCalled();
        });
    });

    describe("confirmRoundAndStart method", () => {
        it("should set up autoplay and start with delay", () => {
            mockAutoPlayStore.selectedRoundOnPopup = 50;
            jest.spyOn(handler, "autoBetWhenConfirmStart");

            handler.confirmRoundAndStart();

            expect(mockCascadingUIStore.bottomMessageState).toBe(SlotNotification.AUTO_SPIN);
            expect(mockAutoPlayStore.roundsAutoplay).toBe(50);
            expect(mockAutoPlayStore.isOpenAutoplayPopup).toBe(false);

            // Advance timer to trigger the delayed call
            jest.advanceTimersByTime(500);
            expect(handler.autoBetWhenConfirmStart).toHaveBeenCalled();
        });
    });

    describe("autoBetWhenConfirmStart method", () => {
        it("should start autoplay when valid bet", () => {
            jest.spyOn(handler, "isValidBet").mockReturnValue(true);
            jest.spyOn(handler, "placeBet");
            jest.spyOn(handler, "updateAutoPlayRounds");
            mockAutoPlayStore.roundsAutoplay = 10;

            handler.autoBetWhenConfirmStart();

            expect(mockAutoPlayStore.isAutoplay).toBe(true);
            expect(handler.placeBet).toHaveBeenCalled();
            expect(handler.updateAutoPlayRounds).toHaveBeenCalledWith(9);
        });

        it("should cancel autoplay when invalid bet", () => {
            jest.spyOn(handler, "isValidBet").mockReturnValue(false);
            jest.spyOn(handler, "cancelAutoPlay");

            handler.autoBetWhenConfirmStart();

            expect(handler.cancelAutoPlay).toHaveBeenCalled();
        });
    });

    describe("updateAutoPlayRounds method", () => {
        it("should update rounds in store", () => {
            handler.updateAutoPlayRounds(25);
            expect(mockAutoPlayStore.roundsAutoplay).toBe(25);
        });
    });

    describe("checkFinishedAutoPlay method", () => {
        it("should return true when rounds <= 0", () => {
            mockAutoPlayStore.roundsAutoplay = 0;
            expect(handler.checkFinishedAutoPlay()).toBe(true);

            mockAutoPlayStore.roundsAutoplay = -1;
            expect(handler.checkFinishedAutoPlay()).toBe(true);
        });

        it("should return false when rounds > 0", () => {
            mockAutoPlayStore.roundsAutoplay = 1;
            expect(handler.checkFinishedAutoPlay()).toBe(false);

            mockAutoPlayStore.roundsAutoplay = 10;
            expect(handler.checkFinishedAutoPlay()).toBe(false);
        });
    });

    describe("checkSpinNextRound method", () => {
        it("should place bet when free spins available", () => {
            mockCascadingUIStore.freeSpinsTotal = 5;
            jest.spyOn(handler, "placeBet");

            handler.checkSpinNextRound();

            expect(handler.placeBet).toHaveBeenCalled();
        });

        it("should handle autoplay logic when no free spins and autoplay active", () => {
            mockCascadingUIStore.freeSpinsTotal = 0;
            mockAutoPlayStore.isAutoplay = true;
            mockAutoPlayStore.roundsAutoplay = 5;
            jest.spyOn(handler, "updateAutoPlayRounds");
            jest.spyOn(handler, "handleAutoPlaceBet");

            handler.checkSpinNextRound();

            expect(mockBetControlStore.resumeLastBet).toBe(false);
            expect(mockCascadingUIStore.bottomMessageState).toBe(SlotNotification.AUTO_SPIN);
            expect(mockCascadingUIHandler.changeCascadingState).toHaveBeenCalledWith(CascadingSlotState.SETTLED);
            expect(handler.updateAutoPlayRounds).toHaveBeenCalledWith(4);
            expect(handler.handleAutoPlaceBet).toHaveBeenCalled();
        });

        it("should handle manual play logic when no free spins and autoplay inactive", () => {
            mockCascadingUIStore.freeSpinsTotal = 0;
            mockAutoPlayStore.isAutoplay = false;
            jest.spyOn(handler, "handleAutoPlaceBet");

            handler.checkSpinNextRound();

            expect(mockCascadingUIStore.bottomMessageState).toBe(SlotNotification.SETTLED);
            expect(mockCascadingUIHandler.changeCascadingState).toHaveBeenCalledWith(CascadingSlotState.SETTLED);
        });

        it("should handle delayed bet when trigger action exists", () => {
            mockCascadingUIStore.freeSpinsTotal = 0;
            mockAutoPlayStore.isAutoplay = false;
            mockHoldActionStore.isHolding = true;
            jest.spyOn(handler, "handleAutoPlaceBet");

            handler.checkSpinNextRound();

            // Advance timer to trigger the delayed call
            jest.advanceTimersByTime(1000);
            expect(handler.handleAutoPlaceBet).toHaveBeenCalled();
        });
    });

    describe("updateNoOfRounds method", () => {
        it("should update selected round on popup", () => {
            handler.updateNoOfRounds(100);
            expect(mockAutoPlayStore.selectedRoundOnPopup).toBe(100);
        });
    });

    describe("checkAutoPlayWhenSettlementCompleted method", () => {
        it("should handle settlement completion when conditions met", () => {
            mockAutoPlayStore.isAutoplay = true;
            mockAutoPlayStore.roundsAutoplay = 0;
            mockCascadingUIStore.freeSpinsTotal = 0;

            handler.checkAutoPlayWhenSettlementCompleted();

            expect(mockAutoPlayStore.isAutoplay).toBe(false);
            expect(mockAutoPlayStore.isOpenAutoplayPopup).toBe(true);
            expect(mockCascadingUIStore.bottomMessageState).toBe(SlotNotification.SETTLED);
            expect(mockAutoPlayStore.triggerBet).toBeNull();
        });

        it("should not trigger when autoplay is false", () => {
            mockAutoPlayStore.isAutoplay = false;
            mockAutoPlayStore.roundsAutoplay = 0;
            mockCascadingUIStore.freeSpinsTotal = 0;

            const initialPopupState = mockAutoPlayStore.isOpenAutoplayPopup;
            handler.checkAutoPlayWhenSettlementCompleted();

            expect(mockAutoPlayStore.isOpenAutoplayPopup).toBe(initialPopupState);
        });

        it("should not trigger when rounds > 0", () => {
            mockAutoPlayStore.isAutoplay = true;
            mockAutoPlayStore.roundsAutoplay = 5;
            mockCascadingUIStore.freeSpinsTotal = 0;

            const initialPopupState = mockAutoPlayStore.isOpenAutoplayPopup;
            handler.checkAutoPlayWhenSettlementCompleted();

            expect(mockAutoPlayStore.isOpenAutoplayPopup).toBe(initialPopupState);
        });

        it("should not trigger when free spins > 0", () => {
            mockAutoPlayStore.isAutoplay = true;
            mockAutoPlayStore.roundsAutoplay = 0;
            mockCascadingUIStore.freeSpinsTotal = 3;

            const initialPopupState = mockAutoPlayStore.isOpenAutoplayPopup;
            handler.checkAutoPlayWhenSettlementCompleted();

            expect(mockAutoPlayStore.isOpenAutoplayPopup).toBe(initialPopupState);
        });
    });

    describe("integration scenarios", () => {
        it("should handle complete autoplay workflow", () => {
            // Setup initial state
            jest.spyOn(handler, "isValidBet").mockReturnValue(true);
            jest.spyOn(handler, "placeBet");
            jest.spyOn(handler, "updateAutoPlayRounds");

            // Start autoplay
            handler.clickAutoPlay();
            expect(mockAutoPlayStore.isOpenAutoplayPopup).toBe(true);

            // Confirm rounds and start
            mockAutoPlayStore.selectedRoundOnPopup = 3;
            handler.confirmRoundAndStart();
            jest.advanceTimersByTime(500);

            expect(mockAutoPlayStore.isAutoplay).toBe(true);
            expect(mockAutoPlayStore.roundsAutoplay).toBe(2);
            expect(handler.placeBet).toHaveBeenCalled();
            expect(handler.updateAutoPlayRounds).toHaveBeenCalledWith(2);
        });

        it("should handle autoplay cancellation", () => {
            mockAutoPlayStore.isAutoplay = true;
            mockAutoPlayStore.roundsAutoplay = 5;

            handler.clickAutoPlay();

            expect(mockAutoPlayStore.isAutoplay).toBe(false);
            expect(mockAutoPlayStore.roundsAutoplay).toBe(0);
            expect(mockCascadingUIHandler.resetBottomMessageState).toHaveBeenCalled();
        });

        it("should handle insufficient funds scenario", () => {
            mockBetControlStore.totalBet = 1500;
            mockBetStore.availableBalance = 1000;
            mockBetStore.freebetEnabled = false;

            const result = handler.isValidBet();

            expect(result).toBe(false);
            expect(mockNoticeStore.addWarning).toHaveBeenCalledWith("Not enough money");
        });
    });
});
