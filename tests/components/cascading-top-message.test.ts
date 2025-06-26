import { Color, JsonAsset, Label, Node, Sprite, SpriteAtlas, SpriteFrame } from "cc";

// Mock _decorator
jest.mock("cc", () => {
    const originalModule = jest.requireActual("cc");
    return {
        ...originalModule,
        _decorator: {
            ccclass: jest.fn((target: any) => target),
            property: jest.fn((options?: any) => (target: any, propertyKey: string) => {}),
        },
        macro: {
            REPEAT_FOREVER: -1,
        },
        Component: class {
            schedule(callback: Function, interval: number, repeat: number, delay: number) {
                // Mock implementation
            }
            unschedule(callback: Function) {
                // Mock implementation
            }
            unscheduleAllCallbacks() {
                // Mock implementation
            }
            scheduleOnce(callback: Function, delay: number) {
                // Mock implementation
            }
            getComponentsInChildren(componentType: any) {
                return [];
            }
            node: any;
        },
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
        Translator: {
            gameTranslate: jest.fn((key: string) => {
                const translations: { [key: string]: string } = {
                    top_message3: "Max win per round: %{maxWin}",
                };
                return translations[key] || key;
            }),
        },
    };
    return mockGc;
});

jest.mock("../../assets/stores/cascading-ui-store", () => ({
    CascadingUIStore: class {
        isHideTopMessage = false;
    },
}));

