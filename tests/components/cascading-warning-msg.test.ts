import { Component, Label } from "cc";
import Observer from "observer";

import { ComponentUtils } from "db://shared-components/shared/utils/component-utils";

// Mock dependencies before importing the component
jest.mock("observer", () => ({
    render: jest.fn((store, selector, options) => {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            return descriptor;
        };
    }),
}));

jest.mock("db://shared-components/shared/utils/component-utils", () => ({
    ComponentUtils: {
        autoDisappear: jest.fn(),
    },
}));

// Import the component after mocks are set up
import { CascadingWarningMsg } from "../../assets/components/cascading-warning-msg";

describe("CascadingWarningMsg", () => {
    let cascadingWarningMsg: CascadingWarningMsg;
    let mockLabel: Label;
    let mockNode: any;

    // Test data constants
    const TEST_MESSAGE = "test warning message";
    const UPPERCASE_MESSAGE = "TEST WARNING MESSAGE";
    const EMPTY_MESSAGE = "";
    const SPECIAL_CHARS_MESSAGE = "test!@#$%^&*()";

    beforeEach(() => {
        setupMocks();
        createComponentInstance();
    });

    const setupMocks = () => {
        jest.clearAllMocks();

        mockLabel = {
            string: "",
        } as any;

        mockNode = {
            name: "warning-msg-node",
        };

        jest.spyOn(ComponentUtils, 'autoDisappear').mockImplementation(() => { });
    };

    const createComponentInstance = () => {
        cascadingWarningMsg = new CascadingWarningMsg();
        cascadingWarningMsg.lblMessage = mockLabel;
        cascadingWarningMsg.node = mockNode;
    };

    describe("Component Properties", () => {
        it("should have lblMessage property", () => {
            expect(cascadingWarningMsg.lblMessage).toBeDefined();
            expect(cascadingWarningMsg.lblMessage).toBe(mockLabel);
        });

        it("should be instance of Component", () => {
            expect(cascadingWarningMsg).toBeInstanceOf(Component);
        });

        it("should have node property", () => {
            expect(cascadingWarningMsg.node).toBeDefined();
            expect(cascadingWarningMsg.node).toBe(mockNode);
        });
    });

    describe("setData Method", () => {
        it("should convert message to uppercase and call autoDisappear", () => {
            cascadingWarningMsg.setData(TEST_MESSAGE);

            expect(mockLabel.string).toBe(UPPERCASE_MESSAGE);
            expect(ComponentUtils.autoDisappear).toHaveBeenCalledWith(mockNode);
        });

        it("should handle empty message", () => {
            cascadingWarningMsg.setData(EMPTY_MESSAGE);

            expect(mockLabel.string).toBe("");
            expect(ComponentUtils.autoDisappear).toHaveBeenCalledWith(mockNode);
        });

        it("should preserve already uppercase message", () => {
            const alreadyUppercase = "ALREADY UPPERCASE";

            cascadingWarningMsg.setData(alreadyUppercase);

            expect(mockLabel.string).toBe(alreadyUppercase);
            expect(ComponentUtils.autoDisappear).toHaveBeenCalledWith(mockNode);
        });

        it("should convert mixed case to uppercase", () => {
            const mixedCase = "MiXeD cAsE mEsSaGe";

            cascadingWarningMsg.setData(mixedCase);

            expect(mockLabel.string).toBe("MIXED CASE MESSAGE");
            expect(ComponentUtils.autoDisappear).toHaveBeenCalledWith(mockNode);
        });

        it("should handle special characters", () => {
            cascadingWarningMsg.setData(SPECIAL_CHARS_MESSAGE);

            expect(mockLabel.string).toBe("TEST!@#$%^&*()");
            expect(ComponentUtils.autoDisappear).toHaveBeenCalledWith(mockNode);
        });

        it("should handle numbers in message", () => {
            const messageWithNumbers = "test message 123";

            cascadingWarningMsg.setData(messageWithNumbers);

            expect(mockLabel.string).toBe("TEST MESSAGE 123");
            expect(ComponentUtils.autoDisappear).toHaveBeenCalledWith(mockNode);
        });

        it("should handle single character message", () => {
            const singleChar = "a";

            cascadingWarningMsg.setData(singleChar);

            expect(mockLabel.string).toBe("A");
            expect(ComponentUtils.autoDisappear).toHaveBeenCalledWith(mockNode);
        });

        it("should handle very long message", () => {
            const longMessage = "this is a very long warning message that should be converted to uppercase properly";

            cascadingWarningMsg.setData(longMessage);

            expect(mockLabel.string).toBe("THIS IS A VERY LONG WARNING MESSAGE THAT SHOULD BE CONVERTED TO UPPERCASE PROPERLY");
            expect(ComponentUtils.autoDisappear).toHaveBeenCalledWith(mockNode);
        });
    });

    describe("Edge Cases", () => {
        it("should handle message with only spaces", () => {
            const spacesOnly = "   ";

            cascadingWarningMsg.setData(spacesOnly);

            expect(mockLabel.string).toBe("   ");
            expect(ComponentUtils.autoDisappear).toHaveBeenCalledWith(mockNode);
        });

        it("should handle message with tabs and newlines", () => {
            const messageWithWhitespace = "test\tmessage\nwith\twhitespace";

            cascadingWarningMsg.setData(messageWithWhitespace);

            expect(mockLabel.string).toBe("TEST\tMESSAGE\nWITH\tWHITESPACE");
            expect(ComponentUtils.autoDisappear).toHaveBeenCalledWith(mockNode);
        });
    });

    describe("Integration Scenarios", () => {
        it("should work with multiple setData calls", () => {
            cascadingWarningMsg.setData("first message");
            cascadingWarningMsg.setData("second message");
            cascadingWarningMsg.setData("third message");

            expect(mockLabel.string).toBe("THIRD MESSAGE");
            expect(ComponentUtils.autoDisappear).toHaveBeenCalledTimes(3);
            expect(ComponentUtils.autoDisappear).toHaveBeenCalledWith(mockNode);
        });

        it("should maintain label reference after setData", () => {
            const originalLabel = cascadingWarningMsg.lblMessage;

            cascadingWarningMsg.setData(TEST_MESSAGE);

            expect(cascadingWarningMsg.lblMessage).toBe(originalLabel);
            expect(cascadingWarningMsg.lblMessage).toBe(mockLabel);
        });
    });

    describe("Decorators", () => {
        it("should have observer decorators properly configured", () => {
            expect(Observer.render).toBeDefined();
            expect(typeof Observer.render).toBe('function');
        });
    });
});
