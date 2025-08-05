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
        } as unknown as sp.Skeleton;

        // Mock AnimationUtils.playSpine to return a resolved promise
        (AnimationUtils.playSpine as jest.Mock).mockResolvedValue(undefined);
    };

    const createComponentInstance = () => {
        cascadingMascot = new CascadingMascot();
        cascadingMascot.spineMascot = mockSpineMascot;
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
                // Act
                await cascadingMascot.playAnimFreespin();

                // Assert
                expect(AnimationUtils.playSpine).toHaveBeenCalledWith(mockSpineMascot, "freespin_anim", false);
                expect(AnimationUtils.playSpine).toHaveBeenCalledWith(mockSpineMascot, "idle", true);
            });
        });

        describe("playAnimBigwin", () => {
            it("should play bigwin animation and return to idle", async () => {
                // Act
                await cascadingMascot.playAnimBigwin();

                // Assert
                expect(AnimationUtils.playSpine).toHaveBeenCalledWith(mockSpineMascot, "bigwin_anim", false);
                expect(AnimationUtils.playSpine).toHaveBeenCalledWith(mockSpineMascot, "idle", true);
            });
        });

        describe("playAnimMultiplier", () => {
            it("should play multiplier animation and return to idle", async () => {
                // Act
                await cascadingMascot.playAnimMultiplier();

                // Assert
                expect(AnimationUtils.playSpine).toHaveBeenCalledWith(mockSpineMascot, "multiplier_anim", false);
                expect(AnimationUtils.playSpine).toHaveBeenCalledWith(mockSpineMascot, "idle", true);
            });
        });
    });

    describe("Observer Pattern Methods", () => {
        describe("showAnimFreeSpin", () => {
            it("should play freespin animation when isShowFreeSpinEffect is true and mascot is enabled", async () => {
                // Arrange
                const isShowFreeSpinEffect = true;
                cascadingMascot["gameConfig"] = resourcesCache.gameFeatures;

                // Act
                await cascadingMascot.showAnimFreeSpin(isShowFreeSpinEffect);

                // Assert
                expect(AnimationUtils.playSpine).toHaveBeenCalledWith(
                    mockSpineMascot,
                    resourcesCache.gameFeatures.freespinMascotAnimationName,
                    false
                );
                expect(AnimationUtils.playSpine).toHaveBeenCalledWith(mockSpineMascot, "idle", true);
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

                // Act
                await cascadingMascot.showAnimFreeSpin(isShowFreeSpinEffect);

                // Assert
                expect(AnimationUtils.playSpine).not.toHaveBeenCalledWith(
                    mockSpineMascot,
                    resourcesCache.gameFeatures.freespinMascotAnimationName,
                    false
                );
            });

            it("should not play animation when mascot is disabled", async () => {
                // Arrange
                const isShowFreeSpinEffect = true;
                cascadingMascot["gameConfig"] = resourcesCache.gameFeatures;
                resourcesCache.gameFeatures.turnOnEventMascot = false;

                // Act
                await cascadingMascot.showAnimFreeSpin(isShowFreeSpinEffect);

                // Assert
                expect(AnimationUtils.playSpine).not.toHaveBeenCalledWith(
                    mockSpineMascot,
                    resourcesCache.gameFeatures.freespinMascotAnimationName,
                    false
                );
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

                // Act
                await cascadingMascot.showAnimBigWin(haveBigWin);

                // Assert
                expect(AnimationUtils.playSpine).toHaveBeenCalledWith(
                    mockSpineMascot,
                    resourcesCache.gameFeatures.bigWinMascotAnimationName,
                    false
                );
                expect(AnimationUtils.playSpine).toHaveBeenCalledWith(mockSpineMascot, "idle", true);
            });

            it("should not play animation when haveBigWin is false", async () => {
                // Arrange
                const haveBigWin = false;
                cascadingMascot["gameConfig"] = resourcesCache.gameFeatures;

                // Act
                await cascadingMascot.showAnimBigWin(haveBigWin);

                // Assert
                expect(AnimationUtils.playSpine).not.toHaveBeenCalledWith(
                    mockSpineMascot,
                    resourcesCache.gameFeatures.bigWinMascotAnimationName,
                    false
                );
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

                // Act
                await cascadingMascot.showAnimBigWin(haveBigWin);

                // Assert
                expect(AnimationUtils.playSpine).not.toHaveBeenCalledWith(
                    mockSpineMascot,
                    resourcesCache.gameFeatures.bigWinMascotAnimationName,
                    false
                );
            });
        });

        describe("showAnimMultiplier", () => {
            it("should play multiplier animation when triggerWinMultiplier is true and mascot is enabled", () => {
                // Arrange
                const triggerWinMultiplier = true;
                cascadingMascot["gameConfig"] = resourcesCache.gameFeatures;
                resourcesCache.gameFeatures.turnOnEventMascot = true;

                // Act
                cascadingMascot.showAnimMultiplier(triggerWinMultiplier);

                // Assert
                expect(AnimationUtils.playSpine).toHaveBeenCalledWith(
                    mockSpineMascot,
                    resourcesCache.gameFeatures.multiplierMascotAnimationName,
                    false
                );
                expect(AnimationUtils.playSpine).toHaveBeenCalledWith(mockSpineMascot, "idle", true);
            });

            it("should not play animation when triggerWinMultiplier is false", () => {
                // Arrange
                const triggerWinMultiplier = false;
                cascadingMascot["gameConfig"] = resourcesCache.gameFeatures;

                // Act
                cascadingMascot.showAnimMultiplier(triggerWinMultiplier);

                // Assert
                expect(AnimationUtils.playSpine).not.toHaveBeenCalledWith(
                    mockSpineMascot,
                    resourcesCache.gameFeatures.multiplierMascotAnimationName,
                    false
                );
            });

            it("should not play animation when mascot is disabled", () => {
                // Arrange
                const triggerWinMultiplier = true;
                cascadingMascot["gameConfig"] = resourcesCache.gameFeatures;
                resourcesCache.gameFeatures.turnOnEventMascot = false;

                // Act
                cascadingMascot.showAnimMultiplier(triggerWinMultiplier);

                // Assert
                expect(AnimationUtils.playSpine).not.toHaveBeenCalledWith(
                    mockSpineMascot,
                    resourcesCache.gameFeatures.multiplierMascotAnimationName,
                    false
                );
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

    describe("Error Handling", () => {
        it("should handle AnimationUtils.playSpine rejection gracefully", async () => {
            // Arrange
            const error = new Error("Animation failed");
            (AnimationUtils.playSpine as jest.Mock).mockRejectedValue(error);

            // Ensure gameConfig is properly set up
            cascadingMascot["gameConfig"] = resourcesCache.gameFeatures;

            // Act & Assert
            await expect(cascadingMascot.playAnimFreespin()).rejects.toThrow("Animation failed");
        });
    });
});
