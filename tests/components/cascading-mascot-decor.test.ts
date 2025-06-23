import { Component, instantiate, Node, Prefab } from "cc";
import { bundleManager } from "db://shared-components/shared/common-components/bundle-manager/bundle-manager";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";

// Mock Observer
jest.mock("observer", () => ({
    render: jest.fn((store, selector, options) => {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            return descriptor;
        };
    }),
}));

// Mock bundleManager
jest.mock("db://shared-components/shared/common-components/bundle-manager/bundle-manager", () => ({
    bundleManager: {
        loadAssetsFromBundle: jest.fn(),
    },
}));

// Mock AnimationUtils
jest.mock("db://shared-components/shared/utils", () => ({
    AnimationUtils: {
        fadeOutAndDeactivate: jest.fn(),
        fadeIn: jest.fn(),
    },
}));

// Import after mocks are set up
import { CascadingMascotDecor } from "../../assets/components/cascading-mascot-decor";

describe("CascadingMascotDecor", () => {
    let cascadingMascotDecor: CascadingMascotDecor;
    let mockNodeMascotBlur: Node;
    let mockPrefab: Prefab;
    let mockNodeMascot: Node;

    beforeEach(() => {
        setupMocks();
        createComponentInstance();
    });

    const setupMocks = () => {
        jest.clearAllMocks();

        // Create mock node mascot blur
        mockNodeMascotBlur = {
            active: false,
        } as unknown as Node;

        // Create mock prefab
        mockPrefab = {} as unknown as Prefab;

        // Create mock node mascot
        mockNodeMascot = {
            active: false,
        } as unknown as Node;

        // Mock instantiate to return mock node
        (instantiate as jest.Mock) = jest.fn().mockReturnValue(mockNodeMascot);

        // Mock bundleManager.loadAssetsFromBundle to return mock prefab
        (bundleManager.loadAssetsFromBundle as jest.Mock).mockResolvedValue(mockPrefab);

        // Mock AnimationUtils methods
        (AnimationUtils.fadeOutAndDeactivate as jest.Mock).mockResolvedValue(undefined);
        (AnimationUtils.fadeIn as jest.Mock).mockResolvedValue(undefined);
    };

    const createComponentInstance = () => {
        cascadingMascotDecor = new CascadingMascotDecor();
        cascadingMascotDecor.nodeMascotBlur = mockNodeMascotBlur;
        cascadingMascotDecor.node = mockNodeMascot; // Mock parent node
    };

    describe("Lifecycle Methods", () => {
        describe("onLoad", () => {
            it("should activate mascot blur node and create mascot node successfully", async () => {
                // Act
                await cascadingMascotDecor.onLoad();

                // Assert
                expect(mockNodeMascotBlur.active).toBe(true);
                expect(bundleManager.loadAssetsFromBundle).toHaveBeenCalledWith(
                    "resources",
                    "prefabs/mascot",
                    Prefab,
                    null
                );
                expect(instantiate).toHaveBeenCalledWith(mockPrefab);
                expect(mockNodeMascot.active).toBe(false);
                expect(AnimationUtils.fadeOutAndDeactivate).toHaveBeenCalledWith(
                    mockNodeMascotBlur,
                    0.5
                );
                expect(AnimationUtils.fadeIn).toHaveBeenCalledWith(mockNodeMascot, 0.5);
            });

            it("should handle bundle loading error gracefully", async () => {
                // Arrange
                const consoleSpy = jest.spyOn(console, "log").mockImplementation();
                const error = new Error("Bundle loading failed");
                (bundleManager.loadAssetsFromBundle as jest.Mock).mockRejectedValue(error);

                // Act
                await cascadingMascotDecor.onLoad();

                // Assert
                expect(console.log).toHaveBeenCalledWith(error);
                expect(mockNodeMascotBlur.active).toBe(true);
                expect(instantiate).not.toHaveBeenCalled();

                // Cleanup
                consoleSpy.mockRestore();
            });
        });
    });

    describe("Private Methods", () => {
        describe("createNodeAsync", () => {
            it("should create mascot node when prefab is not loaded", async () => {
                // Arrange
                cascadingMascotDecor["prfMascot"] = null;

                // Act
                await cascadingMascotDecor["createNodeAsync"]();

                // Assert
                expect(bundleManager.loadAssetsFromBundle).toHaveBeenCalledWith(
                    "resources",
                    "prefabs/mascot",
                    Prefab,
                    null
                );
                expect(instantiate).toHaveBeenCalledWith(mockPrefab);
                expect(mockNodeMascot.active).toBe(false);
                expect(AnimationUtils.fadeOutAndDeactivate).toHaveBeenCalledWith(
                    mockNodeMascotBlur,
                    0.5
                );
                expect(AnimationUtils.fadeIn).toHaveBeenCalledWith(mockNodeMascot, 0.5);
            });

            it("should not create mascot node when prefab is already loaded", async () => {
                // Arrange
                cascadingMascotDecor["prfMascot"] = mockPrefab;

                // Act
                await cascadingMascotDecor["createNodeAsync"]();

                // Assert
                expect(bundleManager.loadAssetsFromBundle).not.toHaveBeenCalled();
                expect(instantiate).not.toHaveBeenCalled();
                expect(AnimationUtils.fadeOutAndDeactivate).not.toHaveBeenCalled();
                expect(AnimationUtils.fadeIn).not.toHaveBeenCalled();
            });

            it("should handle instantiate error gracefully", async () => {
                // Arrange
                const consoleSpy = jest.spyOn(console, "log").mockImplementation();
                const error = new Error("Instantiate failed");
                (instantiate as jest.Mock).mockImplementation(() => {
                    throw error;
                });

                // Act
                await cascadingMascotDecor["createNodeAsync"]();

                // Assert
                expect(console.log).toHaveBeenCalledWith(error);
                expect(bundleManager.loadAssetsFromBundle).toHaveBeenCalled();

                // Cleanup
                consoleSpy.mockRestore();
            });

            it("should handle bundle loading error in createNodeAsync", async () => {
                // Arrange
                const consoleSpy = jest.spyOn(console, "log").mockImplementation();
                const error = new Error("Bundle loading failed");
                (bundleManager.loadAssetsFromBundle as jest.Mock).mockRejectedValue(error);

                // Act
                await cascadingMascotDecor["createNodeAsync"]();

                // Assert
                expect(console.log).toHaveBeenCalledWith(error);
                expect(instantiate).not.toHaveBeenCalled();

                // Cleanup
                consoleSpy.mockRestore();
            });
        });
    });

    describe("Properties and Constants", () => {
        it("should have correct fade in/out duration constant", () => {
            // Assert
            expect(cascadingMascotDecor["FADE_IN_OUT_DURATION"]).toBe(0.5);
        });

        it("should initialize prfMascot as null", () => {
            // Assert
            expect(cascadingMascotDecor["prfMascot"]).toBe(null);
        });
    });

    describe("Node Management", () => {
        it("should add mascot node as child of parent node", async () => {
            // Arrange
            const addChildSpy = jest.fn();
            cascadingMascotDecor.node = {
                addChild: addChildSpy,
            } as unknown as Node;

            // Act
            await cascadingMascotDecor["createNodeAsync"]();

            // Assert
            expect(addChildSpy).toHaveBeenCalledWith(mockNodeMascot);
        });

        it("should set mascot node as inactive initially", async () => {
            // Act
            await cascadingMascotDecor["createNodeAsync"]();

            // Assert
            expect(mockNodeMascot.active).toBe(false);
        });
    });

    describe("Animation Sequence", () => {
        it("should execute fade animations in correct sequence", async () => {
            // Arrange
            const fadeOutSpy = jest.spyOn(AnimationUtils, "fadeOutAndDeactivate");
            const fadeInSpy = jest.spyOn(AnimationUtils, "fadeIn");

            // Act
            await cascadingMascotDecor["createNodeAsync"]();

            // Assert
            expect(fadeOutSpy).toHaveBeenCalledWith(mockNodeMascotBlur, 0.5);
            expect(fadeInSpy).toHaveBeenCalledWith(mockNodeMascot, 0.5);
        });

        it("should use correct duration for both fade animations", async () => {
            // Act
            await cascadingMascotDecor["createNodeAsync"]();

            // Assert
            expect(AnimationUtils.fadeOutAndDeactivate).toHaveBeenCalledWith(
                mockNodeMascotBlur,
                0.5
            );
            expect(AnimationUtils.fadeIn).toHaveBeenCalledWith(mockNodeMascot, 0.5);
        });
    });

    describe("Error Handling", () => {
        it("should handle multiple errors gracefully", async () => {
            // Arrange
            const consoleSpy = jest.spyOn(console, "log").mockImplementation();
            const bundleError = new Error("Bundle error");
            const instantiateError = new Error("Instantiate error");

            (bundleManager.loadAssetsFromBundle as jest.Mock).mockRejectedValue(bundleError);
            (instantiate as jest.Mock).mockImplementation(() => {
                throw instantiateError;
            });

            // Act
            await cascadingMascotDecor.onLoad();

            // Assert
            expect(console.log).toHaveBeenCalledWith(bundleError);

            // Cleanup
            consoleSpy.mockRestore();
        });

        it("should continue execution even if createNodeAsync fails", async () => {
            // Arrange
            const consoleSpy = jest.spyOn(console, "log").mockImplementation();
            const error = new Error("Any error");
            (bundleManager.loadAssetsFromBundle as jest.Mock).mockRejectedValue(error);

            // Act
            await cascadingMascotDecor.onLoad();

            // Assert
            expect(mockNodeMascotBlur.active).toBe(true);
            expect(console.log).toHaveBeenCalledWith(error);

            // Cleanup
            consoleSpy.mockRestore();
        });
    });

    describe("Bundle Loading", () => {
        it("should load prefab from correct bundle and path", async () => {
            // Act
            await cascadingMascotDecor["createNodeAsync"]();

            // Assert
            expect(bundleManager.loadAssetsFromBundle).toHaveBeenCalledWith(
                "resources",
                "prefabs/mascot",
                Prefab,
                null
            );
        });

        it("should store loaded prefab in prfMascot property", async () => {
            // Act
            await cascadingMascotDecor["createNodeAsync"]();

            // Assert
            expect(cascadingMascotDecor["prfMascot"]).toBe(mockPrefab);
        });
    });

    describe("Component State", () => {
        it("should maintain component state across multiple calls", async () => {
            // Act
            await cascadingMascotDecor["createNodeAsync"]();
            await cascadingMascotDecor["createNodeAsync"](); // Second call

            // Assert
            expect(bundleManager.loadAssetsFromBundle).toHaveBeenCalledTimes(1);
            expect(instantiate).toHaveBeenCalledTimes(1);
        });

        it("should properly initialize component properties", () => {
            // Assert
            expect(cascadingMascotDecor.nodeMascotBlur).toBe(mockNodeMascotBlur);
            expect(cascadingMascotDecor["prfMascot"]).toBe(null);
        });
    });
});
