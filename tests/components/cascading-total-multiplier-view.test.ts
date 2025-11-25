import { Label, UIOpacity } from "cc";

// Mock _decorator
jest.mock("cc", () => {
    const originalModule = jest.requireActual("cc");
    return {
        ...originalModule,
        _decorator: {
            ccclass: jest.fn((target: any) => target),
            property: jest.fn((options?: any) => (target: any, propertyKey: string) => {}),
        },
        tween: jest.fn(() => ({
            to: jest.fn().mockReturnThis(),
            call: jest.fn().mockReturnThis(),
            start: jest.fn(() => ({ stop: jest.fn() })),
        })),
    };
});

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
    };
    return mockGc;
});

jest.mock("../../assets/stores/cascading-ui-store", () => ({
    CascadingUIStore: class {
        totalMultiplier = 0;
        isShowTotalMultiplierJoinGame = false;
    },
}));

jest.mock("db://shared-components/shared/common-components/fade-appearance-node", () => ({
    FadeAppearanceNode: class {
        onLoad() {}
        showView(show: boolean, force = false) {
            return Promise.resolve();
        }
        appearanceDuration = 0.2;
        isShowing = false;
        onHidden = () => {};
    },
}));

jest.mock("db://shared-components/shared/utils", () => ({
    AnimationUtils: {
        floatToNumber: jest.fn(),
        fadeIn: jest.fn(),
        fadeOut: jest.fn(),
    },
}));

