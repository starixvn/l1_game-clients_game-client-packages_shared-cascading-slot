import { instantiate, Prefab } from "cc";
import Observer from "observer";

import gc from "@sg/game-client-base";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { CascadingUIStore } from "../../assets/stores/cascading-ui-store";
import { CascadingWarningMsg } from "../../assets/components/cascading-warning-msg";

jest.mock("observer", () => ({
    render: jest.fn((store, selector, options) => {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            return descriptor;
        };
    }),
}));

jest.mock("@sg/game-client-base", () => ({
    Translator: {
        gameTranslate: jest.fn((key: string) => {
            const translations = {
                "enable_turbo_mode": "Turbo Mode Enabled",
                "disable_turbo_mode": "Turbo Mode Disabled",
                "reach_max_win": "Maximum Win Reached"
            };
            return translations[key] || key;
        }),
    },
}));

jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => ({
    ObserverComponent: class {
        onLoad() { }
        onDestroy() { }
    },
}));

jest.mock("../../assets/stores/cascading-ui-store", () => ({
    CascadingUIStore: jest.fn(),
}));

jest.mock("../../assets/components/cascading-warning-msg", () => ({
    CascadingWarningMsg: jest.fn(),
}));

import { CascadingWarningContainer } from "../../assets/components/cascading-warning-container";

