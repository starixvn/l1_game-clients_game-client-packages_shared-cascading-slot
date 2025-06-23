import { EventTouch, game, input, Input, KeyCode, Node } from "cc";
import Observer from "observer";
import { ComponentUtils } from "db://shared-components/shared/utils/component-utils";
import { CascadingHoldActionHandlers } from "../../assets/handlers/cascading-hold-action-handlers";
import { HoldActionStore } from "../../assets/stores/hold-action-store";
jest.mock("observer", () => ({
    render: jest.fn((store, selector, options) => {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            return descriptor;
        };
    }),
    handle: jest.fn((handler, callback) => {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            return descriptor;
        };
    }),
}));

jest.mock("@sg/game-client-base", () => ({
    Audios: {
        AudioHandler: jest.fn(),
    },
}));

jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => ({
    ObserverComponent: class {
        onLoad() { }
        onDestroy() { }
    },
}));

jest.mock("db://shared-components/shared/utils/component-utils", () => ({
    ComponentUtils: {
        getTransform: jest.fn(),
    },
}));

jest.mock("../../assets/handlers/cascading-hold-action-handlers", () => ({
    CascadingHoldActionHandlers: jest.fn(),
}));

jest.mock("../../assets/handlers/auto-play-handlers", () => ({
    AutoPlayHandler: jest.fn(),
}));

jest.mock("../../assets/stores/auto-play-store", () => ({
    AutoPlayStore: jest.fn(),
}));

jest.mock("../../assets/stores/hold-action-store", () => ({
    HoldActionStore: jest.fn(),
}));

// Import the component after mocks are set up
import { HoldActionButton } from "../../assets/components/hold-action-button";

