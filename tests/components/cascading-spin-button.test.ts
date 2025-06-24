import { Button, Node, sp, Tween, tween, UIOpacity } from "cc";
import { StateChangedEvent } from "db://shared-components/shared/common-components/button/custom-button";
import { CascadingSpinButton } from "../../assets/components/spin-button/cascading-spin-button";

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

jest.mock("../../assets/stores/cascading-ui-store");
jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => ({
    ObserverComponent: class {
        onLoad() {}
    },
}));
jest.mock("db://shared-components/shared/common-components/button/custom-button", () => ({
    StateChangedEvent: "state-changed",
    ButtonStateEvent: "button-interactable-changed",
    CustomButton: class extends Button {
        protected _getButtonState() {
            return 0;
        }
        protected _applyTransition(state: any) {}
        protected _updateState() {
            const state = this._getButtonState();
            this._applyTransition(state);
            this.node.emit(StateChangedEvent, state);
            this.node.emit("button-interactable-changed", this.interactable);
        }
    },
}));
jest.mock("db://shared-components/shared/common-components/button/status-button", () => ({
    ButtonState: {
        NORMAL: "normal",
        HOVER: "hover",
        PRESSED: "pressed",
        DISABLED: "disabled",
    },
}));
jest.mock("db://shared-components/shared/utils", () => ({
    AnimationUtils: {
        playSpine: jest.fn(),
        fadeOut: jest.fn(),
        fadeIn: jest.fn(),
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
            by: jest.fn().mockReturnThis(),
            repeatForever: jest.fn().mockReturnThis(),
            start: jest.fn(() => ({ stop: jest.fn() })),
        })),
    };
});

// Mock CascadingUIStore
jest.mock("../../assets/stores/cascading-ui-store", () => ({
    CascadingUIStore: class {
        isTurboMode = false;
        spinButtonState = "idle";
        disabledSpinButton = false;
    },
}));

// Mock SpinButtonState
jest.mock("../../assets/cascading-slot-utils", () => ({
    SpinButtonState: {
        SPINNING: "spinning",
        WIN_TUMBLE_OR_EVENT: "win_tumble_or_event",
        IDLE: "idle",
    },
}));

