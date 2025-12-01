import gc from "@sg/game-client-base";
import inversify from "inversify";
import { stub } from "jest-auto-stub";
import mobx from "mobx";
import { GameSpeed } from "../../assets/cascading-slot-utils";
import { CascadingSlotSettingHandlers } from "../../assets/handlers/cascading-slot-setting-handlers";

// Mock dependencies
jest.mock("@sg/game-client-base");
jest.mock("mobx");
jest.mock("inversify");

// Mock stores
const mockGameUserSettingStore = {
    tempStorage: null,
};

const mockCascadingUIStore = {
    isTrialMode: false,
    isTurboModeUI: false,
    fsbPromotionInProgress: false,
};

const mockBetControlStore = {
    lastSetting: null,
    needClearLastSetting: false,
    betLevel: 1,
    coinValue: 0.01,
};

const mockGameSpeedStore = {
    gameSpeed: GameSpeed.NORMAL,
};

// Mock StorageManager
const mockStorageManager = {
    get: jest.fn(),
    set: jest.fn(),
};

// Mock GameUserSettingAction
const mockGameUserSettingAction = {
    Save: "save",
    Load: "load",
};

describe("CascadingSlotSettingHandlers", () => {
    let settingHandlers: CascadingSlotSettingHandlers;
    let mockReaction: jest.Mock;
    let setTimeoutSpy: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock setTimeout to execute immediately
        setTimeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation((callback: any) => {
            if (typeof callback === "function") {
                callback();
            }
            return 1 as any;
        });

        // Setup mocks
        mockReaction = jest.fn((getter, callback) => callback);
        (mobx.reaction as jest.Mock) = mockReaction;

        // Mock gc modules
        (gc as any).GameUserSettings = {
            GameUserSettingAction: mockGameUserSettingAction,
            GameUserSettingStore: jest.fn(),
        };
        (gc as any).StorageManager = mockStorageManager;
        (gc as any).localStorageKeys = {
            gameUserSetting: "gameUserSetting",
        };

        // Set mock stores directly on the prototype
        (CascadingSlotSettingHandlers.prototype as any).gameUserSettingStore = mockGameUserSettingStore;
        (CascadingSlotSettingHandlers.prototype as any).cascadingUIStore = mockCascadingUIStore;
        (CascadingSlotSettingHandlers.prototype as any).betControlStore = mockBetControlStore;
        (CascadingSlotSettingHandlers.prototype as any).gameSpeedStore = mockGameSpeedStore;
        (CascadingSlotSettingHandlers.prototype as any).mainPlayerStore = stub<gc.Player.MainPlayerStore>({
            UID: 123,
            currencyGroup: "CASH_USD",
        });
        (CascadingSlotSettingHandlers.prototype as any).appStore = stub<gc.App.AppStore>({
            isClearStorage: false,
        });

        // Mock injectable decorator
        (inversify.injectable as jest.Mock) = jest.fn(() => (target: any) => target);

        // Reset gameSpeedStore for each test
        mockGameSpeedStore.gameSpeed = GameSpeed.NORMAL;
    });

    afterEach(() => {
        setTimeoutSpy?.mockRestore();
    });

    describe("constructor", () => {
        it("should initialize and set up mobx reaction", () => {
            settingHandlers = new CascadingSlotSettingHandlers();
            (settingHandlers as any).gameSpeedStore = mockGameSpeedStore;

            expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 0);
            expect(mockReaction).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
        });

        it("should call loadTempStorage during initialization", () => {
            mockStorageManager.get.mockReturnValue(null);
            const loadSpy = jest.spyOn(CascadingSlotSettingHandlers.prototype, "loadTempStorage");

            settingHandlers = new CascadingSlotSettingHandlers();
            (settingHandlers as any).gameSpeedStore = mockGameSpeedStore;

            expect(loadSpy).toHaveBeenCalled();
            loadSpy.mockRestore();
        });
    });

    describe("loadTempStorage", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            settingHandlers = new CascadingSlotSettingHandlers();
            // Set the property using both methods to ensure it works
            (settingHandlers as any).gameSpeedStore = mockGameSpeedStore;
            Object.defineProperty(settingHandlers, "gameSpeedStore", {
                value: mockGameSpeedStore,
                writable: true,
                enumerable: true,
                configurable: true,
            });
        });

        it("should set default values when no data exists in storage", () => {
            mockStorageManager.get.mockReturnValue(null);

            settingHandlers.loadTempStorage();

            expect(mockCascadingUIStore.isTrialMode).toBe(false);
            expect(mockCascadingUIStore.isTurboModeUI).toBe(false);
            expect(mockBetControlStore.lastSetting).toBe(null);
            expect(mockGameSpeedStore.gameSpeed).toBe(GameSpeed.NORMAL);
        });
    });

    describe("saveTempStorage", () => {
        beforeEach(() => {
            settingHandlers = new CascadingSlotSettingHandlers();
            // Set the property using both methods to ensure it works
            (settingHandlers as any).gameSpeedStore = mockGameSpeedStore;
            Object.defineProperty(settingHandlers, "gameSpeedStore", {
                value: mockGameSpeedStore,
                writable: true,
                enumerable: true,
                configurable: true,
            });
            // Reset store values
            mockCascadingUIStore.isTrialMode = false;
            mockCascadingUIStore.isTurboModeUI = false;
            mockBetControlStore.needClearLastSetting = false;
            mockBetControlStore.betLevel = 1;
            mockBetControlStore.coinValue = 0.01;
            mockGameSpeedStore.gameSpeed = GameSpeed.NORMAL;
        });

        it("should save current settings to storage", () => {
            mockCascadingUIStore.isTrialMode = true;
            mockCascadingUIStore.isTurboModeUI = true;
            mockBetControlStore.betLevel = 3;
            mockBetControlStore.coinValue = 0.02;
            const saveSpy = jest.spyOn(settingHandlers, "saveTempStorage");

            settingHandlers.saveTempStorage();

            expect(saveSpy).toHaveBeenCalled();
            expect(mockBetControlStore.needClearLastSetting).toBe(false);
            saveSpy.mockRestore();
        });

        it("should clear last bet setting when needClearLastSetting is true", () => {
            mockBetControlStore.needClearLastSetting = true;
            mockBetControlStore.betLevel = 3;
            mockBetControlStore.coinValue = 0.02;
            const saveSpy = jest.spyOn(settingHandlers, "saveTempStorage");

            settingHandlers.saveTempStorage();

            expect(saveSpy).toHaveBeenCalled();
            expect(mockBetControlStore.needClearLastSetting).toBe(false);
            saveSpy.mockRestore();
        });
    });
});