describe("CascadingWarningContainer", () => {
    let cascadingWarningContainer: CascadingWarningContainer;
    let mockPrefab: Prefab;
    let mockWarningNode: any;
    let mockWarningComponent: any;
    let mockParentNode: any;

    const TURBO_ENABLED_MSG = "Turbo Mode Enabled";
    const TURBO_DISABLED_MSG = "Turbo Mode Disabled";
    const REACH_MAX_WIN_MSG = "Maximum Win Reached";
    const CUSTOM_MESSAGE = "Custom warning message";

    beforeEach(() => {
        setupMocks();
        createComponentInstance();
    });

    const setupMocks = () => {
        jest.clearAllMocks();

        mockPrefab = {} as Prefab;
        mockWarningComponent = { setData: jest.fn() };
        mockWarningNode = { getComponent: jest.fn().mockReturnValue(mockWarningComponent) };
        mockParentNode = { addChild: jest.fn() };

        (instantiate as any).mockReturnValue(mockWarningNode);
    };

    const createComponentInstance = () => {
        cascadingWarningContainer = new CascadingWarningContainer();
        cascadingWarningContainer.prefabWarning = mockPrefab;
        cascadingWarningContainer.node = mockParentNode;
    };

    describe("Component Properties", () => {
        it("should have prefabWarning property", () => {
            expect(cascadingWarningContainer.prefabWarning).toBeDefined();
            expect(cascadingWarningContainer.prefabWarning).toBe(mockPrefab);
        });

        it("should be instance of ObserverComponent", () => {
            expect(cascadingWarningContainer).toBeInstanceOf(ObserverComponent);
        });

        it("should have node property", () => {
            expect(cascadingWarningContainer.node).toBeDefined();
            expect(cascadingWarningContainer.node).toBe(mockParentNode);
        });

        it("should have isTrialMode property initialized to false", () => {
            expect(cascadingWarningContainer["isTrialMode"]).toBe(false);
        });
    });

    describe("addNode Method", () => {
        it("should instantiate warning node and add to parent", () => {
            cascadingWarningContainer.addNode(CUSTOM_MESSAGE);

            expect(instantiate).toHaveBeenCalledWith(mockPrefab);
            expect(mockWarningNode.getComponent).toHaveBeenCalledWith(CascadingWarningMsg);
            expect(mockParentNode.addChild).toHaveBeenCalledWith(mockWarningNode);
            expect(mockWarningComponent.setData).toHaveBeenCalledWith(CUSTOM_MESSAGE);
        });

        it("should handle empty message", () => {
            cascadingWarningContainer.addNode("");

            expect(instantiate).toHaveBeenCalledWith(mockPrefab);
            expect(mockWarningNode.getComponent).toHaveBeenCalledWith(CascadingWarningMsg);
            expect(mockParentNode.addChild).toHaveBeenCalledWith(mockWarningNode);
            expect(mockWarningComponent.setData).toHaveBeenCalledWith("");
        });

        it("should handle multiple addNode calls", () => {
            cascadingWarningContainer.addNode("First message");
            cascadingWarningContainer.addNode("Second message");

            expect(instantiate).toHaveBeenCalledTimes(2);
            expect(mockParentNode.addChild).toHaveBeenCalledTimes(2);
            expect(mockWarningComponent.setData).toHaveBeenCalledWith("First message");
            expect(mockWarningComponent.setData).toHaveBeenCalledWith("Second message");
        });
    });

    describe("renderTurboModeMsg Method", () => {
        it("should add turbo enabled message when turbo mode is true and not in trial mode", () => {
            cascadingWarningContainer.renderTurboModeMsg(true);

            expect(instantiate).toHaveBeenCalledWith(mockPrefab);
            expect(mockParentNode.addChild).toHaveBeenCalledWith(mockWarningNode);
            expect(mockWarningComponent.setData).toHaveBeenCalledWith(TURBO_ENABLED_MSG);
        });

        it("should add turbo disabled message when turbo mode is false and not in trial mode", () => {
            cascadingWarningContainer.renderTurboModeMsg(false);

            expect(instantiate).toHaveBeenCalledWith(mockPrefab);
            expect(mockParentNode.addChild).toHaveBeenCalledWith(mockWarningNode);
            expect(mockWarningComponent.setData).toHaveBeenCalledWith(TURBO_DISABLED_MSG);
        });

        it("should not add message when in trial mode for true turbo mode", () => {
            cascadingWarningContainer["isTrialMode"] = true;

            cascadingWarningContainer.renderTurboModeMsg(true);

            expect(instantiate).not.toHaveBeenCalled();
            expect(mockParentNode.addChild).not.toHaveBeenCalled();
            expect(mockWarningComponent.setData).not.toHaveBeenCalled();
        });

        it("should not add message when in trial mode for false turbo mode", () => {
            cascadingWarningContainer["isTrialMode"] = true;

            cascadingWarningContainer.renderTurboModeMsg(false);

            expect(instantiate).not.toHaveBeenCalled();
            expect(mockParentNode.addChild).not.toHaveBeenCalled();
            expect(mockWarningComponent.setData).not.toHaveBeenCalled();
        });
    });

    describe("renderShowReachMaxWin Method", () => {
        it("should add reach max win message when showReachMaxWin is true", () => {
            cascadingWarningContainer.renderShowReachMaxWin(true);

            expect(instantiate).toHaveBeenCalledWith(mockPrefab);
            expect(mockParentNode.addChild).toHaveBeenCalledWith(mockWarningNode);
            expect(mockWarningComponent.setData).toHaveBeenCalledWith(REACH_MAX_WIN_MSG);
        });

        it("should not add message when showReachMaxWin is false", () => {
            cascadingWarningContainer.renderShowReachMaxWin(false);

            expect(instantiate).not.toHaveBeenCalled();
            expect(mockParentNode.addChild).not.toHaveBeenCalled();
            expect(mockWarningComponent.setData).not.toHaveBeenCalled();
        });
    });

    describe("renderTrialMode Method", () => {
        it("should update isTrialMode when trial mode is true", () => {
            cascadingWarningContainer.renderTrialMode(true);

            expect(cascadingWarningContainer["isTrialMode"]).toBe(true);
        });

        it("should update isTrialMode when trial mode is false", () => {
            cascadingWarningContainer["isTrialMode"] = true;
            cascadingWarningContainer.renderTrialMode(false);

            expect(cascadingWarningContainer["isTrialMode"]).toBe(false);
        });

        it("should allow turbo mode messages after trial mode is disabled", () => {
            cascadingWarningContainer["isTrialMode"] = true;
            cascadingWarningContainer.renderTrialMode(false);

            cascadingWarningContainer.renderTurboModeMsg(true);

            expect(instantiate).toHaveBeenCalledWith(mockPrefab);
            expect(mockParentNode.addChild).toHaveBeenCalledWith(mockWarningNode);
            expect(mockWarningComponent.setData).toHaveBeenCalledWith(TURBO_ENABLED_MSG);
        });
    });

    describe("Translator Integration", () => {
        it("should use translator for enable turbo mode messages", () => {
            cascadingWarningContainer.renderTurboModeMsg(true);

            expect(gc.Translator.gameTranslate).toHaveBeenCalledWith("enable_turbo_mode");
        });

        it("should use translator for disable turbo mode messages", () => {
            cascadingWarningContainer.renderTurboModeMsg(false);

            expect(gc.Translator.gameTranslate).toHaveBeenCalledWith("disable_turbo_mode");
        });

        it("should use translator for reach max win messages", () => {
            cascadingWarningContainer.renderShowReachMaxWin(true);

            expect(gc.Translator.gameTranslate).toHaveBeenCalledWith("reach_max_win");
        });
    });

    describe("Integration Scenarios", () => {
        it("should handle multiple render calls in sequence", () => {
            cascadingWarningContainer.renderTurboModeMsg(true);
            cascadingWarningContainer.renderShowReachMaxWin(true);
            cascadingWarningContainer.renderTurboModeMsg(false);

            expect(instantiate).toHaveBeenCalledTimes(3);
            expect(mockParentNode.addChild).toHaveBeenCalledTimes(3);
            expect(mockWarningComponent.setData).toHaveBeenCalledWith(TURBO_ENABLED_MSG);
            expect(mockWarningComponent.setData).toHaveBeenCalledWith(REACH_MAX_WIN_MSG);
            expect(mockWarningComponent.setData).toHaveBeenCalledWith(TURBO_DISABLED_MSG);
        });

        it("should maintain trial mode state across multiple calls", () => {
            cascadingWarningContainer.renderTrialMode(true);
            cascadingWarningContainer.renderTurboModeMsg(true);
            cascadingWarningContainer.renderShowReachMaxWin(true);

            expect(instantiate).toHaveBeenCalledTimes(1);
            expect(mockWarningComponent.setData).toHaveBeenCalledWith(REACH_MAX_WIN_MSG);
        });

        it("should handle trial mode toggle correctly", () => {
            cascadingWarningContainer.renderTrialMode(true);
            cascadingWarningContainer.renderTurboModeMsg(true);
            cascadingWarningContainer.renderTrialMode(false);
            cascadingWarningContainer.renderTurboModeMsg(true);

            expect(instantiate).toHaveBeenCalledTimes(1);
            expect(mockWarningComponent.setData).toHaveBeenCalledWith(TURBO_ENABLED_MSG);
        });
    });

    describe("Decorators", () => {
        it("should have observer decorators properly configured", () => {
            expect(Observer.render).toBeDefined();
            expect(typeof Observer.render).toBe('function');
        });
    });
});