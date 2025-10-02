// Mock the gc module first, before any imports
const mockBetStore = {
    lastReceivedBet: null,
};

const mockApiError = {
    errorCode: "SB1001",
    message: "Test API Error",
    eventName: "apiError",
};

jest.mock("@sg/game-client-base", () => ({
    Bet: {
        BetStore: jest.fn(() => mockBetStore),
        BetHandler: jest.fn().mockImplementation(function () { }),
    },
    GameServiceMessage: {
        ApiError: {
            eventName: "apiError",
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
    Configs: {
        SiteConfigs: {
            systemType: ""
        },
    },
    Error: {
        ErrorHandlers: jest.fn().mockImplementation(function () {
            this.handleApiError = jest.fn();
        }),
    },
    Player: {
        MainPlayerStore: jest.fn(() => ({ balance: 1000 })),
    },
    UserSettings: {
        UserSettingHandlers: jest.fn(() => ({})),
    },
    GameUserSettings: {
        GameUserSettingHandler: jest.fn(() => ({})),
    },
    Connection: {
        ConnectionTrialStore: jest.fn(() => ({
            send: jest.fn(),
        })),
    },
    Notices: {
        NoticeStore: jest.fn(() => ({
            addWarning: jest.fn(),
        })),
        NoticeErrorsHandlers: {
            AutoSignOutHandler: jest.fn(() => ({})),
        },
    },
    Notification: {
        NotificationStore: jest.fn(() => ({
            connection: {
                on: jest.fn(),
            },
        })),
    },
    Rounds: {
        RoundStore: jest.fn(() => ({
            minBet: 1,
        })),
    },
    Audios: {
        AudioHandler: jest.fn(() => ({
            playSFX: jest.fn(),
        })),
    },
}));

// Mock the dependencies
jest.mock("../../assets/handlers/auto-play-handlers");
jest.mock("../../assets/handlers/bet-control-handlers");
jest.mock("../../assets/handlers/cascading-ui-handler");

// Import after mocking
import { AutoPlayHandler } from "../../assets/handlers/auto-play-handlers";
import { BetControlHandlers } from "../../assets/handlers/bet-control-handlers";
import { CascadingSlotErrorHandler } from "../../assets/handlers/cascading-slot-error-handler";
import { CascadingUIHandler } from "../../assets/handlers/cascading-ui-handler";

// Mock setTimeout for testing
jest.useFakeTimers();

describe("CascadingSlotErrorHandler", () => {
    let handler: CascadingSlotErrorHandler;
    let mockAutoPlayHandler: jest.Mocked<AutoPlayHandler>;
    let mockCascadingUIHandler: jest.Mocked<CascadingUIHandler>;
    let mockBetControlHandlers: jest.Mocked<BetControlHandlers>;

    beforeEach(() => {
        // Reset all mocks and timers
        jest.clearAllMocks();
        jest.clearAllTimers();

        // Reset mock bet store
        mockBetStore.lastReceivedBet = null;

        // Create mock instances
        mockAutoPlayHandler = {} as any;

        mockCascadingUIHandler = {
            handlePlaceBetFailed: jest.fn(),
        } as any;

        mockBetControlHandlers = {
            init: jest.fn(),
        } as any;

        // Create handler instance
        handler = new (CascadingSlotErrorHandler as any)();

        // Manually inject the mocked dependencies
        (handler as any).betStore = mockBetStore;
        (handler as any).autoPlayHandler = mockAutoPlayHandler;
        (handler as any).cascadingUIHandler = mockCascadingUIHandler;
        (handler as any).betControlHandlers = mockBetControlHandlers;

        // Mock the inherited handleApiError method
        handler.handleApiError = jest.fn();
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    describe("constructor and initialization", () => {
        it("should initialize properly", () => {
            expect(handler).toBeInstanceOf(CascadingSlotErrorHandler);
        });

        it("should have endGameApiError initially null", () => {
            expect(handler.endGameApiError).toBeNull();
        });

        it("should have eventHandleList with correct structure", () => {
            expect(handler.eventHandleList).toBeDefined();
            expect(Array.isArray(handler.eventHandleList)).toBe(true);
            expect(handler.eventHandleList).toHaveLength(2);
        });

        it("should have correct event names in eventHandleList", () => {
            const eventNames = handler.eventHandleList.map((event) => event.name);
            expect(eventNames).toContain("apiError");
            expect(eventNames).toContain("notice");
        });

        it("should have correct handlers in eventHandleList", () => {
            const apiErrorEvent = handler.eventHandleList.find((event) => event.name === "apiError");
            const noticeEvent = handler.eventHandleList.find((event) => event.name === "notice");

            expect(apiErrorEvent.handle).toBe(handler.slotHandleApiError);
            expect(noticeEvent.handle).toBe(handler.slotHandleNotice);
        });
    });

    describe("slotHandleApiError method", () => {
        it("should call handleApiError immediately when lastReceivedBet.value is -1", () => {
            mockBetStore.lastReceivedBet = { value: -1 };

            handler.slotHandleApiError(mockApiError as any);

            // Advance timer by 10ms to trigger setTimeout
            jest.advanceTimersByTime(10);

            expect(handler.handleApiError).toHaveBeenCalledWith(mockApiError);
            expect(handler.endGameApiError).toBeNull();
        });

        it("should store apiError in endGameApiError when lastReceivedBet.value is not -1", () => {
            mockBetStore.lastReceivedBet = { value: 100 };

            handler.slotHandleApiError(mockApiError as any);

            // Advance timer by 10ms to trigger setTimeout
            jest.advanceTimersByTime(10);

            expect(handler.handleApiError).not.toHaveBeenCalled();
            expect(handler.endGameApiError).toBe(mockApiError);
        });

        it("should handle case when lastReceivedBet is null", () => {
            mockBetStore.lastReceivedBet = null;

            handler.slotHandleApiError(mockApiError as any);

            // Advance timer by 10ms to trigger setTimeout
            jest.advanceTimersByTime(10);

            expect(handler.handleApiError).not.toHaveBeenCalled();
            expect(handler.endGameApiError).toBe(mockApiError);
        });

        it("should handle case when lastReceivedBet is undefined", () => {
            mockBetStore.lastReceivedBet = undefined;

            handler.slotHandleApiError(mockApiError as any);

            // Advance timer by 10ms to trigger setTimeout
            jest.advanceTimersByTime(10);

            expect(handler.handleApiError).not.toHaveBeenCalled();
            expect(handler.endGameApiError).toBe(mockApiError);
        });

        it("should handle case when lastReceivedBet.value is 0", () => {
            mockBetStore.lastReceivedBet = { value: 0 };

            handler.slotHandleApiError(mockApiError as any);

            // Advance timer by 10ms to trigger setTimeout
            jest.advanceTimersByTime(10);

            expect(handler.handleApiError).not.toHaveBeenCalled();
            expect(handler.endGameApiError).toBe(mockApiError);
        });

        it("should handle multiple consecutive API errors", () => {
            const firstError = { errorCode: "SB1001", message: "First Error" };
            const secondError = { errorCode: "SB1002", message: "Second Error" };

            mockBetStore.lastReceivedBet = { value: 100 };

            // First error
            handler.slotHandleApiError(firstError as any);
            jest.advanceTimersByTime(10);
            expect(handler.endGameApiError).toBe(firstError);

            // Second error should overwrite the first
            handler.slotHandleApiError(secondError as any);
            jest.advanceTimersByTime(10);
            expect(handler.endGameApiError).toBe(secondError);
        });

        it("should use setTimeout with 10ms delay", () => {
            const setTimeoutSpy = jest.spyOn(global, "setTimeout");

            handler.slotHandleApiError(mockApiError as any);

            expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 10);
        });

        it("should handle different API error structures", () => {
            const complexApiError = {
                errorCode: "SB1005",
                message: "Complex API Error",
                details: {
                    timestamp: "2023-01-01T00:00:00Z",
                    userId: "12345",
                },
                severity: "HIGH",
            };

            mockBetStore.lastReceivedBet = { value: -1 };

            handler.slotHandleApiError(complexApiError as any);
            jest.advanceTimersByTime(10);

            expect(handler.handleApiError).toHaveBeenCalledWith(complexApiError);
        });
    });

    describe("handleEndGameApiError method", () => {
        it("should handle endGameApiError when it exists", () => {
            handler.endGameApiError = mockApiError as any;

            handler.handleEndGameApiError();

            expect(handler.handleApiError).toHaveBeenCalledWith(mockApiError);
            expect(mockCascadingUIHandler.handlePlaceBetFailed).toHaveBeenCalled();
        });

        it("should do nothing when endGameApiError is null", () => {
            handler.endGameApiError = null;

            handler.handleEndGameApiError();

            expect(handler.handleApiError).not.toHaveBeenCalled();
            expect(mockCascadingUIHandler.handlePlaceBetFailed).not.toHaveBeenCalled();
        });

        it("should do nothing when endGameApiError is undefined", () => {
            handler.endGameApiError = undefined as any;

            handler.handleEndGameApiError();

            expect(handler.handleApiError).not.toHaveBeenCalled();
            expect(mockCascadingUIHandler.handlePlaceBetFailed).not.toHaveBeenCalled();
        });

        it("should handle complex endGameApiError objects", () => {
            const complexError = {
                errorCode: "SB1010",
                message: "Complex End Game Error",
                stack: "Error stack trace",
                timestamp: Date.now(),
            };

            handler.endGameApiError = complexError as any;

            handler.handleEndGameApiError();

            expect(handler.handleApiError).toHaveBeenCalledWith(complexError);
            expect(mockCascadingUIHandler.handlePlaceBetFailed).toHaveBeenCalled();
        });

        it("should call both handleApiError and handlePlaceBetFailed in correct order", () => {
            handler.endGameApiError = mockApiError as any;

            const callOrder: string[] = [];
            handler.handleApiError = jest.fn(() => {
                callOrder.push("handleApiError");
            }) as any;
            mockCascadingUIHandler.handlePlaceBetFailed = jest.fn(() => {
                callOrder.push("handlePlaceBetFailed");
            }) as any;

            handler.handleEndGameApiError();

            expect(callOrder).toEqual(["handleApiError", "handlePlaceBetFailed"]);
        });
    });

    describe("slotHandleNotice method", () => {
        it("should handle SB1929 error code correctly", () => {
            const notice = { errorCode: "SB1929" };

            handler.slotHandleNotice(notice);

            expect(mockCascadingUIHandler.handlePlaceBetFailed).toHaveBeenCalledWith(true);
            expect(mockBetControlHandlers.init).toHaveBeenCalled();
        });

        it("should ignore notices with different error codes", () => {
            const notice = { errorCode: "SB1001" };

            handler.slotHandleNotice(notice);

            expect(mockCascadingUIHandler.handlePlaceBetFailed).not.toHaveBeenCalled();
            expect(mockBetControlHandlers.init).not.toHaveBeenCalled();
        });

        it("should handle null notice gracefully", () => {
            expect(() => handler.slotHandleNotice(null)).not.toThrow();

            expect(mockCascadingUIHandler.handlePlaceBetFailed).not.toHaveBeenCalled();
            expect(mockBetControlHandlers.init).not.toHaveBeenCalled();
        });

        it("should handle undefined notice gracefully", () => {
            expect(() => handler.slotHandleNotice(undefined as any)).not.toThrow();

            expect(mockCascadingUIHandler.handlePlaceBetFailed).not.toHaveBeenCalled();
            expect(mockBetControlHandlers.init).not.toHaveBeenCalled();
        });

        it("should handle notice without errorCode property", () => {
            const notice = { message: "Some notice without error code" };

            expect(() => handler.slotHandleNotice(notice as any)).not.toThrow();

            expect(mockCascadingUIHandler.handlePlaceBetFailed).not.toHaveBeenCalled();
            expect(mockBetControlHandlers.init).not.toHaveBeenCalled();
        });

        it("should handle empty errorCode", () => {
            const notice = { errorCode: "" };

            handler.slotHandleNotice(notice);

            expect(mockCascadingUIHandler.handlePlaceBetFailed).not.toHaveBeenCalled();
            expect(mockBetControlHandlers.init).not.toHaveBeenCalled();
        });

        it("should handle case-sensitive error code matching", () => {
            const notice = { errorCode: "sb1929" }; // lowercase

            handler.slotHandleNotice(notice);

            expect(mockCascadingUIHandler.handlePlaceBetFailed).not.toHaveBeenCalled();
            expect(mockBetControlHandlers.init).not.toHaveBeenCalled();
        });

        it("should handle notice with additional properties", () => {
            const notice = {
                errorCode: "SB1929",
                message: "Some error message",
                timestamp: Date.now(),
                severity: "HIGH",
            };

            handler.slotHandleNotice(notice);

            expect(mockCascadingUIHandler.handlePlaceBetFailed).toHaveBeenCalled();
            expect(mockBetControlHandlers.init).toHaveBeenCalled();
        });
    });

    describe("integration scenarios", () => {
        it("should handle complete error flow from API error to end game", () => {
            // Start with a bet that doesn't trigger immediate handling
            mockBetStore.lastReceivedBet = { value: 100 };

            // Trigger API error
            handler.slotHandleApiError(mockApiError as any);
            jest.advanceTimersByTime(10);

            // Verify error is stored
            expect(handler.endGameApiError).toBe(mockApiError);
            expect(handler.handleApiError).not.toHaveBeenCalled();

            // Handle end game error
            handler.handleEndGameApiError();

            // Verify both methods are called
            expect(handler.handleApiError).toHaveBeenCalledWith(mockApiError);
            expect(mockCascadingUIHandler.handlePlaceBetFailed).toHaveBeenCalled();
        });

        it("should handle immediate API error processing", () => {
            // Set up for immediate processing
            mockBetStore.lastReceivedBet = { value: -1 };

            // Trigger API error
            handler.slotHandleApiError(mockApiError as any);
            jest.advanceTimersByTime(10);

            // Verify immediate processing
            expect(handler.handleApiError).toHaveBeenCalledWith(mockApiError);
            expect(handler.endGameApiError).toBeNull();

            // End game error should do nothing since no stored error
            handler.handleEndGameApiError();
            expect(mockCascadingUIHandler.handlePlaceBetFailed).not.toHaveBeenCalled();
        });

        it("should handle multiple API errors followed by end game", () => {
            const firstError = { errorCode: "SB1001", message: "First Error" };
            const secondError = { errorCode: "SB1002", message: "Second Error" };

            mockBetStore.lastReceivedBet = { value: 100 };

            // First error
            handler.slotHandleApiError(firstError as any);
            jest.advanceTimersByTime(10);
            expect(handler.endGameApiError).toBe(firstError);

            // Second error overwrites first
            handler.slotHandleApiError(secondError as any);
            jest.advanceTimersByTime(10);
            expect(handler.endGameApiError).toBe(secondError);

            // End game handles the last error
            handler.handleEndGameApiError();
            expect(handler.handleApiError).toHaveBeenCalledWith(secondError);
            expect(mockCascadingUIHandler.handlePlaceBetFailed).toHaveBeenCalled();
        });

        it("should handle mixed error scenarios", () => {
            // API error that gets stored
            mockBetStore.lastReceivedBet = { value: 100 };
            handler.slotHandleApiError(mockApiError as any);
            jest.advanceTimersByTime(10);

            // Notice that triggers immediate handling
            const notice = { errorCode: "SB1929" };
            handler.slotHandleNotice(notice);

            // End game error
            handler.handleEndGameApiError();

            // Verify all handlers are called
            expect(handler.handleApiError).toHaveBeenCalledWith(mockApiError);
            expect(mockCascadingUIHandler.handlePlaceBetFailed).toHaveBeenCalledTimes(2);
            expect(mockBetControlHandlers.init).toHaveBeenCalled();
        });

        it("should handle rapid successive calls", () => {
            const errors = Array.from({ length: 5 }, (_, i) => ({
                errorCode: `SB100${i}`,
                message: `Error ${i}`,
            }));

            mockBetStore.lastReceivedBet = { value: 50 };

            // Rapid fire API errors
            errors.forEach((error) => {
                handler.slotHandleApiError(error as any);
                jest.advanceTimersByTime(10);
            });

            // Should only store the last error
            expect(handler.endGameApiError).toBe(errors[4]);

            // Handle end game
            handler.handleEndGameApiError();
            expect(handler.handleApiError).toHaveBeenCalledWith(errors[4]);
            expect(mockCascadingUIHandler.handlePlaceBetFailed).toHaveBeenCalledTimes(1);
        });
    });

    describe("edge cases", () => {
        it("should handle bet store with null lastReceivedBet property", () => {
            (mockBetStore as any).lastReceivedBet = null;

            expect(() => {
                handler.slotHandleApiError(mockApiError as any);
                jest.advanceTimersByTime(10);
            }).not.toThrow();

            expect(handler.endGameApiError).toBe(mockApiError);
        });

        it("should handle bet store without lastReceivedBet property", () => {
            delete (mockBetStore as any).lastReceivedBet;

            expect(() => {
                handler.slotHandleApiError(mockApiError as any);
                jest.advanceTimersByTime(10);
            }).not.toThrow();

            expect(handler.endGameApiError).toBe(mockApiError);
        });

        it("should handle API error with no properties", () => {
            const emptyError = {};

            mockBetStore.lastReceivedBet = { value: -1 };

            expect(() => {
                handler.slotHandleApiError(emptyError as any);
                jest.advanceTimersByTime(10);
            }).not.toThrow();

            expect(handler.handleApiError).toHaveBeenCalledWith(emptyError);
        });

        it("should handle notice with non-string errorCode", () => {
            const notice = { errorCode: 1929 }; // number instead of string

            expect(() => handler.slotHandleNotice(notice as any)).not.toThrow();

            expect(mockCascadingUIHandler.handlePlaceBetFailed).not.toHaveBeenCalled();
            expect(mockBetControlHandlers.init).not.toHaveBeenCalled();
        });

        it("should handle concurrent setTimeout calls", () => {
            mockBetStore.lastReceivedBet = { value: 100 };

            // Start multiple timeouts
            handler.slotHandleApiError({ errorCode: "SB1001" } as any);
            handler.slotHandleApiError({ errorCode: "SB1002" } as any);
            handler.slotHandleApiError({ errorCode: "SB1003" } as any);

            // Advance time to trigger all timeouts
            jest.advanceTimersByTime(10);

            // Should have the last error
            expect(handler.endGameApiError).toEqual({ errorCode: "SB1003" });
        });
    });

    describe("eventHandleList functionality", () => {
        it("should correctly bind slotHandleApiError method", () => {
            const apiErrorEvent = handler.eventHandleList.find((event) => event.name === "apiError");

            mockBetStore.lastReceivedBet = { value: -1 };

            // Call the handle method from eventHandleList
            apiErrorEvent.handle.call(handler, mockApiError);
            jest.advanceTimersByTime(10);

            expect(handler.handleApiError).toHaveBeenCalledWith(mockApiError);
        });

        it("should correctly bind slotHandleNotice method", () => {
            const noticeEvent = handler.eventHandleList.find((event) => event.name === "notice");

            const notice = { errorCode: "SB1929" };

            // Call the handle method from eventHandleList
            noticeEvent.handle.call(handler, notice);

            expect(mockCascadingUIHandler.handlePlaceBetFailed).toHaveBeenCalled();
            expect(mockBetControlHandlers.init).toHaveBeenCalled();
        });

        it("should maintain correct method context", () => {
            const apiErrorEvent = handler.eventHandleList.find((event) => event.name === "apiError");
            const noticeEvent = handler.eventHandleList.find((event) => event.name === "notice");

            expect(apiErrorEvent.handle).toBe(handler.slotHandleApiError);
            expect(noticeEvent.handle).toBe(handler.slotHandleNotice);
            expect(typeof apiErrorEvent.handle).toBe("function");
            expect(typeof noticeEvent.handle).toBe("function");
        });
    });
});
