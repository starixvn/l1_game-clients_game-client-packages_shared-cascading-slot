import { sp } from "cc";
import { AnimationUtils } from "db://shared-components/shared/utils";

// Mock Observer
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

// Mock AnimationUtils
jest.mock("db://shared-components/shared/utils", () => ({
    AnimationUtils: {
        playSpine: jest.fn(),
    },
}));

// Mock ObserverComponent
jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => ({
    ObserverComponent: class {
        onLoad() {}
    },
}));

// Mock CascadingUIStore
jest.mock("../../assets/stores/cascading-ui-store", () => ({
    CascadingUIStore: jest.fn(),
}));

jest.mock("../../assets/cascading-slot-utils", () => ({
    resourcesCache: {
        gameFeatures: {
            turnOnEventMascot: true,
            turnOnMultiplierMascot: true,
            freespinMascotAnimationName: "freespin_anim",
            bigWinMascotAnimationName: "bigwin_anim",
            multiplierMascotAnimationName: "multiplier_anim",
        },
        colorJson: {
            bottomAreaTextColor: "#FFFFFF",
            bottomAreaNumberColor: "#FFD700",
            bottomAreaButtonBorderColor: "#FF0000",
            bottomAreaWinAmountColor: "#00FF00",
        },
    },
}));

// Import after mocks are set up
import { resourcesCache } from "../../assets/cascading-slot-utils";
import { CascadingMascot } from "../../assets/components/cascading-mascot";

