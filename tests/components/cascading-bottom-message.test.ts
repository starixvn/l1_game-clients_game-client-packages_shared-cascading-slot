import { Color, JsonAsset, RichText } from "cc";

// Mock _decorator
jest.mock("cc", () => {
    const originalModule = jest.requireActual("cc");
    return {
        ...originalModule,
        _decorator: {
            ccclass: jest.fn((target: any) => target),
            property: jest.fn((options?: any) => (target: any, propertyKey: string) => {}),
        },
        sys: {
            ...originalModule.sys,
            isMobile: false,
            os: "Unknown",
            OS: {
                UNKNOWN: "Unknown",
                IOS: "iOS",
                ANDROID: "Android",
                WINDOWS: "Windows",
                LINUX: "Linux",
                OSX: "OS X",
                OHOS: "OHOS",
                OPENHARMONY: "OpenHarmony",
            },
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
                    free_spin_left_amount: "Free spins left: %{amount}",
                    auto_spin_left: "Auto spins left",
                    round_settle_msg: "Round settling...",
                    win_tumble_msg: "Win tumbling!",
                    show_msg_when_spin_phone: "Tap to spin on phone",
                    show_msg_when_spin_desktop: "Click to spin on desktop",
                    from_settle_to_spin1: "Ready to spin message 1",
                    from_settle_to_spin2: "Ready to spin message 2",
                    from_settle_to_spin3: "Ready to spin message 3",
                };
                return translations[key] || key;
            }),
        },
    };
    return mockGc;
});

jest.mock("../../assets/stores/auto-play-store", () => ({
    AutoPlayStore: class {
        roundsAutoplay = 0;
    },
}));

jest.mock("../../assets/stores/cascading-ui-store", () => ({
    CascadingUIStore: class {
        bottomMessageState = "";
        isTurboMode = false;
        freespinCountMsgBottom = 0;
        isTrialMode = false;
    },
}));

jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => ({
    ObserverComponent: class {
        onLoad() {}
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

// Mock lodash-es random function
jest.mock("lodash-es", () => ({
    random: jest.fn(),
}));

// Mock SlotNotification
jest.mock("../../assets/cascading-slot-utils", () => ({
    SlotNotification: {
        BEFORE_SPIN: "before_spin",
        BEFORE_SPIN_TRIAL: "before_spin_trial",
        SPINNING: "spinning",
        SETTLED: "settled",
        TUMBLE_WIN: "tumble_win",
        AUTO_SPIN: "auto_spin",
        FREESPINS: "freespins",
    },
}));

// Import after mocks are set up
import { SlotNotification } from "../../assets/cascading-slot-utils";
import { CascadingBottomMessage } from "../../assets/components/bottom-message/cascading-bottom-message";

describe("CascadingBottomMessage", () => {
    let cascadingBottomMessage: CascadingBottomMessage;
    let mockMsgRichText: RichText;
    let mockColorInfo: JsonAsset;
    let mockColor: Color;

    beforeEach(() => {
        // Create mock color
        mockColor = {
            fromHEX: jest.fn().mockReturnThis(),
        } as unknown as Color;

        // Create mock rich text
        mockMsgRichText = {
            string: "",
        } as any as RichText;

        // Create mock color info
        mockColorInfo = {
            json: {
                noticeHighlightTextColor: "#FFD700",
                noticeTextColor: "#FFFFFF",
            },
        } as unknown as JsonAsset;

        // Create instance of CascadingBottomMessage
        cascadingBottomMessage = new CascadingBottomMessage();
        cascadingBottomMessage.msgRichText = mockMsgRichText;

        // Initialize highlightColor
        cascadingBottomMessage["highlightColor"] = "#FFD700";
    });

    describe("onLoad", () => {
        it("should initialize color configuration", () => {
            // Call the actual onLoad logic
            cascadingBottomMessage["highlightColor"] = cascadingBottomMessage["colorConfig"].noticeHighlightTextColor;

            expect(cascadingBottomMessage["colorConfig"]).toBe(mockColorInfo.json);
            expect(cascadingBottomMessage["highlightColor"]).toBe("#FFD700");
        });
    });

    describe("updateMessageContent", () => {
        it("should update rich text with uppercase message", () => {
            const message = "test message";

            cascadingBottomMessage.updateMessageContent(message);

            expect(mockMsgRichText.string).toBe("TEST MESSAGE");
        });
    });

    describe("showFreeSpinCount", () => {
        it("should show free spin count with highlighted amount", () => {
            const amount = 5;

            cascadingBottomMessage["showFreeSpinCount"](amount);

            expect(mockMsgRichText.string).toBe("FREE SPINS LEFT: <color=#FFD700>5</color>");
        });
    });

    describe("showAutoSpinCount", () => {
        it("should show auto spin count", () => {
            const autoSpinCount = 3;

            cascadingBottomMessage["showAutoSpinCount"](autoSpinCount);

            expect(mockMsgRichText.string).toBe("AUTO SPINS LEFT 3");
        });
    });

    describe("renderBottomMessage", () => {
        it("should update state and call updateMessage", () => {
            const bottomMessageState = SlotNotification.BEFORE_SPIN;
            cascadingBottomMessage.updateMessage = jest.fn();

            cascadingBottomMessage.renderBottomMessage(bottomMessageState);

            expect(cascadingBottomMessage["state"]).toBe(bottomMessageState);
            expect(cascadingBottomMessage.updateMessage).toHaveBeenCalled();
        });
    });

    describe("updateMessage", () => {
        beforeEach(() => {
            cascadingBottomMessage.updateMessageContent = jest.fn();
            cascadingBottomMessage["showAutoSpinCount"] = jest.fn();
            cascadingBottomMessage["showFreeSpinCount"] = jest.fn();
            cascadingBottomMessage.handleMessageBeforeSpin = jest.fn();
            cascadingBottomMessage.handleMessageSettled = jest.fn();
        });

        it("should handle BEFORE_SPIN state", () => {
            cascadingBottomMessage["state"] = SlotNotification.BEFORE_SPIN;

            cascadingBottomMessage.updateMessage();

            expect(cascadingBottomMessage.handleMessageBeforeSpin).toHaveBeenCalled();
        });

        it("should handle BEFORE_SPIN_TRIAL state", () => {
            cascadingBottomMessage["state"] = SlotNotification.BEFORE_SPIN_TRIAL;

            cascadingBottomMessage.updateMessage();

            expect(cascadingBottomMessage.handleMessageSettled).toHaveBeenCalled();
        });

        it("should handle SPINNING state", () => {
            cascadingBottomMessage["state"] = SlotNotification.SPINNING;

            cascadingBottomMessage.updateMessage();

            expect(cascadingBottomMessage.updateMessageContent).toHaveBeenCalledWith("Round settling...");
        });

        it("should handle SETTLED state", () => {
            cascadingBottomMessage["state"] = SlotNotification.SETTLED;

            cascadingBottomMessage.updateMessage();

            expect(cascadingBottomMessage.handleMessageSettled).toHaveBeenCalled();
        });

        it("should handle TUMBLE_WIN state", () => {
            cascadingBottomMessage["state"] = SlotNotification.TUMBLE_WIN;

            cascadingBottomMessage.updateMessage();

            expect(cascadingBottomMessage.updateMessageContent).toHaveBeenCalledWith("Win tumbling!");
        });

        it("should handle AUTO_SPIN state", () => {
            cascadingBottomMessage["state"] = SlotNotification.AUTO_SPIN;
            cascadingBottomMessage["roundsAutoplay"] = 5;

            cascadingBottomMessage.updateMessage();

            expect(cascadingBottomMessage["showAutoSpinCount"]).toHaveBeenCalledWith(5);
        });

        it("should handle FREESPINS state", () => {
            cascadingBottomMessage["state"] = SlotNotification.FREESPINS;
            cascadingBottomMessage["freespinCountMsgBottom"] = 3;

            cascadingBottomMessage.updateMessage();

            expect(cascadingBottomMessage["showFreeSpinCount"]).toHaveBeenCalledWith(3);
        });

        it("should handle unknown state", () => {
            cascadingBottomMessage["state"] = "UNKNOWN_STATE";

            cascadingBottomMessage.updateMessage();

            expect(cascadingBottomMessage.updateMessageContent).not.toHaveBeenCalled();
            expect(cascadingBottomMessage.handleMessageBeforeSpin).not.toHaveBeenCalled();
            expect(cascadingBottomMessage.handleMessageSettled).not.toHaveBeenCalled();
        });
    });

    describe("renderTurboMode", () => {
        it("should update turbo mode state", () => {
            const turboMode = true;

            cascadingBottomMessage.renderTurboMode(turboMode);

            expect(cascadingBottomMessage["isTurboMode"]).toBe(true);
        });
    });

    describe("handleMessageBeforeSpin", () => {
        it("should show mobile message when on mobile device", () => {
            const { sys } = require("cc");
            sys.isMobile = true;
            cascadingBottomMessage.updateMessageContent = jest.fn();

            cascadingBottomMessage.handleMessageBeforeSpin();

            expect(cascadingBottomMessage.updateMessageContent).toHaveBeenCalledWith("Tap to spin on phone");
        });

        it("should show desktop message when on desktop device", () => {
            const { sys } = require("cc");
            sys.isMobile = false;
            cascadingBottomMessage.updateMessageContent = jest.fn();

            cascadingBottomMessage.handleMessageBeforeSpin();

            expect(cascadingBottomMessage.updateMessageContent).toHaveBeenCalledWith("Click to spin on desktop");
        });
    });

    describe("handleMessageSettled", () => {
        it("should show random message with index 1-3 when not in turbo or trial mode", () => {
            const { random } = require("lodash-es");
            random.mockReturnValue(2);
            cascadingBottomMessage.updateMessageContent = jest.fn();
            cascadingBottomMessage["isTurboMode"] = false;
            cascadingBottomMessage["isTrialMode"] = false;

            cascadingBottomMessage.handleMessageSettled();

            expect(random).toHaveBeenCalledWith(1, 3);
            expect(cascadingBottomMessage.updateMessageContent).toHaveBeenCalledWith("Ready to spin message 2");
        });

        it("should show random message with index 1-2 when in turbo mode", () => {
            const { random } = require("lodash-es");
            random.mockReturnValue(1);
            cascadingBottomMessage.updateMessageContent = jest.fn();
            cascadingBottomMessage["isTurboMode"] = true;
            cascadingBottomMessage["isTrialMode"] = false;

            cascadingBottomMessage.handleMessageSettled();

            expect(random).toHaveBeenCalledWith(1, 2);
            expect(cascadingBottomMessage.updateMessageContent).toHaveBeenCalledWith("Ready to spin message 1");
        });

        it("should show random message with index 1-2 when in trial mode", () => {
            const { random } = require("lodash-es");
            random.mockReturnValue(2);
            cascadingBottomMessage.updateMessageContent = jest.fn();
            cascadingBottomMessage["isTurboMode"] = false;
            cascadingBottomMessage["isTrialMode"] = true;

            cascadingBottomMessage.handleMessageSettled();

            expect(random).toHaveBeenCalledWith(1, 2);
            expect(cascadingBottomMessage.updateMessageContent).toHaveBeenCalledWith("Ready to spin message 2");
        });
    });

    describe("randomMsgIndex", () => {
        it("should return random number 1-3 when not in turbo or trial mode", () => {
            const { random } = require("lodash-es");
            random.mockReturnValue(2);
            cascadingBottomMessage["isTurboMode"] = false;
            cascadingBottomMessage["isTrialMode"] = false;

            const result = cascadingBottomMessage["randomMsgIndex"]();

            expect(random).toHaveBeenCalledWith(1, 3);
            expect(result).toBe(2);
        });

        it("should return random number 1-2 when in turbo mode", () => {
            const { random } = require("lodash-es");
            random.mockReturnValue(1);
            cascadingBottomMessage["isTurboMode"] = true;
            cascadingBottomMessage["isTrialMode"] = false;

            const result = cascadingBottomMessage["randomMsgIndex"]();

            expect(random).toHaveBeenCalledWith(1, 2);
            expect(result).toBe(1);
        });

        it("should return random number 1-2 when in trial mode", () => {
            const { random } = require("lodash-es");
            random.mockReturnValue(2);
            cascadingBottomMessage["isTurboMode"] = false;
            cascadingBottomMessage["isTrialMode"] = true;

            const result = cascadingBottomMessage["randomMsgIndex"]();

            expect(random).toHaveBeenCalledWith(1, 2);
            expect(result).toBe(2);
        });
    });

    describe("setFreeSpinsCount", () => {
        it("should update freespin count and call updateMessage", () => {
            const freespinCountMsgBottom = 5;
            cascadingBottomMessage.updateMessage = jest.fn();

            cascadingBottomMessage.setFreeSpinsCount(freespinCountMsgBottom);

            expect(cascadingBottomMessage["freespinCountMsgBottom"]).toBe(5);
            expect(cascadingBottomMessage.updateMessage).toHaveBeenCalled();
        });
    });

    describe("setRoundsAutoplayMsg", () => {
        it("should update rounds autoplay and call updateMessage", () => {
            const roundsAutoplay = 10;
            cascadingBottomMessage.updateMessage = jest.fn();

            cascadingBottomMessage.setRoundsAutoplayMsg(roundsAutoplay);

            expect(cascadingBottomMessage["roundsAutoplay"]).toBe(10);
            expect(cascadingBottomMessage.updateMessage).toHaveBeenCalled();
        });
    });

    describe("setTrialMode", () => {
        it("should update trial mode state", () => {
            const isTrialMode = true;

            cascadingBottomMessage.setTrialMode(isTrialMode);

            expect(cascadingBottomMessage["isTrialMode"]).toBe(true);
        });
    });
});