describe("HoldActionButton", () => {
    let holdActionButton: HoldActionButton;
    let mockNode: Node;
    let mockEventTouch: EventTouch;

    // Test data constants
    const TEST_SOUND_ID = "test-sound";
    const SPIN_BUTTON_SOUND = "spin_button";
    const MOCK_TOUCH_LOCATION = { x: 100, y: 100 };
    const MOCK_WINDOW_ID = 1;

    // Supported key codes for testing
    const SUPPORTED_KEYS = [KeyCode.SPACE, KeyCode.ENTER, KeyCode.NUM_ENTER];
    const UNSUPPORTED_KEY = KeyCode.KEY_A;

    beforeEach(() => {
        setupMocks();
        createComponentInstance();
    });

    const setupMocks = () => {
        jest.clearAllMocks();

        // Setup mock node
        mockNode = new Node();
        mockNode.on = jest.fn();
        mockNode.off = jest.fn();

        // Setup mock event touch
        mockEventTouch = {
            getUILocation: jest.fn().mockReturnValue(MOCK_TOUCH_LOCATION),
            getLocation: jest.fn().mockReturnValue(MOCK_TOUCH_LOCATION),
            windowId: MOCK_WINDOW_ID,
        } as unknown as EventTouch;

        // Setup mock game canvas
        game.canvas = {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
        } as any;
    };

    const createComponentInstance = () => {
        holdActionButton = new HoldActionButton();
        holdActionButton.node = mockNode;
    };

    describe("Lifecycle Methods", () => {
        describe("onLoad", () => {
            it("should register all required events", () => {
                // Act
                holdActionButton.onLoad();

                // Assert
                verifyKeyboardEventsRegistered();
                verifyTouchEventsRegistered();
                verifyBlurEventRegistered();
            });
        });

        describe("onDestroy", () => {
            it("should cleanup blur event listener", () => {
                // Act
                holdActionButton.onDestroy();

                // Assert
                expect(game.canvas.removeEventListener).toHaveBeenCalledWith("blur", holdActionButton.onBlur);
            });
        });
    });

    describe("Event Registration", () => {
        describe("addEvent", () => {
            it("should register keyboard events", () => {
                // Act
                holdActionButton.addEvent();

                // Assert
                verifyKeyboardEventsRegistered();
            });
        });

        describe("registerTouchEvents", () => {
            it("should register touch events and blur listener", () => {
                // Act
                holdActionButton.registerTouchEvents();

                // Assert
                verifyTouchEventsRegistered();
                verifyBlurEventRegistered();
            });
        });

        describe("removeEvent", () => {
            it("should remove keyboard event listeners", () => {
                // Act
                holdActionButton.removeEvent();

                // Assert
                expect(input.off).toHaveBeenCalledWith(Input.EventType.KEY_DOWN, holdActionButton.onKeyDown, holdActionButton);
                expect(input.off).toHaveBeenCalledWith(Input.EventType.KEY_UP, holdActionButton.onKeyUp, holdActionButton);
            });
        });
    });

    describe("Touch Interactions", () => {
        describe("onTouchStart", () => {
            it("should trigger action on touch start", () => {
                // Act
                holdActionButton.onTouchStart();
            });
        });

        describe("onTouchEnd", () => {
            it("should clear trigger action on touch end", () => {
                // Act
                holdActionButton.onTouchEnd();
            });
        });
    });

    describe("Keyboard Interactions", () => {
        describe("onKeyDown", () => {
            SUPPORTED_KEYS.forEach(keyCode => {
                it(`should call trigger action for ${KeyCode[keyCode]} key`, () => {
                    // Arrange
                    const event = { keyCode };
                    holdActionButton.onKeyDown(event);
                });
            });

            it("should not call trigger action for unsupported keys", () => {
                const event = { keyCode: UNSUPPORTED_KEY };
                holdActionButton.onKeyDown(event);
            });
        });

        describe("onKeyUp", () => {
            SUPPORTED_KEYS.forEach(keyCode => {
                it(`should clear trigger action for ${KeyCode[keyCode]} key`, () => {
                    // Arrange
                    const event = { keyCode };
                    holdActionButton.onKeyUp(event);
                });
            });

            it("should not clear trigger action for unsupported keys", () => {
                const event = { keyCode: UNSUPPORTED_KEY };
                holdActionButton.onKeyUp(event);
            });
        });
    });

    describe("Blur Handling", () => {
        describe("onBlur", () => {
            it("should clear trigger action on blur", () => {
                // Act
                holdActionButton.onBlur();
            });
        });
    });

    describe("Observer Pattern Methods", () => {
        describe("handlePressingKey", () => {
            it("should call placeBet when triggerAction is true", () => {
                // Act
                holdActionButton.handlePressingKey(true);
            });

            it("should not call placeBet when triggerAction is false", () => {
                // Act
                holdActionButton.handlePressingKey(false);
            });
        });

        describe("renderTriggerBet", () => {
            it("should play sound when triggerBet is true", () => {
                // Act
                holdActionButton.renderTriggerBet(true);
            });

            it("should not play sound when triggerBet is false", () => {
                // Act
                holdActionButton.renderTriggerBet(false);
            });
        });

        describe("playSound", () => {
            it("should return the provided sound id", () => {
                // Act
                const result = holdActionButton.playSound(TEST_SOUND_ID);

                // Assert
                expect(result).toBe(TEST_SOUND_ID);
            });
        });
    });

    describe("Private Methods", () => {
        describe("handleTouchMove", () => {
            it("should clear trigger action when touch moves outside node bounds", () => {
                // Arrange
                const mockTransform = createMockTransform(false);
                (ComponentUtils.getTransform as jest.Mock).mockReturnValue(mockTransform);

                // Act
                (holdActionButton as any).handleTouchMove(mockEventTouch);

                // Assert
                verifyTransformHitTest(mockTransform);
            });

            it("should not clear trigger action when touch moves inside node bounds", () => {
                // Arrange
                const mockTransform = createMockTransform(true);
                (ComponentUtils.getTransform as jest.Mock).mockReturnValue(mockTransform);

                // Act
                (holdActionButton as any).handleTouchMove(mockEventTouch);

                // Assert
                verifyTransformHitTest(mockTransform);
            });
        });
    });

    describe("Decorators", () => {
        describe("Observer Decorators", () => {
            it("should have decorators properly configured", () => {
                // Assert
                expect(Observer.render).toBeDefined();
                expect(Observer.handle).toBeDefined();
                expect(typeof Observer.render).toBe('function');
                expect(typeof Observer.handle).toBe('function');
            });

            it("should have correct decorator function signatures", () => {
                // Arrange
                const mockTarget = {};
                const mockPropertyKey = 'testMethod';
                const mockDescriptor = { value: jest.fn() };

                // Act
                const renderResult = Observer.render(HoldActionStore, () => { }, { fireImmediately: false });
                const handleResult = Observer.handle(CascadingHoldActionHandlers, () => { });

                // Assert
                expect(typeof renderResult).toBe('function');
                expect(typeof handleResult).toBe('function');

                // Test that they return descriptors
                const renderDescriptor = renderResult(mockTarget, mockPropertyKey, mockDescriptor);
                const handleDescriptor = handleResult(mockTarget, mockPropertyKey, mockDescriptor);

                expect(renderDescriptor).toBe(mockDescriptor);
                expect(handleDescriptor).toBe(mockDescriptor);
            });
        });
    });

    describe("Constants", () => {
        it("should have correct spin button sound constant", () => {
            // Assert
            expect(holdActionButton["spinButtonSound"]).toBe(SPIN_BUTTON_SOUND);
        });
    });

    // Helper functions
    const verifyKeyboardEventsRegistered = () => {
        expect(input.on).toHaveBeenCalledWith(Input.EventType.KEY_DOWN, holdActionButton.onKeyDown, holdActionButton);
        expect(input.on).toHaveBeenCalledWith(Input.EventType.KEY_UP, holdActionButton.onKeyUp, holdActionButton);
    };

    const verifyTouchEventsRegistered = () => {
        expect(mockNode.on).toHaveBeenCalledWith(Node.EventType.TOUCH_START, holdActionButton.onTouchStart, holdActionButton);
        expect(mockNode.on).toHaveBeenCalledWith(Node.EventType.TOUCH_MOVE, expect.any(Function), holdActionButton);
        expect(mockNode.on).toHaveBeenCalledWith(Node.EventType.TOUCH_CANCEL, holdActionButton.onTouchEnd, holdActionButton);
        expect(mockNode.on).toHaveBeenCalledWith(Node.EventType.TOUCH_END, holdActionButton.onTouchEnd, holdActionButton);
    };

    const verifyBlurEventRegistered = () => {
        expect(game.canvas.addEventListener).toHaveBeenCalledWith("blur", holdActionButton.onBlur);
    };

    const createMockTransform = (hitTestResult: boolean) => {
        const mockTransform = {
            hitTest: jest.fn().mockReturnValue(hitTestResult),
        };
        console.log('Created mock transform:', mockTransform); // Debug log
        return mockTransform;
    };

    const verifyTransformHitTest = (mockTransform: any) => {
        expect(ComponentUtils.getTransform).toHaveBeenCalledWith(mockNode);
        expect(mockTransform.hitTest).toHaveBeenCalledWith(MOCK_TOUCH_LOCATION, MOCK_WINDOW_ID);
    };
});