describe("CascadingSpinButton", () => {
    let cascadingSpinButton: CascadingSpinButton;
    let mockIconSpinSkeleton: sp.Skeleton;
    let mockNodeCircleNormal: Node;
    let mockNodeCircleBlur: Node;
    let mockNodeCircle: Node;
    let mockButton: Button;
    let mockUIOpacityNormal: UIOpacity;
    let mockUIOpacityBlur: UIOpacity;
    let mockTween: Tween<Node>;

    beforeEach(() => {
        // Create mock UIOpacity components
        mockUIOpacityNormal = {
            opacity: 255,
        } as unknown as UIOpacity;

        mockUIOpacityBlur = {
            opacity: 0,
        } as unknown as UIOpacity;

        // Create mock skeleton
        mockIconSpinSkeleton = {
            setAnimation: jest.fn(),
            clearAnimation: jest.fn(),
        } as unknown as sp.Skeleton;

        // Create mock nodes
        mockNodeCircleNormal = {
            getComponent: jest.fn().mockReturnValue(mockUIOpacityNormal),
        } as unknown as Node;

        mockNodeCircleBlur = {
            getComponent: jest.fn().mockReturnValue(mockUIOpacityBlur),
        } as unknown as Node;

        mockNodeCircle = {} as unknown as Node;

        // Create mock button
        mockButton = {
            node: {
                on: jest.fn(),
            },
            interactable: true,
        } as unknown as Button;

        // Create mock tween
        mockTween = {
            stop: jest.fn(),
        } as unknown as Tween<Node>;

        // Create instance of CascadingSpinButton
        cascadingSpinButton = new CascadingSpinButton();
        cascadingSpinButton.iconSpinSkeleton = mockIconSpinSkeleton;
        cascadingSpinButton.nodeCircleNormal = mockNodeCircleNormal;
        cascadingSpinButton.nodeCircleBlur = mockNodeCircleBlur;
        cascadingSpinButton.nodeCircle = mockNodeCircle;
    });

    describe("onLoad", () => {
        it("should initialize button and set up event listeners", () => {
            cascadingSpinButton.getComponent = jest.fn().mockReturnValue(mockButton);

            cascadingSpinButton.onLoad();

            expect(cascadingSpinButton.getComponent).toHaveBeenCalledWith(Button);
            expect(mockButton.node.on).toHaveBeenCalledWith(
                StateChangedEvent,
                cascadingSpinButton.onButtonStateChanged,
                cascadingSpinButton
            );
            expect(mockUIOpacityNormal.opacity).toBe(255);
            expect(mockUIOpacityBlur.opacity).toBe(0);
        });

        it("should handle null circle nodes gracefully", () => {
            cascadingSpinButton.nodeCircleNormal = null;
            cascadingSpinButton.nodeCircleBlur = null;
            cascadingSpinButton.getComponent = jest.fn().mockReturnValue(mockButton);

            expect(() => cascadingSpinButton.onLoad()).not.toThrow();
        });
    });

    describe("onButtonStateChanged", () => {
        it("should play hover animation when state is HOVER", () => {
            const { ButtonState } = require("db://shared-components/shared/common-components/button/status-button");
            cascadingSpinButton.onButtonStateChanged(ButtonState.HOVER);

            expect(mockIconSpinSkeleton.setAnimation).toHaveBeenCalledWith(1, "hover", true);
        });

        it("should clear hover animation when state is not HOVER", () => {
            const { ButtonState } = require("db://shared-components/shared/common-components/button/status-button");
            cascadingSpinButton.onButtonStateChanged(ButtonState.NORMAL);

            expect(mockIconSpinSkeleton.clearAnimation).toHaveBeenCalledWith(1);
        });
    });

    describe("playAnimationSpin", () => {
        it("should show blur circle and play spin animation", () => {
            const { AnimationUtils } = require("db://shared-components/shared/utils");
            cascadingSpinButton.showBlurCircle = jest.fn();
            cascadingSpinButton.animateCirclesRotation = jest.fn();

            cascadingSpinButton.playAnimationSpin();

            expect(cascadingSpinButton.showBlurCircle).toHaveBeenCalled();
            expect(cascadingSpinButton.animateCirclesRotation).toHaveBeenCalledWith(-900);
            expect(AnimationUtils.playSpine).toHaveBeenCalledWith(mockIconSpinSkeleton, "spin", true);
        });
    });

    describe("playAnimationIdle", () => {
        it("should show normal circle and play idle animation", async () => {
            const { AnimationUtils } = require("db://shared-components/shared/utils");
            cascadingSpinButton.showNormalCircle = jest.fn();
            cascadingSpinButton.animateCirclesRotation = jest.fn();

            await cascadingSpinButton.playAnimationIdle();

            expect(AnimationUtils.playSpine).toHaveBeenCalledWith(mockIconSpinSkeleton, "idle", true);
            expect(cascadingSpinButton.showNormalCircle).toHaveBeenCalled();
            expect(cascadingSpinButton.animateCirclesRotation).toHaveBeenCalledWith(-45);
        });
    });

    describe("stopCircleAnimations", () => {
        it("should stop circle tween if it exists", () => {
            cascadingSpinButton["circleTween"] = mockTween;

            cascadingSpinButton.stopCircleAnimations();

            expect(mockTween.stop).toHaveBeenCalled();
            expect(cascadingSpinButton["circleTween"]).toBeNull();
        });

        it("should handle null circle tween", () => {
            cascadingSpinButton["circleTween"] = null;

            expect(() => cascadingSpinButton.stopCircleAnimations()).not.toThrow();
        });
    });

    describe("playAnimationSpinTurbo", () => {
        it("should show blur circle and play turbo spin animation", () => {
            const { AnimationUtils } = require("db://shared-components/shared/utils");
            cascadingSpinButton.showBlurCircle = jest.fn();
            cascadingSpinButton.animateCirclesRotation = jest.fn();

            cascadingSpinButton.playAnimationSpinTurbo();

            expect(cascadingSpinButton.showBlurCircle).toHaveBeenCalled();
            expect(cascadingSpinButton.animateCirclesRotation).toHaveBeenCalledWith(-1080);
            expect(AnimationUtils.playSpine).toHaveBeenCalledWith(mockIconSpinSkeleton, "spin", true);
        });
    });

    describe("renderTurbo", () => {
        it("should update turbo state and change animation", () => {
            cascadingSpinButton.changeAnimationSpinning = jest.fn();

            cascadingSpinButton.renderTurbo(true);

            expect(cascadingSpinButton["isTurbo"]).toBe(true);
            expect(cascadingSpinButton.changeAnimationSpinning).toHaveBeenCalled();
        });
    });

    describe("changeAnimationSpinning", () => {
        it("should not change animation when not spinning", () => {
            cascadingSpinButton["isSpinning"] = false;
            cascadingSpinButton.playAnimationSpin = jest.fn();
            cascadingSpinButton.playAnimationSpinTurbo = jest.fn();

            cascadingSpinButton.changeAnimationSpinning();

            expect(cascadingSpinButton.playAnimationSpin).not.toHaveBeenCalled();
            expect(cascadingSpinButton.playAnimationSpinTurbo).not.toHaveBeenCalled();
        });

        it("should play turbo animation when spinning and turbo mode is on", () => {
            cascadingSpinButton["isSpinning"] = true;
            cascadingSpinButton["isTurbo"] = true;
            cascadingSpinButton.playAnimationSpinTurbo = jest.fn();

            cascadingSpinButton.changeAnimationSpinning();

            expect(cascadingSpinButton.playAnimationSpinTurbo).toHaveBeenCalled();
        });

        it("should play normal animation when spinning and turbo mode is off", () => {
            cascadingSpinButton["isSpinning"] = true;
            cascadingSpinButton["isTurbo"] = false;
            cascadingSpinButton.playAnimationSpin = jest.fn();

            cascadingSpinButton.changeAnimationSpinning();

            expect(cascadingSpinButton.playAnimationSpin).toHaveBeenCalled();
        });
    });

    describe("renderSpinButtonState", () => {
        it("should handle SPINNING state", () => {
            const { SpinButtonState } = require("../../assets/cascading-slot-utils");
            cascadingSpinButton.playAnimationSpinExtra = jest.fn();
            cascadingSpinButton.changeAnimationSpinning = jest.fn();

            cascadingSpinButton.renderSpinButtonState(SpinButtonState.SPINNING);

            expect(cascadingSpinButton["isSpinning"]).toBe(true);
            expect(cascadingSpinButton.playAnimationSpinExtra).toHaveBeenCalled();
            expect(cascadingSpinButton.changeAnimationSpinning).toHaveBeenCalled();
        });

        it("should handle WIN_TUMBLE_OR_EVENT state", () => {
            const { SpinButtonState } = require("../../assets/cascading-slot-utils");
            cascadingSpinButton.stopAnimationSpinExtra = jest.fn();
            cascadingSpinButton.showNormalCircle = jest.fn();
            cascadingSpinButton.stopCircleAnimations = jest.fn();

            cascadingSpinButton.renderSpinButtonState(SpinButtonState.WIN_TUMBLE_OR_EVENT);

            expect(cascadingSpinButton["isSpinning"]).toBe(false);
            expect(cascadingSpinButton.stopAnimationSpinExtra).toHaveBeenCalled();
            expect(cascadingSpinButton.showNormalCircle).toHaveBeenCalled();
            expect(cascadingSpinButton.stopCircleAnimations).toHaveBeenCalled();
        });

        it("should handle IDLE state", () => {
            const { SpinButtonState } = require("../../assets/cascading-slot-utils");
            cascadingSpinButton.stopAnimationSpinExtra = jest.fn();
            cascadingSpinButton.playAnimationIdle = jest.fn();

            cascadingSpinButton.renderSpinButtonState(SpinButtonState.IDLE);

            expect(cascadingSpinButton["isSpinning"]).toBe(false);
            expect(cascadingSpinButton.stopAnimationSpinExtra).toHaveBeenCalled();
            expect(cascadingSpinButton.playAnimationIdle).toHaveBeenCalled();
        });
    });

    describe("playAnimationSpinExtra", () => {
        it("should set spin-extra animation", () => {
            cascadingSpinButton.playAnimationSpinExtra();

            expect(mockIconSpinSkeleton.setAnimation).toHaveBeenCalledWith(2, "spin-extra", true);
        });
    });

    describe("stopAnimationSpinExtra", () => {
        it("should clear spin-extra animation", () => {
            cascadingSpinButton.stopAnimationSpinExtra();

            expect(mockIconSpinSkeleton.clearAnimation).toHaveBeenCalledWith(2);
        });
    });

    describe("renderCascadingState", () => {
        beforeEach(() => {
            jest.useFakeTimers();
            cascadingSpinButton["button"] = mockButton;
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it("should disable button after timeout", () => {
            cascadingSpinButton.renderCascadingState(true);

            jest.runAllTimers();

            expect(mockButton.interactable).toBe(false);
        });

        it("should enable button after timeout", () => {
            cascadingSpinButton.renderCascadingState(false);

            jest.runAllTimers();

            expect(mockButton.interactable).toBe(true);
        });
    });

    describe("animateCirclesRotation", () => {
        it("should stop existing animations and start new tween", () => {
            cascadingSpinButton.stopCircleAnimations = jest.fn();
            cascadingSpinButton.animateCircleNode = jest.fn().mockReturnValue(mockTween);

            cascadingSpinButton.animateCirclesRotation(360);

            expect(cascadingSpinButton.stopCircleAnimations).toHaveBeenCalled();
            expect(cascadingSpinButton.animateCircleNode).toHaveBeenCalledWith(mockNodeCircle, 360);
            expect(cascadingSpinButton["circleTween"]).toBe(mockTween);
        });
    });

    describe("showBlurCircle", () => {
        it("should fade out normal circle and fade in blur circle", () => {
            const { AnimationUtils } = require("db://shared-components/shared/utils");

            cascadingSpinButton.showBlurCircle();

            expect(AnimationUtils.fadeOut).toHaveBeenCalledWith(mockNodeCircleNormal, 0.2);
            expect(AnimationUtils.fadeIn).toHaveBeenCalledWith(mockNodeCircleBlur, 0.2);
        });
    });

    describe("showNormalCircle", () => {
        it("should fade in normal circle and fade out blur circle", () => {
            const { AnimationUtils } = require("db://shared-components/shared/utils");

            cascadingSpinButton.showNormalCircle();

            expect(AnimationUtils.fadeIn).toHaveBeenCalledWith(mockNodeCircleNormal, 0.2);
            expect(AnimationUtils.fadeOut).toHaveBeenCalledWith(mockNodeCircleBlur, 0.2);
        });
    });

    describe("animateCircleNode", () => {
        it("should create tween for valid node", () => {
            const result = cascadingSpinButton["animateCircleNode"](mockNodeCircle, 360);

            expect(tween).toHaveBeenCalledWith(mockNodeCircle);
            expect(result).toBeDefined();
        });

        it("should return null for null node", () => {
            const result = cascadingSpinButton["animateCircleNode"](null, 360);

            expect(result).toBeNull();
        });
    });
});
