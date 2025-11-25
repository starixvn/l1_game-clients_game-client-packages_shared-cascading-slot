import { instantiate, JsonAsset, Prefab } from "cc";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import { AnimationUtils } from "db://shared-components/shared/utils/utils";
import { GameSpeed, resourcesCache } from "../../../assets/cascading-slot-utils";
import { CascadingEffectGameContainer } from "../../../assets/components/effects/cascading-effect-game-container";

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
            SiteConfigs: jest.fn(),
        },
        Player: {
            MainPlayerStore: jest.fn(() => ({ balance: 1000, name: "test_player" })),
        },
        Notification: {
            NotificationStore: jest.fn(() => ({
                connection: {
                    on: jest.fn(),
                },
            })),
        },
        Bet: {
            BetStore: {},
            BetHandler: class {},
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
jest.mock("db://shared-components/shared/utils/utils", () => ({
    AnimationUtils: {
        delayTime: jest.fn().mockResolvedValue(undefined),
    },
}));
jest.mock("db://shared-components/game/audios/utils", () => ({
    AudioUtils: {
        stopStoppableSFX: jest.fn(),
        playStoppableSFX: jest.fn(),
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

// Mock getCustomDuration
jest.mock("../../../assets/cascading-slot-utils", () => {
    const GameSpeed = {
        NORMAL: "NORMAL",
        TURBO: "TURBO",
        ULTRA_FAST: "ULTRA_FAST",
    };

    return {
        getCustomDuration: jest.fn((key: string, gameSpeed: string) => {
            // Check if gameSpeed is TURBO or ULTRA_FAST (not NORMAL)
            // Compare directly to string values to avoid reference issues
            const isTurboMode = gameSpeed === "TURBO" || gameSpeed === "ULTRA_FAST";
            const durations: { [key: string]: number } = {
                freeSpin: isTurboMode ? 1.0 : 2.0,
                transition: isTurboMode ? 0.5 : 1.0,
                eventMascot: isTurboMode ? 0.3 : 0.6,
            };
            return durations[key] || 1.0;
        }),

        GameSpeed,

        resourcesCache: {
            gameFeatures: {
                turnOnEventMascot: true,
            },
        },
    };
});

describe("CascadingEffectGameContainer", () => {
    let cascadingEffectGameContainer: CascadingEffectGameContainer;
    let mockPfbEffectFreespin: Prefab;
    let mockPfbEffectBigWin: Prefab;
    let mockPfbEffectTransition: Prefab;
    let mockGameInfo: JsonAsset;
    let mockNode: any;

    beforeEach(() => {
        // Create mock prefabs
        mockPfbEffectFreespin = {} as Prefab;
        mockPfbEffectBigWin = {} as Prefab;
        mockPfbEffectTransition = {} as Prefab;

        // Create mock game info
        mockGameInfo = {
            json: {
                turnOnEventMascot: true,
            },
        } as unknown as JsonAsset;

        // Create mock node
        mockNode = {
            destroyAllChildren: jest.fn(),
            addChild: jest.fn(),
        };

        // Create instance of CascadingEffectGameContainer
        cascadingEffectGameContainer = new CascadingEffectGameContainer();
        cascadingEffectGameContainer["gameSpeed"] = GameSpeed.NORMAL;
        cascadingEffectGameContainer.pfbEffectFreespin = mockPfbEffectFreespin;
        cascadingEffectGameContainer.pfbEffectBigWin = mockPfbEffectBigWin;
        cascadingEffectGameContainer.pfbEffectTransition = mockPfbEffectTransition;
        cascadingEffectGameContainer.node = mockNode;
    });

    describe("onLoad", () => {
        it("should initialize game config and destroy all children", () => {
            cascadingEffectGameContainer.onLoad();

            expect(cascadingEffectGameContainer["gameConfig"]).toBe(resourcesCache.gameFeatures);
            expect(mockNode.destroyAllChildren).toHaveBeenCalled();
        });
    });

    describe("freeSpinEffectVisibility", () => {
        beforeEach(() => {
            cascadingEffectGameContainer.delayMascotEvent = jest.fn();
            cascadingEffectGameContainer["playEffectTransition"] = jest.fn();
            cascadingEffectGameContainer.playSound = jest.fn();
        });

        it("should destroy all children when effect is hidden", async () => {
            await cascadingEffectGameContainer.freeSpinEffectVisibility(false);

            expect(mockNode.destroyAllChildren).toHaveBeenCalled();
            expect(cascadingEffectGameContainer.delayMascotEvent).not.toHaveBeenCalled();
            expect(cascadingEffectGameContainer["playEffectTransition"]).not.toHaveBeenCalled();
        });

        it("should play free spin effect when visible", async () => {
            await cascadingEffectGameContainer.freeSpinEffectVisibility(true);

            expect(cascadingEffectGameContainer.delayMascotEvent).toHaveBeenCalled();
            expect(cascadingEffectGameContainer["playEffectTransition"]).toHaveBeenCalled();
            expect(cascadingEffectGameContainer.playSound).toHaveBeenCalledWith(AudioIds.FREESPIN);
            expect(instantiate).toHaveBeenCalledWith(mockPfbEffectFreespin);
            expect(mockNode.addChild).toHaveBeenCalled();
        });
    });

    describe("renderBigWinEffect", () => {
        beforeEach(() => {
            cascadingEffectGameContainer.delayMascotEvent = jest.fn();
            cascadingEffectGameContainer["playEffectTransition"] = jest.fn();
            cascadingEffectGameContainer.playSound = jest.fn();
            cascadingEffectGameContainer.playSoundCoinIncrement = jest.fn();
        });

        it("should destroy all children when effect is hidden", async () => {
            await cascadingEffectGameContainer.renderBigWinEffect(false);

            expect(mockNode.destroyAllChildren).toHaveBeenCalled();
            expect(cascadingEffectGameContainer.delayMascotEvent).not.toHaveBeenCalled();
            expect(cascadingEffectGameContainer["playEffectTransition"]).not.toHaveBeenCalled();
        });

        it("should play big win effect when visible in normal mode", async () => {
            cascadingEffectGameContainer["gameSpeed"] = GameSpeed.NORMAL;

            await cascadingEffectGameContainer.renderBigWinEffect(true);

            expect(cascadingEffectGameContainer.delayMascotEvent).toHaveBeenCalled();
            expect(cascadingEffectGameContainer["playEffectTransition"]).toHaveBeenCalled();
            expect(instantiate).toHaveBeenCalledWith(mockPfbEffectBigWin);
            expect(mockNode.addChild).toHaveBeenCalled();
        });

        it("should not play coin increment sound in turbo mode", async () => {
            cascadingEffectGameContainer["isTurboMode"] = true;

            await cascadingEffectGameContainer.renderBigWinEffect(true);

            expect(cascadingEffectGameContainer.playSoundCoinIncrement).not.toHaveBeenCalled();
        });
    });

    describe("renderTurboMode", () => {
        it("should update turbo mode state", () => {
            const gameSpeed = GameSpeed.TURBO;

            cascadingEffectGameContainer.renderTurboMode(gameSpeed);

            expect(cascadingEffectGameContainer["gameSpeed"]).toBe(GameSpeed.TURBO);
        });

        it("should toggle turbo mode state", () => {
            // Set initial state
            cascadingEffectGameContainer["gameSpeed"] = GameSpeed.NORMAL;

            // Toggle to true
            cascadingEffectGameContainer.renderTurboMode(GameSpeed.TURBO);
            expect(cascadingEffectGameContainer["gameSpeed"]).toBe(GameSpeed.TURBO);

            // Toggle to false
            cascadingEffectGameContainer.renderTurboMode(GameSpeed.NORMAL);
            expect(cascadingEffectGameContainer["gameSpeed"]).toBe(GameSpeed.NORMAL);
        });
    });

    describe("playSound", () => {
        it("should return the sound id", () => {
            const result = cascadingEffectGameContainer.playSound("test_sound");

            expect(result).toBe("test_sound");
        });
    });

    describe("playSoundCoinIncrement", () => {
        it("should return increment sound id", () => {
            const result = cascadingEffectGameContainer.playSoundCoinIncrement();

            expect(result).toBe("wincount-increment");
        });
    });

    describe("stopSoundCoinIncrement", () => {
        it("should return increment sound id", () => {
            const result = cascadingEffectGameContainer.stopSoundCoinIncrement();

            expect(result).toBe("wincount-increment");
        });
    });

    describe("playEffectTransition", () => {
        beforeEach(() => {
            cascadingEffectGameContainer.playSound = jest.fn();
            cascadingEffectGameContainer["gameSpeed"] = GameSpeed.NORMAL;
        });

        it("should play transition effect when prefab exists", async () => {
            await cascadingEffectGameContainer["playEffectTransition"]();

            expect(cascadingEffectGameContainer.playSound).toHaveBeenCalledWith("transition");
            expect(instantiate).toHaveBeenCalledWith(mockPfbEffectTransition);
            expect(mockNode.addChild).toHaveBeenCalled();
            expect(AnimationUtils.delayTime).toHaveBeenCalledWith(1);
        });

        it("should use turbo mode duration when turbo mode is enabled", async () => {
            cascadingEffectGameContainer["gameSpeed"] = GameSpeed.TURBO;

            await cascadingEffectGameContainer["playEffectTransition"]();

            expect(AnimationUtils.delayTime).toHaveBeenCalledWith(0.5);
        });

        it("should return early when transition prefab is null", async () => {
            cascadingEffectGameContainer.pfbEffectTransition = null;
            jest.mocked(instantiate).mockClear();

            await cascadingEffectGameContainer["playEffectTransition"]();

            expect(cascadingEffectGameContainer.playSound).not.toHaveBeenCalled();
            expect(instantiate).not.toHaveBeenCalled();
            expect(mockNode.addChild).not.toHaveBeenCalled();
        });
    });
});
