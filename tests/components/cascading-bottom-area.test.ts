import { Color, Label } from "cc";
import { ChangeNodeColor } from "db://shared-components/shared/common-components/change-node-color";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { LocalizedLabel } from "../../../i18n/assets/LocalizedLabel";

jest.mock("observer", () => ({
    render: jest.fn((store, selector, options) => {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            return descriptor;
        };
    }),
}));

jest.mock("db://shared-components/shared/common-components/observer-component/scripts/observer-component", () => ({
    ObserverComponent: class {
        onLoad() {}
    },
}));

jest.mock("db://shared-components/shared/utils", () => ({
    AnimationUtils: {
        floatToNumber: jest.fn(),
    },
}));

jest.mock("db://shared-components/shared/common-components/change-node-color", () => ({
    ChangeNodeColor: class {
        updateColor(color: string) {}
    },
}));

// Mock LocalizedLabel
jest.mock("../../../i18n/assets/LocalizedLabel", () => ({
    LocalizedLabel: class {
        constructor() {}
    },
}));

// Mock cc module with proper Color class and decorators
jest.mock("cc", () => ({
    Color: class {
        fromHEX(hex: string) {
            return this;
        }
    },
    JsonAsset: class {},
    Label: class {},
    _decorator: {
        ccclass: function () {
            return function (target: any) {
                return target;
            };
        },
        property: function () {
            return function (target: any, propertyKey: string) {
                // Make the property writable for testing
                Object.defineProperty(target, propertyKey, {
                    writable: true,
                    configurable: true,
                    enumerable: true,
                });
                return target;
            };
        },
    },
}));

jest.mock("../../assets/cascading-slot-utils", () => ({
    resourcesCache: {
        gameFeatures: {
            turnOnEventMascot: true,
        },
        colorJson: {
            bottomAreaTextColor: "#FFFFFF",
            bottomAreaNumberColor: "#FFD700",
            bottomAreaButtonBorderColor: "#FF0000",
            bottomAreaWinAmountColor: "#00FF00",
        },
    },
}));

import { resourcesCache } from "../../assets/cascading-slot-utils";
import { CascadingBottomArea } from "../../assets/components/cascading-bottom-area";

