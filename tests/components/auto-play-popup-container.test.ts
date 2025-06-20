import { Node } from "cc";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import { AutoPlayPopupContainer } from "../../assets/components/auto-play/auto-play-popup-container";

// Mock only the necessary external dependencies
jest.mock("../../assets/stores/auto-play-store");
jest.mock("observer", () => {
    const render = (store: any, callback: any) => {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const originalMethod = descriptor.value;
            descriptor.value = function (...args: any[]) {
                return originalMethod.apply(this, args);
            };
            return descriptor;
        };
    };

    const handle = (handler: any, callback: any) => {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const originalMethod = descriptor.value;
            descriptor.value = function (...args: any[]) {
                return originalMethod.apply(this, args);
            };
            return descriptor;
        };
    };

    return {
        render,
        handle,
        observer: jest.fn(),
    };
});

describe("AutoPlayPopupContainer", () => {
    let container: AutoPlayPopupContainer;
    let mockNode: Node;
    let mockDialog: Dialog;
    let mockChildNode: Node;

    beforeEach(() => {
        // Create minimal mocks for external dependencies
        mockDialog = {
            hide: jest.fn(),
        } as unknown as Dialog;

        mockChildNode = {
            getComponent: jest.fn(),
        } as unknown as Node;

        mockNode = {
            get children() {
                return [mockChildNode];
            },
            getComponent: jest.fn(),
        } as unknown as Node;

        // Create instance of the main class without mocking its methods
        container = new AutoPlayPopupContainer();
        container.node = mockNode;
    });

    describe("renderOpenPopup", () => {
        it("should hide dialog when isOpenAutoPlayPopup is false", () => {
            // Setup minimal required state
            mockChildNode.getComponent = jest.fn().mockReturnValue(mockDialog);

            // Call the actual method
            container.renderOpenPopup(false);

            // Verify the behavior
            expect(mockDialog.hide).toHaveBeenCalled();
        });

        it("should not call hide when no dialog component exists", () => {
            // Setup minimal required state
            mockChildNode.getComponent = jest.fn().mockReturnValue(null);

            // Call the actual method
            container.renderOpenPopup(false);

            // Verify the behavior
            expect(mockDialog.hide).not.toHaveBeenCalled();
        });

        it("should not call hide when no children exist", () => {
            // Setup minimal required state
            mockNode = {
                get children() {
                    return [];
                },
                getComponent: jest.fn(),
            } as unknown as Node;
            container.node = mockNode;

            // Call the actual method
            container.renderOpenPopup(false);

            // Verify the behavior
            expect(mockDialog.hide).not.toHaveBeenCalled();
        });

        it("should call createNode when isOpenAutoPlayPopup is true", () => {
            // Setup spy on createNode
            const createNodeSpy = jest.spyOn(container, "createNode");

            // Call the actual method
            container.renderOpenPopup(true);

            // Verify the behavior
            expect(createNodeSpy).toHaveBeenCalled();
        });
    });
});
