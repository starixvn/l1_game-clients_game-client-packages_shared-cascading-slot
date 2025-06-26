import { Node } from "cc";

// Mock _decorator
jest.mock("cc", () => {
    const originalModule = jest.requireActual("cc");
    return {
        ...originalModule,
        _decorator: {
            ccclass: jest.fn((target: any) => target),
            property: jest.fn((options?: any) => (target: any, propertyKey: string) => {}),
        },
    };
});

// Mock external dependencies
jest.mock("@sg/game-client-base", () => {
    const mockGc = {
        Connection: {
            ConnectionHandlers: {
                ConnectHandler: class {
                    handleTrial() {}
                },
                InGameHandler: class {
                    handleTrial() {}
                },
            },
            ConnectionTrialStore: class {
                isConnected = false;
            },
        },
        Audios: {
            AudioHandler: class {
                playSFX(id: string) {}
            },
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
        isTrialMode = false;
        isConnectedTrialService = false;
        disabledChangeTrialMode = false;
    },
}));

jest.mock("../../assets/handlers/cascading-ui-handler", () => ({
    CascadingUIHandler: class {
        handleChangeMode(isTrialMode: boolean) {}
        handleSymbolPreviewVisiblity(isVisible: boolean) {}
        updateConnectedTrialService(connected: boolean) {}
        handleChangeUserBalance(changed: boolean) {}
    },
}));

jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => {
    const { Component } = require("cc");
    return {
        ObserverComponent: class extends Component {
            onLoad() {
                super.onLoad();
            }
            onDestroy() {
                super.onDestroy();
            }
            schedule = jest.fn();
        },
    };
});

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
import { CascadingTrialMode } from "../../assets/components/trial-mode/cascading-trial-mode";

