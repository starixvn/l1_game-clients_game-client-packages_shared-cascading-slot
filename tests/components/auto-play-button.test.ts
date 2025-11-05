import { Node, Sprite } from "cc";
import AutoPlayButton from "../../assets/components/auto-play/auto-play-button";

const mockMainPlayerStore = {
    balance: 1000,
    name: "test_player",
};

jest.mock("@sg/game-client-base", () => {
    const mockGc = {
        Connection: {},
        Audios: {
            AudioHandler: {},
            AudioIds: {
                CLICK: "click_sound",
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
                storagePrefixKey: "test_prefix",
            },
        },
        Player: {
            MainPlayerStore: jest.fn(() => mockMainPlayerStore),
        },
        Bet: {
            BetStore: {},
            BetHandler: class { },
        },
        Notices: {
            NoticeStore: {},
            NoticeErrorsHandlers: {
                AutoSignOutHandler: jest.fn(() => ({})),
            },
        },
        Error: {
            ErrorStore: {},
        },
        Rounds: {
            RoundStore: {},
        },
         Shared: {
            IHandler: class { },
            IMultipleHandlers: class { },
            utils: {
                StorageManager: {
                    setPrefixKey: jest.fn(),
                },
            },
        },
        UserSettings: {
            UserSettingHandlers: class {
                handle() { }
            },
        },
        GameUserSettings: {
            GameUserSettingHandler: class {
                handle() { }
            },
        },
        Notification: {
            NotificationStore: jest.fn(() => ({
                connection: {
                    on: jest.fn(),
                },
            })),
        },
        StorageManager: {
            // Add any storage manager functions that might be needed
            // This prevents "Cannot read properties of undefined (reading 'StorageManager')" error
        },
        utils: {
            // Add any utility functions that might be needed
            // This prevents "Cannot read properties of undefined (reading 'utils')" error
        },
    };
    return mockGc;
});

jest.mock("../../assets/handlers/auto-play-handlers", () => {
    const mockHandler = {
        clickAutoPlay: jest.fn(),
    };
    return {
        AutoPlayHandler: jest.fn(() => mockHandler),
    };
});
jest.mock("../../assets/handlers/cascading-ui-handler");
jest.mock("../../assets/stores/auto-play-store");
jest.mock("../../assets/stores/cascading-ui-store");
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

describe("AutoPlayButton", () => {
    let autoPlayButton: AutoPlayButton;
    let mockSprIconAutoPlay: Sprite;
    let mockSprIconPause: Sprite;
    let mockNodeDisabled: Node;

    beforeEach(() => {
        mockSprIconAutoPlay = {
            node: { active: true },
        } as unknown as Sprite;

        mockSprIconPause = {
            node: { active: false },
        } as unknown as Sprite;

        mockNodeDisabled = {
            active: false,
        } as unknown as Node;

        autoPlayButton = new AutoPlayButton();
        autoPlayButton.sprIconAutoPlay = mockSprIconAutoPlay;
        autoPlayButton.sprIconPause = mockSprIconPause;
        autoPlayButton.nodeDisabled = mockNodeDisabled;
    });

    describe("onClickAutoPlay", () => {
        it("should play click sound and handle symbol preview visibility", () => {
            autoPlayButton.playSoundClick = jest.fn();

            autoPlayButton.onClickAutoPlay();

            expect(autoPlayButton.playSoundClick).toHaveBeenCalled();
        });
    });

    describe("updateAutoPlayButton", () => {
        it("should update button visibility when auto play is turned on", () => {
            autoPlayButton.updateAutoPlayButton(true);

            expect(mockSprIconAutoPlay.node.active).toBe(false);
            expect(mockSprIconPause.node.active).toBe(true);
        });

        it("should update button visibility when auto play is turned off", () => {
            autoPlayButton.updateAutoPlayButton(false);

            expect(mockSprIconAutoPlay.node.active).toBe(true);
            expect(mockSprIconPause.node.active).toBe(false);
        });
    });

    describe("playSoundClick", () => {
        it("should return correct audio ID", () => {
            const result = autoPlayButton.playSoundClick();
            expect(result).toBe("click_sound");
        });
    });

    describe("disabledAutoPlay", () => {
        it("should update disabled node visibility", () => {
            autoPlayButton.disabledAutoPlay(true);
            expect(mockNodeDisabled.active).toBe(true);

            autoPlayButton.disabledAutoPlay(false);
            expect(mockNodeDisabled.active).toBe(false);
        });
    });

});
