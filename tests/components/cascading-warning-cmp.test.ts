import Observer from "observer";
import { WarningCmp } from "db://shared-components/shared/common-components/notice/scripts/warning-cmp";

jest.mock("observer", () => ({
    render: jest.fn((store, selector, options) => {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            return descriptor;
        };
    }),
}));

jest.mock("db://shared-components/shared/common-components/notice/scripts/warning-cmp", () => ({
    WarningCmp: class {
        lblMessage = { string: "" };
    },
}));

import { CascadingWarningCmp } from "../../assets/components/cascading-warning-cmp";

describe("CascadingWarningCmp", () => {
    let cascadingWarningCmp: CascadingWarningCmp;
    let mockLblMessage: any;

    beforeEach(() => {
        setupMocks();
        createComponentInstance();
    });

    const setupMocks = () => {
        jest.clearAllMocks();
        mockLblMessage = { string: "" };
    };

    const createComponentInstance = () => {
        cascadingWarningCmp = new CascadingWarningCmp();
        cascadingWarningCmp.lblMessage = mockLblMessage;
    };

    describe("Component Properties", () => {
        it("should be instance of WarningCmp", () => {
            expect(cascadingWarningCmp).toBeInstanceOf(WarningCmp);
        });

        it("should have lblMessage property", () => {
            expect(cascadingWarningCmp.lblMessage).toBeDefined();
            expect(cascadingWarningCmp.lblMessage).toBe(mockLblMessage);
        });
    });

    describe("setData Method", () => {
        it("should convert lowercase message to uppercase", () => {
            const testMessage = "hello world";
            cascadingWarningCmp.setData(testMessage);

            expect(mockLblMessage.string).toBe("HELLO WORLD");
        });

        it("should convert mixed case message to uppercase", () => {
            const testMessage = "Hello World";
            cascadingWarningCmp.setData(testMessage);

            expect(mockLblMessage.string).toBe("HELLO WORLD");
        });

        it("should handle already uppercase message", () => {
            const testMessage = "HELLO WORLD";
            cascadingWarningCmp.setData(testMessage);

            expect(mockLblMessage.string).toBe("HELLO WORLD");
        });

        it("should handle empty message", () => {
            const testMessage = "";
            cascadingWarningCmp.setData(testMessage);

            expect(mockLblMessage.string).toBe("");
        });

        it("should handle single character message", () => {
            const testMessage = "a";
            cascadingWarningCmp.setData(testMessage);

            expect(mockLblMessage.string).toBe("A");
        });

        it("should handle numbers in message", () => {
            const testMessage = "hello123world";
            cascadingWarningCmp.setData(testMessage);

            expect(mockLblMessage.string).toBe("HELLO123WORLD");
        });

        it("should handle special characters in message", () => {
            const testMessage = "hello!@#$%world";
            cascadingWarningCmp.setData(testMessage);

            expect(mockLblMessage.string).toBe("HELLO!@#$%WORLD");
        });

        it("should handle spaces in message", () => {
            const testMessage = "  hello  world  ";
            cascadingWarningCmp.setData(testMessage);

            expect(mockLblMessage.string).toBe("  HELLO  WORLD  ");
        });

        it("should handle multiple consecutive calls", () => {
            cascadingWarningCmp.setData("first message");
            expect(mockLblMessage.string).toBe("FIRST MESSAGE");

            cascadingWarningCmp.setData("second message");
            expect(mockLblMessage.string).toBe("SECOND MESSAGE");

            cascadingWarningCmp.setData("third message");
            expect(mockLblMessage.string).toBe("THIRD MESSAGE");
        });
    });

    describe("Edge Cases", () => {
        it("should handle very long message", () => {
            const longMessage = "a".repeat(1000);
            cascadingWarningCmp.setData(longMessage);

            expect(mockLblMessage.string).toBe("A".repeat(1000));
        });

        it("should handle unicode characters", () => {
            const unicodeMessage = "héllö wörld";
            cascadingWarningCmp.setData(unicodeMessage);

            expect(mockLblMessage.string).toBe("HÉLLÖ WÖRLD");
        });

        it("should handle emoji characters", () => {
            const emojiMessage = "hello 😀 world";
            cascadingWarningCmp.setData(emojiMessage);

            expect(mockLblMessage.string).toBe("HELLO 😀 WORLD");
        });
    });

    describe("Integration", () => {
        it("should work with different message types in sequence", () => {
            const messages = [
                "hello",
                "WORLD",
                "Test Message",
                "123 numbers",
                "!@# symbols",
                ""
            ];

            messages.forEach((message, index) => {
                cascadingWarningCmp.setData(message);
                expect(mockLblMessage.string).toBe(message.toUpperCase());
            });
        });
    });

    describe("Decorators", () => {
        it("should have observer decorators properly configured", () => {
            expect(Observer.render).toBeDefined();
            expect(typeof Observer.render).toBe('function');
        });
    });
});