describe("CascadingTrialMode", () => {
    let cascadingTrialMode: CascadingTrialMode;
    let mockNodeTrialMode: Node;
    let mockNodeRealMode: Node;
    let mockNodeDisabled: Node;

    beforeEach(() => {
        // Create mock nodes
        mockNodeTrialMode = { active: true } as Node;
        mockNodeRealMode = { active: false } as Node;
        mockNodeDisabled = { active: false } as Node;

        // Create instance of CascadingTrialMode
        cascadingTrialMode = new CascadingTrialMode() as CascadingTrialMode;

        // Initialize properties
        cascadingTrialMode.nodeTrialMode = mockNodeTrialMode;
        cascadingTrialMode.nodeRealMode = mockNodeRealMode;
        cascadingTrialMode.nodeDisabled = mockNodeDisabled;

        // Initialize private properties
        cascadingTrialMode["isTrialMode"] = false;
        cascadingTrialMode["isConnectedTrialService"] = false;
    });

    describe("renderTrialMode", () => {
        it("should show trial mode and hide real mode when isTrialMode is true", () => {
            cascadingTrialMode.renderTrialMode(true);

            expect(mockNodeTrialMode.active).toBe(false);
            expect(mockNodeRealMode.active).toBe(true);
            expect(cascadingTrialMode["isTrialMode"]).toBe(true);
        });

        it("should hide trial mode and show real mode when isTrialMode is false", () => {
            cascadingTrialMode.renderTrialMode(false);

            expect(mockNodeTrialMode.active).toBe(true);
            expect(mockNodeRealMode.active).toBe(false);
            expect(cascadingTrialMode["isTrialMode"]).toBe(false);
        });

        it("should call inGameTrial when isTrialMode is true and connected to trial service", () => {
            cascadingTrialMode["isConnectedTrialService"] = true;
            cascadingTrialMode.inGameTrial = jest.fn();

            cascadingTrialMode.renderTrialMode(true);

            expect(cascadingTrialMode.inGameTrial).toHaveBeenCalled();
        });

        it("should call connectToServiceTrial when isTrialMode is true and not connected to trial service", () => {
            cascadingTrialMode["isConnectedTrialService"] = false;
            cascadingTrialMode.connectToServiceTrial = jest.fn();

            cascadingTrialMode.renderTrialMode(true);

            expect(cascadingTrialMode.connectToServiceTrial).toHaveBeenCalled();
        });
    });

    describe("onClickChangeMode", () => {
        it("should return true when currently in real mode", () => {
            cascadingTrialMode["isTrialMode"] = false;

            const result = cascadingTrialMode.onClickChangeMode();

            expect(result).toBe(true);
        });

        it("should return false when currently in trial mode", () => {
            cascadingTrialMode["isTrialMode"] = true;

            const result = cascadingTrialMode.onClickChangeMode();

            expect(result).toBe(false);
        });
    });

    describe("playSoundClick", () => {
        it("should return click sound id", () => {
            const result = cascadingTrialMode.playSoundClick();

            expect(result).toBe("click");
        });
    });

    describe("handleSymbolPreviewVisiblity", () => {
        it("should return the visibility parameter", () => {
            const result = cascadingTrialMode.handleSymbolPreviewVisiblity(true);

            expect(result).toBe(true);
        });

        it("should return false when passed false", () => {
            const result = cascadingTrialMode.handleSymbolPreviewVisiblity(false);

            expect(result).toBe(false);
        });
    });

    describe("connectToServiceTrial", () => {
        it("should call updateConnectedTrialService with true", () => {
            cascadingTrialMode.updateConnectedTrialService = jest.fn();

            cascadingTrialMode.connectToServiceTrial();

            expect(cascadingTrialMode.updateConnectedTrialService).toHaveBeenCalledWith(true);
        });
    });

    describe("onSignedIn", () => {
        it("should call inGameTrial when isConnected is true", () => {
            cascadingTrialMode.inGameTrial = jest.fn();

            cascadingTrialMode.onSignedIn(true);

            expect(cascadingTrialMode.inGameTrial).toHaveBeenCalled();
        });

        it("should not call inGameTrial when isConnected is false", () => {
            cascadingTrialMode.inGameTrial = jest.fn();

            cascadingTrialMode.onSignedIn(false);

            expect(cascadingTrialMode.inGameTrial).not.toHaveBeenCalled();
        });
    });

    describe("inGameTrial", () => {
        it("should be callable without throwing error", () => {
            expect(() => {
                cascadingTrialMode.inGameTrial();
            }).not.toThrow();
        });
    });

    describe("updateConnectedTrialService", () => {
        it("should return the connected parameter", () => {
            const result = cascadingTrialMode.updateConnectedTrialService(true);

            expect(result).toBe(true);
        });

        it("should return false when passed false", () => {
            const result = cascadingTrialMode.updateConnectedTrialService(false);

            expect(result).toBe(false);
        });
    });

    describe("renderConnectedTrialService", () => {
        it("should update isConnectedTrialService property", () => {
            cascadingTrialMode.renderConnectedTrialService(true);

            expect(cascadingTrialMode["isConnectedTrialService"]).toBe(true);
        });

        it("should set isConnectedTrialService to false", () => {
            cascadingTrialMode["isConnectedTrialService"] = true;
            cascadingTrialMode.renderConnectedTrialService(false);

            expect(cascadingTrialMode["isConnectedTrialService"]).toBe(false);
        });
    });

    describe("renderDisabledTrialMode", () => {
        it("should show disabled node when disabledChangeTrialMode is true", () => {
            cascadingTrialMode.renderDisabledTrialMode(true);

            expect(mockNodeDisabled.active).toBe(true);
        });

        it("should hide disabled node when disabledChangeTrialMode is false", () => {
            mockNodeDisabled.active = true;
            cascadingTrialMode.renderDisabledTrialMode(false);

            expect(mockNodeDisabled.active).toBe(false);
        });
    });

    describe("handleChangeUserBalance", () => {
        it("should return the changed parameter", () => {
            const result = cascadingTrialMode.handleChangeUserBalance(true);

            expect(result).toBe(true);
        });

        it("should return false when passed false", () => {
            const result = cascadingTrialMode.handleChangeUserBalance(false);

            expect(result).toBe(false);
        });
    });

    describe("integration tests", () => {
        it("should properly handle trial mode toggle", () => {
            // Start in real mode
            cascadingTrialMode["isTrialMode"] = false;
            cascadingTrialMode["isConnectedTrialService"] = true;

            // Toggle to trial mode
            cascadingTrialMode.renderTrialMode(true);
            expect(mockNodeTrialMode.active).toBe(false);
            expect(mockNodeRealMode.active).toBe(true);
            expect(cascadingTrialMode["isTrialMode"]).toBe(true);

            // Toggle back to real mode
            cascadingTrialMode.renderTrialMode(false);
            expect(mockNodeTrialMode.active).toBe(true);
            expect(mockNodeRealMode.active).toBe(false);
            expect(cascadingTrialMode["isTrialMode"]).toBe(false);
        });

        it("should handle disabled state properly", () => {
            // Enable disabled state
            cascadingTrialMode.renderDisabledTrialMode(true);
            expect(mockNodeDisabled.active).toBe(true);

            // Disable disabled state
            cascadingTrialMode.renderDisabledTrialMode(false);
            expect(mockNodeDisabled.active).toBe(false);
        });

        it("should handle connection state changes", () => {
            // Start disconnected
            cascadingTrialMode["isConnectedTrialService"] = false;
            cascadingTrialMode.connectToServiceTrial = jest.fn();

            // Enable trial mode (should trigger connection)
            cascadingTrialMode.renderTrialMode(true);
            expect(cascadingTrialMode.connectToServiceTrial).toHaveBeenCalled();

            // Simulate connection established
            cascadingTrialMode.renderConnectedTrialService(true);
            expect(cascadingTrialMode["isConnectedTrialService"]).toBe(true);

            // Now trial mode should use inGameTrial
            cascadingTrialMode.inGameTrial = jest.fn();
            cascadingTrialMode.renderTrialMode(true);
            expect(cascadingTrialMode.inGameTrial).toHaveBeenCalled();
        });
    });
});