jest.mock("../../assets/stores/cascading-slot-configs-store", () => ({
    CascadingSlotConfigsStore: class {
        gameConfigs = null;
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

// Mock lodash-es random function
jest.mock("lodash-es", () => ({
    random: jest.fn(),
}));

// Import after mocks are set up
import { CascadingTopMessage } from "../../assets/components/top-message/cascading-top-message";

describe("CascadingTopMessage", () => {
    let cascadingTopMessage: CascadingTopMessage & { schedule: jest.Mock; getComponentsInChildren: jest.Mock };
    let mockIconMultiplier: Sprite;
    let mockMsg3: Label;
    let mockNodeContent: Node;
    let mockMainAtlas: SpriteAtlas;
    let mockColorInfo: JsonAsset;
    let mockSpriteFrame: SpriteFrame;
    let mockChildNodes: Node[];

    beforeEach(() => {
        // Create mock sprite frame
        mockSpriteFrame = {} as SpriteFrame;

        // Create mock sprite
        mockIconMultiplier = {
            spriteFrame: null,
        } as unknown as Sprite;

        // Create mock label
        mockMsg3 = {
            string: "",
            color: new Color(),
        } as unknown as Label;

        // Create mock child nodes
        mockChildNodes = [{ active: false } as Node, { active: false } as Node, { active: false } as Node];

        // Create mock content node
        mockNodeContent = {
            children: mockChildNodes,
        } as unknown as Node;

        // Create mock sprite atlas
        mockMainAtlas = {
            getSpriteFrame: jest.fn().mockReturnValue(mockSpriteFrame),
        } as unknown as SpriteAtlas;

        // Create mock color info
        mockColorInfo = {
            json: {
                topMessageTextColor: "#FFFFFF",
            },
        } as unknown as JsonAsset;

        // Create instance of CascadingTopMessage with proper inheritance
        cascadingTopMessage = new CascadingTopMessage() as CascadingTopMessage & {
            schedule: jest.Mock;
            getComponentsInChildren: jest.Mock;
        };

        // Add required methods for testing
        cascadingTopMessage.schedule = jest.fn();
        cascadingTopMessage.getComponentsInChildren = jest.fn();

        // Initialize properties
        cascadingTopMessage.iconMultiplier = mockIconMultiplier;
        cascadingTopMessage.msg3 = mockMsg3;
        cascadingTopMessage.nodeContent = mockNodeContent;
        cascadingTopMessage.mainAtlas = mockMainAtlas;
        cascadingTopMessage.colorInfo = mockColorInfo;

        // Initialize private properties
        cascadingTopMessage["colorConfig"] = mockColorInfo.json;
        cascadingTopMessage["maxWinPerRound"] = "1000000";
    });

    describe("topMessageVisibility", () => {
        it("should hide node when isHideTopMessage is true", () => {
            cascadingTopMessage.node = { active: true } as Node;

            cascadingTopMessage.topMessageVisibility(true);

            expect(cascadingTopMessage.node.active).toBe(false);
        });

        it("should show node when isHideTopMessage is false", () => {
            cascadingTopMessage.node = { active: false } as Node;

            cascadingTopMessage.topMessageVisibility(false);

            expect(cascadingTopMessage.node.active).toBe(true);
        });
    });

    describe("updateTopMessage", () => {
        it("should update icon and show random child node", () => {
            const { random } = require("lodash-es");
            random.mockReturnValue(1); // Return index 1 (second item)

            // Check initial state - all children should be false
            mockChildNodes.forEach((child) => {
                expect(child.active).toBe(false);
            });

            cascadingTopMessage.updateTopMessage();

            expect(mockMainAtlas.getSpriteFrame).toHaveBeenCalledWith("symbol-13");
            expect(mockIconMultiplier.spriteFrame).toBe(mockSpriteFrame);

            // Check that the randomly selected child is set to true
            expect(mockChildNodes[1].active).toBe(true);
            // Check that other children remain false
            expect(mockChildNodes[0].active).toBe(false);
            expect(mockChildNodes[2].active).toBe(false);
        });

        it("should handle different random selections", () => {
            const { random } = require("lodash-es");
            random.mockReturnValue(2); // Return index 2 (third item)

            cascadingTopMessage.updateTopMessage();

            expect(mockChildNodes[2].active).toBe(true);
            expect(mockChildNodes[0].active).toBe(false);
            expect(mockChildNodes[1].active).toBe(false);
        });
    });

    describe("updateMaxWin", () => {
        it("should update maxWinPerRound and call renderMsg3 when gameConfigs exists", () => {
            const gameConfigs = { maxWinPerRound: "5000000" };
            cascadingTopMessage.renderMsg3 = jest.fn();

            cascadingTopMessage.updateMaxWin(gameConfigs);

            expect(cascadingTopMessage["maxWinPerRound"]).toBe("5000000");
            expect(cascadingTopMessage.renderMsg3).toHaveBeenCalled();
        });

        it("should not update when gameConfigs is null", () => {
            cascadingTopMessage.renderMsg3 = jest.fn();
            const originalMaxWin = cascadingTopMessage["maxWinPerRound"];

            cascadingTopMessage.updateMaxWin(null);

            expect(cascadingTopMessage["maxWinPerRound"]).toBe(originalMaxWin);
            expect(cascadingTopMessage.renderMsg3).not.toHaveBeenCalled();
        });

        it("should not update when gameConfigs is undefined", () => {
            cascadingTopMessage.renderMsg3 = jest.fn();
            const originalMaxWin = cascadingTopMessage["maxWinPerRound"];

            cascadingTopMessage.updateMaxWin(undefined);

            expect(cascadingTopMessage["maxWinPerRound"]).toBe(originalMaxWin);
            expect(cascadingTopMessage.renderMsg3).not.toHaveBeenCalled();
        });
    });

    describe("renderMsg3", () => {
        it("should update msg3 with translated text and maxWin value", () => {
            const { Translator } = require("@sg/game-client-base");
            cascadingTopMessage["maxWinPerRound"] = "2000000";

            cascadingTopMessage.renderMsg3();

            expect(Translator.gameTranslate).toHaveBeenCalledWith("top_message3");
            expect(mockMsg3.string).toBe("Max win per round: 2000000");
        });

        it("should handle different maxWin values", () => {
            const { Translator } = require("@sg/game-client-base");
            cascadingTopMessage["maxWinPerRound"] = "10000000";

            cascadingTopMessage.renderMsg3();

            expect(mockMsg3.string).toBe("Max win per round: 10000000");
        });

        it("should handle case insensitive replacement", () => {
            const { Translator } = require("@sg/game-client-base");
            Translator.gameTranslate.mockReturnValue("MAX WIN: %{MAXWIN}");
            cascadingTopMessage["maxWinPerRound"] = "5000000";

            cascadingTopMessage.renderMsg3();

            expect(mockMsg3.string).toBe("MAX WIN: 5000000");
        });
    });
});