jest.mock("observer", () => ({
    observer: jest.fn((target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        return descriptor;
    }),
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

// Import after mocks are set up
import { TotalMultiplierView } from "../../assets/components/total-multiplier/cascading-total-multiplier-view";

describe("TotalMultiplierView", () => {
    let totalMultiplierView: TotalMultiplierView;
    let mockTotal: Label;
    let mockNode: any;
    let mockUIOpacity: UIOpacity;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Create mock UIOpacity
        mockUIOpacity = {
            opacity: 255,
        } as unknown as UIOpacity;

        // Create mock node
        mockNode = {
            getComponent: jest.fn().mockReturnValue(mockUIOpacity),
        };

        // Create mock label
        mockTotal = {
            string: "",
        } as unknown as Label;

        // Create instance of TotalMultiplierView
        totalMultiplierView = new TotalMultiplierView();
        totalMultiplierView.total = mockTotal;
        totalMultiplierView.node = mockNode;
    });

    describe("onLoad", () => {
        it("should call super.onLoad and show view as hidden", () => {
            totalMultiplierView.showView = jest.fn().mockResolvedValue(undefined);

            totalMultiplierView.onLoad();

            expect(totalMultiplierView.showView).toHaveBeenCalledWith(false, true);
        });
    });

    describe("setValue", () => {
        it("should hide view when totalMultiplier is 0", () => {
            totalMultiplierView.showView = jest.fn().mockResolvedValue(undefined);

            totalMultiplierView.setValue(0);

            expect(totalMultiplierView.showView).toHaveBeenCalledWith(false);
        });

        it("should call AnimationUtils.floatToNumber when animated is true", () => {
            const { AnimationUtils } = require("db://shared-components/shared/utils");
            totalMultiplierView.showView = jest.fn().mockResolvedValue(undefined);

            totalMultiplierView.setValue(5, true);

            expect(AnimationUtils.floatToNumber).toHaveBeenCalledWith({
                label: mockTotal,
                amount: 5,
                duration: 0.2,
                noZeroSuffix: true,
                prefixStr: "x",
                xMode: 1,
            });
        });

        it("should set label string directly when animated is false and value is positive", () => {
            totalMultiplierView.showView = jest.fn().mockResolvedValue(undefined);

            totalMultiplierView.setValue(3, false);

            expect(mockTotal.string).toBe("x3");
        });

        it("should set empty string when animated is false and value is 0", () => {
            totalMultiplierView.showView = jest.fn().mockResolvedValue(undefined);

            totalMultiplierView.setValue(0, false);

            expect(mockTotal.string).toBe("");
        });

        it("should set empty string when animated is false and value is negative", () => {
            totalMultiplierView.showView = jest.fn().mockResolvedValue(undefined);

            totalMultiplierView.setValue(-1, false);

            expect(mockTotal.string).toBe("");
        });

        it("should use default animated parameter as true", () => {
            const { AnimationUtils } = require("db://shared-components/shared/utils");
            totalMultiplierView.showView = jest.fn().mockResolvedValue(undefined);

            totalMultiplierView.setValue(10);

            expect(AnimationUtils.floatToNumber).toHaveBeenCalledWith({
                label: mockTotal,
                amount: 10,
                duration: 0.2,
                noZeroSuffix: true,
                prefixStr: "x",
                xMode: 1,
            });
        });
    });

    describe("renderTotalMultiplierJoinGame", () => {
        it("should show view when isShow is true", () => {
            totalMultiplierView.showView = jest.fn().mockResolvedValue(undefined);

            totalMultiplierView.renderTotalMultiplierJoinGame(true);

            expect(totalMultiplierView.showView).toHaveBeenCalledWith(true);
        });

        it("should not show view when isShow is false", () => {
            totalMultiplierView.showView = jest.fn().mockResolvedValue(undefined);

            totalMultiplierView.renderTotalMultiplierJoinGame(false);

            expect(totalMultiplierView.showView).not.toHaveBeenCalled();
        });
    });

    describe("integration tests", () => {
        it("should properly handle value changes with animation", () => {
            const { AnimationUtils } = require("db://shared-components/shared/utils");
            totalMultiplierView.showView = jest.fn().mockResolvedValue(undefined);

            // Test setting a positive value with animation
            totalMultiplierView.setValue(7, true);
            expect(AnimationUtils.floatToNumber).toHaveBeenCalledWith({
                label: mockTotal,
                amount: 7,
                duration: 0.2,
                noZeroSuffix: true,
                prefixStr: "x",
                xMode: 1,
            });

            // Test setting zero value
            totalMultiplierView.setValue(0);
            expect(totalMultiplierView.showView).toHaveBeenCalledWith(false);
        });

        it("should properly handle value changes without animation", () => {
            totalMultiplierView.showView = jest.fn().mockResolvedValue(undefined);

            // Test setting a positive value without animation
            totalMultiplierView.setValue(15, false);
            expect(mockTotal.string).toBe("x15");

            // Reset mock for next test
            mockTotal.string = "";

            // Test setting zero value without animation
            totalMultiplierView.setValue(0, false);
            expect(mockTotal.string).toBe("");
        });

        it("should handle join game visibility", () => {
            totalMultiplierView.showView = jest.fn().mockResolvedValue(undefined);

            // Test showing join game
            totalMultiplierView.renderTotalMultiplierJoinGame(true);
            expect(totalMultiplierView.showView).toHaveBeenCalledWith(true);

            // Test hiding join game
            totalMultiplierView.renderTotalMultiplierJoinGame(false);
            expect(totalMultiplierView.showView).toHaveBeenCalledTimes(1); // Only called once for true
        });
    });

    describe("edge cases", () => {
        it("should handle very large multiplier values", () => {
            const { AnimationUtils } = require("db://shared-components/shared/utils");
            totalMultiplierView.showView = jest.fn().mockResolvedValue(undefined);

            totalMultiplierView.setValue(999999, true);

            expect(AnimationUtils.floatToNumber).toHaveBeenCalledWith({
                label: mockTotal,
                amount: 999999,
                duration: 0.2,
                noZeroSuffix: true,
                prefixStr: "x",
                xMode: 1,
            });
        });

        it("should handle decimal multiplier values", () => {
            totalMultiplierView.showView = jest.fn().mockResolvedValue(undefined);

            totalMultiplierView.setValue(2.5, false);

            expect(mockTotal.string).toBe("x2.5");
        });

        it("should handle negative values without animation", () => {
            totalMultiplierView.showView = jest.fn().mockResolvedValue(undefined);

            totalMultiplierView.setValue(-5, false);

            expect(mockTotal.string).toBe("");
        });
    });
});