describe("CascadingMascot", () => {
    let cascadingMascot: CascadingMascot;
    let mockSpineMascot: sp.Skeleton;

    beforeEach(() => {
        setupMocks();
        createComponentInstance();
    });

    const setupMocks = () => {
        jest.clearAllMocks();

        // Create mock spine mascot
        mockSpineMascot = {
            setMix: jest.fn(),
            findAnimation: jest.fn().mockReturnValue({ duration: 1 }),
            setAnimation: jest.fn(),
            clearTracks: jest.fn(),
        } as unknown as sp.Skeleton;

        // Mock AnimationUtils.playSpine to return a resolved promise
        (AnimationUtils.playSpine as jest.Mock).mockResolvedValue(undefined);
    };

    const createComponentInstance = () => {
        cascadingMascot = new CascadingMascot();
        cascadingMascot.spineMascot = mockSpineMascot;
        cascadingMascot.node = { getComponent: jest.fn().mockReturnValue({ opacity: 255 }) } as any;
        // Initialize gameConfig by calling onLoad
        cascadingMascot.onLoad();
    };

    describe("Lifecycle Methods", () => {
        describe("onLoad", () => {
            it("should initialize component and set mix durations", () => {
                // Act
                cascadingMascot.onLoad();

                // Assert
                expect(AnimationUtils.playSpine).toHaveBeenCalledWith(mockSpineMascot, "idle", true);
                expect((mockSpineMascot as any).setMix).toHaveBeenCalledWith("idle", "freespin_anim", 0.3);
                expect((mockSpineMascot as any).setMix).toHaveBeenCalledWith("idle", "bigwin_anim", 0.3);
                expect((mockSpineMascot as any).setMix).toHaveBeenCalledWith("idle", "multiplier_anim", 0.3);
            });
        });
    });

    describe("Animation Methods", () => {
        describe("playAnimFreespin", () => {
            it("should play freespin animation and return to idle", async () => {
                // Arrange
                cascadingMascot["handleAnimTransition"] = jest.fn().mockResolvedValue(undefined);

                // Act
                await cascadingMascot.playAnimFreespin();

                // Assert
                expect(cascadingMascot["handleAnimTransition"]).toHaveBeenCalledWith("freespin_anim");
            });
        });

        describe("playAnimBigwin", () => {
            it("should play bigwin animation and return to idle", async () => {
                // Arrange
                cascadingMascot["handleAnimTransition"] = jest.fn().mockResolvedValue(undefined);

                // Act
                await cascadingMascot.playAnimBigwin();

                // Assert
                expect(cascadingMascot["handleAnimTransition"]).toHaveBeenCalledWith("bigwin_anim");
            });
        });

        describe("playAnimMultiplier", () => {
            it("should play multiplier animation and return to idle", async () => {
                // Arrange
                cascadingMascot["handleAnimTransition"] = jest.fn().mockResolvedValue(undefined);

                // Act
                await cascadingMascot.playAnimMultiplier();

                // Assert
                expect(cascadingMascot["handleAnimTransition"]).toHaveBeenCalledWith("multiplier_anim");
            });
        });
    });

    describe("Observer Pattern Methods", () => {
        describe("showAnimFreeSpin", () => {
            it("should play freespin animation when isShowFreeSpinEffect is true and mascot is enabled", async () => {
                // Arrange
                const isShowFreeSpinEffect = true;
                cascadingMascot["gameConfig"] = resourcesCache.gameFeatures;
                cascadingMascot["handleAnimTransition"] = jest.fn().mockResolvedValue(undefined);

                // Act
                await cascadingMascot.showAnimFreeSpin(isShowFreeSpinEffect);

                // Assert
                expect(cascadingMascot["handleAnimTransition"]).toHaveBeenCalledWith("freespin_anim");
            });

            it("should not play animation when isShowFreeSpinEffect is false", async () => {
                // Arrange
                const isShowFreeSpinEffect = false;
                cascadingMascot["gameConfig"] = {
                    turnOnEventMascot: true,
                    freespinMascotAnimationName: resourcesCache.gameFeatures.freespinMascotAnimationName,
                    bigWinMascotAnimationName: resourcesCache.gameFeatures.bigWinMascotAnimationName,
                    multiplierMascotAnimationName: resourcesCache.gameFeatures.multiplierMascotAnimationName,
                };
                cascadingMascot["handleAnimTransition"] = jest.fn().mockResolvedValue(undefined);

                // Act
                await cascadingMascot.showAnimFreeSpin(isShowFreeSpinEffect);

                // Assert
                expect(cascadingMascot["handleAnimTransition"]).not.toHaveBeenCalledWith("freespin_anim");
            });

            it("should not play animation when mascot is disabled", async () => {
                // Arrange
                const isShowFreeSpinEffect = true;
                cascadingMascot["gameConfig"] = resourcesCache.gameFeatures;
                resourcesCache.gameFeatures.turnOnEventMascot = false;
                cascadingMascot["handleAnimTransition"] = jest.fn().mockResolvedValue(undefined);

                // Act
                await cascadingMascot.showAnimFreeSpin(isShowFreeSpinEffect);

                // Assert
                expect(cascadingMascot["handleAnimTransition"]).not.toHaveBeenCalledWith("freespin_anim");
            });
        });

        describe("showAnimBigWin", () => {
            it("should play bigwin animation when haveBigWin is true and mascot is enabled", async () => {
                // Arrange
                const haveBigWin = true;
                cascadingMascot["gameConfig"] = {
                    turnOnEventMascot: true,
                    freespinMascotAnimationName: resourcesCache.gameFeatures.freespinMascotAnimationName,
                    bigWinMascotAnimationName: resourcesCache.gameFeatures.bigWinMascotAnimationName,
                    multiplierMascotAnimationName: resourcesCache.gameFeatures.multiplierMascotAnimationName,
                };
                cascadingMascot["handleAnimTransition"] = jest.fn().mockResolvedValue(undefined);

                // Act
                await cascadingMascot.showAnimBigWin(haveBigWin);

                // Assert
                expect(cascadingMascot["handleAnimTransition"]).toHaveBeenCalledWith("bigwin_anim");
            });

            it("should not play animation when haveBigWin is false", async () => {
                // Arrange
                const haveBigWin = false;
                cascadingMascot["gameConfig"] = resourcesCache.gameFeatures;
                cascadingMascot["handleAnimTransition"] = jest.fn().mockResolvedValue(undefined);

                // Act
                await cascadingMascot.showAnimBigWin(haveBigWin);

                // Assert
                expect(cascadingMascot["handleAnimTransition"]).not.toHaveBeenCalledWith("bigwin_anim");
            });

            it("should not play animation when mascot is disabled", async () => {
                // Arrange
                const haveBigWin = true;
                cascadingMascot["gameConfig"] = {
                    turnOnEventMascot: false,
                    freespinMascotAnimationName: resourcesCache.gameFeatures.freespinMascotAnimationName,
                    bigWinMascotAnimationName: resourcesCache.gameFeatures.bigWinMascotAnimationName,
                    multiplierMascotAnimationName: resourcesCache.gameFeatures.multiplierMascotAnimationName,
                };
                cascadingMascot["handleAnimTransition"] = jest.fn().mockResolvedValue(undefined);

                // Act
                await cascadingMascot.showAnimBigWin(haveBigWin);

                // Assert
                expect(cascadingMascot["handleAnimTransition"]).not.toHaveBeenCalledWith("bigwin_anim");
            });
        });

        describe("showAnimMultiplier", () => {
            it("should play multiplier animation when triggerWinMultiplier is true and mascot is enabled", () => {
                // Arrange
                const triggerWinMultiplier = true;
                cascadingMascot["gameConfig"] = {
                    ...resourcesCache.gameFeatures,
                    turnOnMultiplierMascot: true,
                };
                cascadingMascot["handleAnimTransition"] = jest.fn().mockResolvedValue(undefined);

                // Act
                cascadingMascot.showAnimMultiplier(triggerWinMultiplier);

                // Assert
                expect(cascadingMascot["handleAnimTransition"]).toHaveBeenCalledWith("multiplier_anim");
            });

            it("should not play animation when triggerWinMultiplier is false", () => {
                // Arrange
                const triggerWinMultiplier = false;
                cascadingMascot["gameConfig"] = resourcesCache.gameFeatures;
                cascadingMascot["handleAnimTransition"] = jest.fn().mockResolvedValue(undefined);

                // Act
                cascadingMascot.showAnimMultiplier(triggerWinMultiplier);

                // Assert
                expect(cascadingMascot["handleAnimTransition"]).not.toHaveBeenCalledWith("multiplier_anim");
            });
        });
    });

    describe("Private Methods", () => {
        describe("settingMixDuration", () => {
            it("should set mix durations for all animations", () => {
                // Act
                cascadingMascot["settingMixDuration"]();

                // Assert
                expect((mockSpineMascot as any).setMix).toHaveBeenCalledWith("idle", "freespin_anim", 0.3);
                expect((mockSpineMascot as any).setMix).toHaveBeenCalledWith("idle", "bigwin_anim", 0.3);
                expect((mockSpineMascot as any).setMix).toHaveBeenCalledWith("idle", "multiplier_anim", 0.3);
            });
        });
    });

    describe("Configuration", () => {
        it("should load game configuration from gameInfo", () => {
            // Act
            cascadingMascot.onLoad();

            // Assert
            expect(cascadingMascot["gameConfig"]).toBe(resourcesCache.gameFeatures);
        });
    });
});