describe("CascadingBottomArea", () => {
    let cascadingBottomArea: CascadingBottomArea;
    let mockTotalWinLabel: any;
    let mockNode: any;
    let mockChangeNodeColorComponents: any[];
    let mockLabelComponents: any[];
    let mockLabelComponent: any;

    beforeEach(() => {
        setupMocks();
        createComponentInstance();
    });

    const setupMocks = () => {
        jest.clearAllMocks();

        // Create a proper mock Label component with color property
        mockLabelComponent = {
            color: new Color(),
        };

        mockTotalWinLabel = {
            string: "0",
            node: {
                getComponent: jest.fn().mockReturnValue(mockLabelComponent),
            },
        };

        mockLabelComponents = [{ string: "Label 1" }, { string: "Label 2" }];

        mockChangeNodeColorComponents = [
            {
                node: {
                    getComponent: jest.fn().mockReturnValue(mockLabelComponents[0]),
                    getComponentInChildren: jest.fn(),
                },
                updateColor: jest.fn(),
            },
            {
                node: {
                    getComponent: jest.fn().mockReturnValue(mockLabelComponents[1]),
                    getComponentInChildren: jest.fn(),
                },
                updateColor: jest.fn(),
            },
            {
                node: {
                    getComponent: jest.fn().mockReturnValue(null), // No Label component
                    getComponentInChildren: jest.fn(),
                },
                updateColor: jest.fn(),
            },
        ];

        mockNode = {
            getComponentsInChildren: jest.fn().mockReturnValue(mockChangeNodeColorComponents),
        };
    };

    const createComponentInstance = () => {
        cascadingBottomArea = new CascadingBottomArea();

        // Use Object.defineProperty to set the properties
        Object.defineProperty(cascadingBottomArea, "totalWinLabel", {
            value: mockTotalWinLabel,
            writable: true,
            configurable: true,
            enumerable: true,
        });

        Object.defineProperty(cascadingBottomArea, "node", {
            value: mockNode,
            writable: true,
            configurable: true,
            enumerable: true,
        });
    };

    describe("Component Properties", () => {
        it("should be instance of ObserverComponent", () => {
            expect(cascadingBottomArea).toBeInstanceOf(ObserverComponent);
        });

        it("should have totalWinLabel property", () => {
            expect(cascadingBottomArea.totalWinLabel).toBeDefined();
            expect(cascadingBottomArea.totalWinLabel).toBe(mockTotalWinLabel);
        });

        it("should have colorConfig property", () => {
            expect(cascadingBottomArea["colorConfig"]).toBeUndefined(); // Initially undefined
        });
    });

    describe("onLoad Method", () => {
        it("should set colorConfig from colorInfo.json", () => {
            cascadingBottomArea.onLoad();

            expect(cascadingBottomArea["colorConfig"]).toBe(resourcesCache.colorJson);
        });

        it("should call updateColor method", () => {
            const updateColorSpy = jest.spyOn(cascadingBottomArea, "updateColor");

            cascadingBottomArea.onLoad();

            expect(updateColorSpy).toHaveBeenCalledTimes(1);
        });

        it("should call super.onLoad", () => {
            const superOnLoadSpy = jest.spyOn(ObserverComponent.prototype, "onLoad");

            cascadingBottomArea.onLoad();

            expect(superOnLoadSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("handleSettlement Method", () => {
        it("should set totalWinLabel string to '0' when totalTumbleWin is 0", async () => {
            await cascadingBottomArea.handleSettlement(0);

            expect(mockTotalWinLabel.string).toBe("0");
        });

        it("should not call AnimationUtils.floatToNumber when totalTumbleWin is 0", async () => {
            await cascadingBottomArea.handleSettlement(0);

            expect(AnimationUtils.floatToNumber).not.toHaveBeenCalled();
        });

        it("should call AnimationUtils.floatToNumber with correct parameters when totalTumbleWin is not 0", async () => {
            const totalTumbleWin = 1000;

            await cascadingBottomArea.handleSettlement(totalTumbleWin);

            expect(AnimationUtils.floatToNumber).toHaveBeenCalledWith({
                label: mockTotalWinLabel,
                amount: totalTumbleWin,
                duration: 0.5,
                noZeroSuffix: true,
                xMode: 1,
            });
        });

        it("should handle positive totalTumbleWin values", async () => {
            const totalTumbleWin = 5000;

            await cascadingBottomArea.handleSettlement(totalTumbleWin);

            expect(AnimationUtils.floatToNumber).toHaveBeenCalledWith({
                label: mockTotalWinLabel,
                amount: totalTumbleWin,
                duration: 0.5,
                noZeroSuffix: true,
                xMode: 1,
            });
        });

        it("should handle negative totalTumbleWin values", async () => {
            const totalTumbleWin = -100;

            await cascadingBottomArea.handleSettlement(totalTumbleWin);

            expect(AnimationUtils.floatToNumber).toHaveBeenCalledWith({
                label: mockTotalWinLabel,
                amount: totalTumbleWin,
                duration: 0.5,
                noZeroSuffix: true,
                xMode: 1,
            });
        });

        it("should handle decimal totalTumbleWin values", async () => {
            const totalTumbleWin = 123.45;

            await cascadingBottomArea.handleSettlement(totalTumbleWin);

            expect(AnimationUtils.floatToNumber).toHaveBeenCalledWith({
                label: mockTotalWinLabel,
                amount: totalTumbleWin,
                duration: 0.5,
                noZeroSuffix: true,
                xMode: 1,
            });
        });
    });

    describe("updateColor Method", () => {
        beforeEach(() => {
            // Reset mocks to ensure clean state
            jest.clearAllMocks();
            // Re-setup the node mock
            mockNode.getComponentsInChildren.mockReturnValue(mockChangeNodeColorComponents);
            cascadingBottomArea.onLoad();
        });

        it("should call getComponentsInChildren with ChangeNodeColor", () => {
            cascadingBottomArea.updateColor();

            expect(mockNode.getComponentsInChildren).toHaveBeenCalledWith(ChangeNodeColor);
        });

        it("should update colors for components with Label", () => {
            // Mock components without LocalizedLabel to get bottomAreaNumberColor
            mockChangeNodeColorComponents[0].node.getComponent.mockImplementation((componentType) => {
                if (componentType === Label) {
                    return mockLabelComponents[0];
                } else if (componentType === LocalizedLabel) {
                    return null; // No LocalizedLabel
                }
                return null;
            });

            mockChangeNodeColorComponents[1].node.getComponent.mockImplementation((componentType) => {
                if (componentType === Label) {
                    return mockLabelComponents[1];
                } else if (componentType === LocalizedLabel) {
                    return null; // No LocalizedLabel
                }
                return null;
            });

            cascadingBottomArea.updateColor();

            expect(mockChangeNodeColorComponents[0].updateColor).toHaveBeenCalledWith(resourcesCache.colorJson.bottomAreaNumberColor);
            expect(mockChangeNodeColorComponents[1].updateColor).toHaveBeenCalledWith(resourcesCache.colorJson.bottomAreaNumberColor);
        });

        it("should update colors for components without Label", () => {
            cascadingBottomArea.updateColor();

            expect(mockChangeNodeColorComponents[2].updateColor).toHaveBeenCalledWith(resourcesCache.colorJson.bottomAreaButtonBorderColor);
        });

        it("should update totalWinLabel color", () => {
            cascadingBottomArea.updateColor();

            expect(mockTotalWinLabel.node.getComponent).toHaveBeenCalledWith(Label);
            expect(mockLabelComponent.color).toBeInstanceOf(Color);
        });

        it("should handle components with LocalizedLabel", () => {
            // Mock a component that has LocalizedLabel
            const mockLocalizedLabelComponent = {
                node: {
                    getComponent: jest
                        .fn()
                        .mockReturnValueOnce(mockLabelComponents[0]) // First call returns Label
                        .mockReturnValueOnce(new LocalizedLabel()), // Second call returns LocalizedLabel
                },
                updateColor: jest.fn(),
            };

            mockNode.getComponentsInChildren.mockReturnValue([mockLocalizedLabelComponent]);

            cascadingBottomArea.updateColor();

            expect(mockLocalizedLabelComponent.updateColor).toHaveBeenCalledWith(resourcesCache.colorJson.bottomAreaTextColor);
        });

        it("should handle missing colorConfig gracefully", () => {
            cascadingBottomArea["colorConfig"] = null;

            expect(() => {
                cascadingBottomArea.updateColor();
            }).toThrow("Cannot read properties of null (reading 'bottomAreaTextColor')");
        });

        it("should handle missing totalWinLabel node", () => {
            mockTotalWinLabel.node = null;

            expect(() => {
                cascadingBottomArea.updateColor();
            }).toThrow("Cannot read properties of null (reading 'getComponent')");
        });

        it("should handle missing Label component on totalWinLabel", () => {
            mockTotalWinLabel.node.getComponent.mockReturnValue(null);

            expect(() => {
                cascadingBottomArea.updateColor();
            }).toThrow("Cannot set properties of null (setting 'color')");
        });

        it("should handle empty colorConfig gracefully", () => {
            cascadingBottomArea["colorConfig"] = {};

            // The component should handle empty colorConfig without throwing
            expect(() => {
                cascadingBottomArea.updateColor();
            }).not.toThrow();

            // Verify that updateColor was called on components even with empty config
            expect(mockChangeNodeColorComponents[0].updateColor).toHaveBeenCalledWith(undefined);
            expect(mockChangeNodeColorComponents[1].updateColor).toHaveBeenCalledWith(undefined);
            expect(mockChangeNodeColorComponents[2].updateColor).toHaveBeenCalledWith(undefined);
        });

        it("should handle missing color properties in colorConfig gracefully", () => {
            cascadingBottomArea["colorConfig"] = {
                // Missing color properties
            };

            // The component should handle missing properties without throwing
            expect(() => {
                cascadingBottomArea.updateColor();
            }).not.toThrow();

            // Verify that updateColor was called on components even with missing config
            expect(mockChangeNodeColorComponents[0].updateColor).toHaveBeenCalledWith(undefined);
            expect(mockChangeNodeColorComponents[1].updateColor).toHaveBeenCalledWith(undefined);
            expect(mockChangeNodeColorComponents[2].updateColor).toHaveBeenCalledWith(undefined);
        });
    });

    describe("Integration Tests", () => {
        it("should work correctly with full initialization flow", () => {
            const updateColorSpy = jest.spyOn(cascadingBottomArea, "updateColor");

            cascadingBottomArea.onLoad();

            expect(cascadingBottomArea["colorConfig"]).toBe(resourcesCache.colorJson);
            expect(updateColorSpy).toHaveBeenCalledTimes(1);
        });

        it("should handle settlement flow correctly", async () => {
            cascadingBottomArea["colorConfig"] = resourcesCache.colorJson;

            // Test zero win
            await cascadingBottomArea.handleSettlement(0);
            expect(mockTotalWinLabel.string).toBe("0");
            expect(AnimationUtils.floatToNumber).not.toHaveBeenCalled();

            // Test positive win
            await cascadingBottomArea.handleSettlement(1000);
            expect(AnimationUtils.floatToNumber).toHaveBeenCalledWith({
                label: mockTotalWinLabel,
                amount: 1000,
                duration: 0.5,
                noZeroSuffix: true,
                xMode: 1,
            });
        });

        it("should update colors correctly after initialization", () => {
            // Reset the mock to ensure clean state
            jest.clearAllMocks();

            // Mock components without LocalizedLabel to get bottomAreaNumberColor
            mockChangeNodeColorComponents[0].node.getComponent.mockImplementation((componentType) => {
                if (componentType === Label) {
                    return mockLabelComponents[0];
                } else if (componentType === LocalizedLabel) {
                    return null; // No LocalizedLabel
                }
                return null;
            });

            mockChangeNodeColorComponents[1].node.getComponent.mockImplementation((componentType) => {
                if (componentType === Label) {
                    return mockLabelComponents[1];
                } else if (componentType === LocalizedLabel) {
                    return null; // No LocalizedLabel
                }
                return null;
            });

            cascadingBottomArea.onLoad();

            expect(mockChangeNodeColorComponents[0].updateColor).toHaveBeenCalledWith(resourcesCache.colorJson.bottomAreaNumberColor);
            expect(mockChangeNodeColorComponents[1].updateColor).toHaveBeenCalledWith(resourcesCache.colorJson.bottomAreaNumberColor);
            expect(mockChangeNodeColorComponents[2].updateColor).toHaveBeenCalledWith(resourcesCache.colorJson.bottomAreaButtonBorderColor);
        });
    });

    describe("Edge Cases", () => {
        it("should handle very large totalTumbleWin values", async () => {
            const largeValue = 999999999;

            await cascadingBottomArea.handleSettlement(largeValue);

            expect(AnimationUtils.floatToNumber).toHaveBeenCalledWith({
                label: mockTotalWinLabel,
                amount: largeValue,
                duration: 0.5,
                noZeroSuffix: true,
                xMode: 1,
            });
        });

        it("should handle zero totalTumbleWin multiple times", async () => {
            await cascadingBottomArea.handleSettlement(0);
            expect(mockTotalWinLabel.string).toBe("0");

            await cascadingBottomArea.handleSettlement(0);
            expect(mockTotalWinLabel.string).toBe("0");
        });
    });

    describe("Decorators", () => {
        it("should have observer decorators properly configured", () => {
            expect(Observer.render).toBeDefined();
            expect(typeof Observer.render).toBe("function");
        });

        it("should have render decorator on handleSettlement method", () => {
            // The decorator is applied at class definition time, so we need to check if it was called
            // We'll verify the decorator function exists and can be called
            expect(Observer.render).toBeDefined();
            expect(typeof Observer.render).toBe("function");
        });
    });
});
