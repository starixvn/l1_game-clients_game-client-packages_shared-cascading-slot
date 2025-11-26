import { Label } from "cc";
import { CascadingEffectFreespin } from "../../../assets/components/effects/cascading-effect-freespin";

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
        Configs: {
            SiteConfigs: jest.fn(() => ({
                systemType: "test",
            })),
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
    };
    return mockGc;
});

jest.mock("../../../assets/stores/cascading-ui-store");
jest.mock("../../../assets/handlers/cascading-ui-handler");
jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => ({
    ObserverComponent: class {
        onLoad() {}
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

describe("CascadingEffectFreespin", () => {
    let cascadingEffectFreespin: CascadingEffectFreespin;
    let mockLblFreeSpinCount: Label;

    beforeEach(() => {
        // Create mock label
        mockLblFreeSpinCount = {
            string: "0",
        } as unknown as Label;

        // Create instance of CascadingEffectFreespin
        cascadingEffectFreespin = new CascadingEffectFreespin();
        cascadingEffectFreespin.lblFreeSpinCount = mockLblFreeSpinCount;
    });

    describe("renderFreeSpinsCount", () => {
        it("should update free spins count and label string", () => {
            const freeSpinsCount = 5;

            cascadingEffectFreespin.renderFreeSpinsCount(freeSpinsCount);

            expect(cascadingEffectFreespin.freeSpinsCount).toBe(5);
            expect(mockLblFreeSpinCount.string).toBe("5");
        });

        it("should handle zero free spins count", () => {
            const freeSpinsCount = 0;

            cascadingEffectFreespin.renderFreeSpinsCount(freeSpinsCount);

            expect(cascadingEffectFreespin.freeSpinsCount).toBe(0);
            expect(mockLblFreeSpinCount.string).toBe("0");
        });

        it("should handle large free spins count", () => {
            const freeSpinsCount = 100;

            cascadingEffectFreespin.renderFreeSpinsCount(freeSpinsCount);

            expect(cascadingEffectFreespin.freeSpinsCount).toBe(100);
            expect(mockLblFreeSpinCount.string).toBe("100");
        });

        it("should handle negative free spins count", () => {
            const freeSpinsCount = -5;

            cascadingEffectFreespin.renderFreeSpinsCount(freeSpinsCount);

            expect(cascadingEffectFreespin.freeSpinsCount).toBe(-5);
            expect(mockLblFreeSpinCount.string).toBe("-5");
        });

        it("should handle decimal free spins count", () => {
            const freeSpinsCount = 3.5;

            cascadingEffectFreespin.renderFreeSpinsCount(freeSpinsCount);

            expect(cascadingEffectFreespin.freeSpinsCount).toBe(3.5);
            expect(mockLblFreeSpinCount.string).toBe("3.5");
        });
    });

    describe("initial state", () => {
        it("should have correct initial values", () => {
            expect(cascadingEffectFreespin.freeSpinsCount).toBe(0);
        });
    });

    describe("property access", () => {
        it("should allow access to public properties", () => {
            cascadingEffectFreespin.freeSpinsCount = 10;
            expect(cascadingEffectFreespin.freeSpinsCount).toBe(10);
        });
    });

    describe("label interaction", () => {
        it("should update label string when free spins count changes", () => {
            // Initial state
            expect(mockLblFreeSpinCount.string).toBe("0");

            // Update free spins count
            cascadingEffectFreespin.renderFreeSpinsCount(7);
            expect(mockLblFreeSpinCount.string).toBe("7");

            // Update again
            cascadingEffectFreespin.renderFreeSpinsCount(12);
            expect(mockLblFreeSpinCount.string).toBe("12");
        });

        it("should handle null label gracefully", () => {
            cascadingEffectFreespin.lblFreeSpinCount = null;

            // Should throw error when trying to set string on null label
            expect(() => {
                cascadingEffectFreespin.renderFreeSpinsCount(5);
            }).toThrow("Cannot set properties of null (setting 'string')");
        });
    });

    describe("state consistency", () => {
        it("should maintain consistent state between free spins count and label", () => {
            const testValues = [0, 1, 5, 10, 25, 100];

            testValues.forEach((value) => {
                cascadingEffectFreespin.renderFreeSpinsCount(value);
                expect(cascadingEffectFreespin.freeSpinsCount).toBe(value);
                expect(mockLblFreeSpinCount.string).toBe(value.toString());
            });
        });
    });
});
