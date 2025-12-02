// import { FSBPromotionStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-store";
// import { FSBPromotionUIStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
// import { Container } from "inversify";
// import mobx from "mobx";
// import "reflect-metadata";
// import { CascadingSlotState } from "../../assets/cascading-slot-state";
// import { AutoPlayStore } from "../../assets/stores/auto-play-store";
// import { BetControlStore } from "../../assets/stores/bet-control-store";
// import { CascadingSlotConfigsStore } from "../../assets/stores/cascading-slot-configs-store";
// import { CascadingUIStore } from "../../assets/stores/cascading-ui-store";
// import { HyperSpinStore } from "../../assets/stores/hyper-spin-store";

// // Mock gc module
// jest.mock("@sg/game-client-base", () => ({
//     FormatUtils: {
//         numberWithCommas: jest.fn((value: number, decimals: number = 2, forceDecimals: boolean = true) => {
//             if (isNaN(value)) return "0.00";
//             const formatted = value.toFixed(decimals);
//             return forceDecimals ? formatted : formatted.replace(/\.?0+$/, '');
//         })
//     },
//     Configs: {
//         SiteConfigs: jest.fn()
//     },
//     Player: {
//         MainPlayerStore: jest.fn()
//     }
// }));

// describe("HyperSpinStore", () => {
//     let container: Container;
//     let hyperSpinStore: HyperSpinStore;
//     let cascadingUIStore: any; // Mock object
//     let autoPlayStore: any; // Mock object
//     let fsbPromotionUIStore: any; // Mock object
//     let fsbPromotionStore: any; // Mock object
//     let configStore: any; // Mock object
//     let betControlStore: any; // Mock object

//     beforeEach(() => {
//         container = new Container();

//         // Create mock stores
//         cascadingUIStore = {
//             userBalance: 1000,
//             cascadingState: CascadingSlotState.READY_BET,
//             isFreeSpins: false,
//             disabledOpenInputBet: false,
//             isHyperSpinActive: false,
//         };

//         autoPlayStore = {
//             isOpenAutoplayPopup: false,
//         };

//         fsbPromotionUIStore = {
//             // Add mock properties as needed
//         };

//         fsbPromotionStore = {
//             // Add mock properties as needed
//         };

//         configStore = {
//             gameConfigs: {
//                 maxWinPerRound: 1000,
//             },
//         };

//         betControlStore = {
//             totalBet: 10,
//             totalBetUnique: [
//                 { "5": { betLevel: 1, coinValue: 0.5 } },
//                 { "10": { betLevel: 1, coinValue: 1.0 } },
//                 { "20": { betLevel: 2, coinValue: 1.0 } },
//                 { "50": { betLevel: 5, coinValue: 1.0 } },
//                 { "100": { betLevel: 10, coinValue: 1.0 } },
//             ],
//         };

//         // Bind dependencies
//         container.bind(CascadingUIStore).toConstantValue(cascadingUIStore);
//         container.bind(AutoPlayStore).toConstantValue(autoPlayStore);
//         container.bind(FSBPromotionUIStore).toConstantValue(fsbPromotionUIStore);
//         container.bind(FSBPromotionStore).toConstantValue(fsbPromotionStore);
//         container.bind(CascadingSlotConfigsStore).toConstantValue(configStore);
//         container.bind(BetControlStore).toConstantValue(betControlStore);
//         container.bind(HyperSpinStore).toSelf();

//         // Get instance
//         hyperSpinStore = container.get(HyperSpinStore);

//         // Initialize with test data
//         hyperSpinStore.currentTotalBetIndex = 1; // Corresponds to totalBet = 10
//     });

//     afterEach(() => {
//         jest.clearAllMocks();
//     });

//     describe("constructor", () => {
//         it("should initialize with correct default values", () => {
//             const freshStore = new HyperSpinStore();

//             expect(freshStore.isOpenHyperSpinBetControlPopup).toBe(false);
//             expect(freshStore.roundsList).toEqual([10, 50, 100, 500, 1000]);
//             expect(freshStore.isOpenHyperSpinPopup).toBe(false);
//             expect(freshStore.selectedRoundOnPopup).toBe(100);
//             expect(freshStore.roundsHyperSpin).toBe(0);
//             expect(freshStore.isHyperSpin).toBe(false);
//             expect(freshStore.stopOnProfit).toBe(0);
//             expect(freshStore.stopOnLoss).toBe(0);
//             expect(freshStore.stopOnFeature).toBe(false);
//             expect(freshStore.needClearLastSetting).toBe(false);
//         });

//         it("should make properties observable with MobX", () => {
//             const freshStore = new HyperSpinStore();

//             expect(mobx.isObservable(freshStore)).toBe(true);
//             expect(mobx.isObservableProp(freshStore, 'isOpenHyperSpinBetControlPopup')).toBe(true);
//             expect(mobx.isObservableProp(freshStore, 'stopOnProfit')).toBe(true);
//             expect(mobx.isObservableProp(freshStore, 'stopOnLoss')).toBe(true);
//         });
//     });

//     describe("UI state getters", () => {
//         describe("isTurnOnHyperSpin", () => {
//             it("should be true when isOpenHyperSpinPopup is true", () => {
//                 mobx.runInAction(() => {
//                     hyperSpinStore.isOpenHyperSpinPopup = true;
//                     hyperSpinStore.isHyperSpin = false;
//                 });
//                 expect(hyperSpinStore.isTurnOnHyperSpin).toBe(true);
//             });

//             it("should be true when isHyperSpin is true", () => {
//                 mobx.runInAction(() => {
//                     hyperSpinStore.isOpenHyperSpinPopup = false;
//                     hyperSpinStore.isHyperSpin = true;
//                 });
//                 expect(hyperSpinStore.isTurnOnHyperSpin).toBe(true);
//             });

//             it("should be true when both popup and hyper spin are active", () => {
//                 mobx.runInAction(() => {
//                     hyperSpinStore.isOpenHyperSpinPopup = true;
//                     hyperSpinStore.isHyperSpin = true;
//                 });
//                 expect(hyperSpinStore.isTurnOnHyperSpin).toBe(true);
//             });

//             it("should be false when neither popup nor hyper spin are active", () => {
//                 mobx.runInAction(() => {
//                     hyperSpinStore.isOpenHyperSpinPopup = false;
//                     hyperSpinStore.isHyperSpin = false;
//                 });
//                 expect(hyperSpinStore.isTurnOnHyperSpin).toBe(false);
//             });
//         });

//         describe("totalBet", () => {
//             it("should return betControlStore totalBet", () => {
//                 expect(hyperSpinStore.totalBet).toBe(10);
//             });

//             it("should return 0 when betControlStore is not available", () => {
//                 const freshStore = new HyperSpinStore();
//                 expect(freshStore.totalBet).toBe(0);
//             });
//         });

//         describe("disabledChangeBet", () => {
//             it("should return true when isFreeSpins is true", () => {
//                 cascadingUIStore.isFreeSpins = true;
//                 cascadingUIStore.disabledOpenInputBet = false;

//                 expect(hyperSpinStore.disabledChangeBet).toBe(true);
//             });

//             it("should return true when disabledOpenInputBet is true", () => {
//                 cascadingUIStore.isFreeSpins = false;
//                 cascadingUIStore.disabledOpenInputBet = true;

//                 expect(hyperSpinStore.disabledChangeBet).toBe(true);
//             });

//             it("should return false when both conditions are false", () => {
//                 cascadingUIStore.isFreeSpins = false;
//                 cascadingUIStore.disabledOpenInputBet = false;

//                 expect(hyperSpinStore.disabledChangeBet).toBe(false);
//             });

//             it("should handle undefined cascadingUIStore", () => {
//                 const freshStore = new HyperSpinStore();
//                 expect(freshStore.disabledChangeBet).toBe(false);
//             });
//         });

//         describe("interactableTotalBet", () => {
//             it("should return disabled state when bet changes are disabled", () => {
//                 cascadingUIStore.isFreeSpins = true;

//                 const result = hyperSpinStore.interactableTotalBet;

//                 expect(result.increase).toBe(false);
//                 expect(result.decrease).toBe(false);
//             });

//             it("should return correct state when at minimum total bet index", () => {
//                 cascadingUIStore.isFreeSpins = false;
//                 hyperSpinStore.currentTotalBetIndex = 0;

//                 const result = hyperSpinStore.interactableTotalBet;

//                 expect(result.increase).toBe(true);
//                 expect(result.decrease).toBe(false);
//             });

//             it("should return correct state when at maximum total bet index", () => {
//                 cascadingUIStore.isFreeSpins = false;
//                 hyperSpinStore.currentTotalBetIndex = 4; // last index

//                 const result = hyperSpinStore.interactableTotalBet;

//                 expect(result.increase).toBe(false);
//                 expect(result.decrease).toBe(true);
//             });

//             it("should return correct state when at middle total bet index", () => {
//                 cascadingUIStore.isFreeSpins = false;
//                 hyperSpinStore.currentTotalBetIndex = 2;

//                 const result = hyperSpinStore.interactableTotalBet;

//                 expect(result.increase).toBe(true);
//                 expect(result.decrease).toBe(true);
//             });
//         });

//         describe("isCollapseMenuInGame", () => {
//             it("should return true when cascading state is SPINNING", () => {
//                 cascadingUIStore.cascadingState = CascadingSlotState.SPINNING;
//                 autoPlayStore.isOpenAutoplayPopup = false;
//                 hyperSpinStore.isOpenHyperSpinPopup = false;

//                 expect(hyperSpinStore.isCollapseMenuInGame).toBe(true);
//             });

//             it("should return true when autoplay popup is open", () => {
//                 cascadingUIStore.cascadingState = CascadingSlotState.READY_BET;
//                 autoPlayStore.isOpenAutoplayPopup = true;
//                 hyperSpinStore.isOpenHyperSpinPopup = false;

//                 expect(hyperSpinStore.isCollapseMenuInGame).toBe(true);
//             });

//             it("should return true when hyper spin popup is open", () => {
//                 cascadingUIStore.cascadingState = CascadingSlotState.READY_BET;
//                 autoPlayStore.isOpenAutoplayPopup = false;
//                 hyperSpinStore.isOpenHyperSpinPopup = true;

//                 expect(hyperSpinStore.isCollapseMenuInGame).toBe(true);
//             });

//             it("should return false when all conditions are false", () => {
//                 cascadingUIStore.cascadingState = CascadingSlotState.READY_BET;
//                 autoPlayStore.isOpenAutoplayPopup = false;
//                 hyperSpinStore.isOpenHyperSpinPopup = false;

//                 expect(hyperSpinStore.isCollapseMenuInGame).toBe(false);
//             });

//             it("should return true when multiple conditions are true", () => {
//                 cascadingUIStore.cascadingState = CascadingSlotState.SPINNING;
//                 autoPlayStore.isOpenAutoplayPopup = true;
//                 hyperSpinStore.isOpenHyperSpinPopup = true;

//                 expect(hyperSpinStore.isCollapseMenuInGame).toBe(true);
//             });
//         });
//     });

//     describe("Stop condition getters", () => {
//         describe("maxStopOnProfit", () => {
//             it("should calculate max stop on profit correctly", () => {
//                 configStore.gameConfigs.maxWinPerRound = 50;
//                 betControlStore.totalBet = 10;

//                 expect(hyperSpinStore.maxStopOnProfit).toBe(500); // 10 * 50
//             });

//             it("should return 0 when maxWinPerRound is 0", () => {
//                 configStore.gameConfigs.maxWinPerRound = 0;
//                 betControlStore.totalBet = 10;

//                 expect(hyperSpinStore.maxStopOnProfit).toBe(0);
//             });

//             it("should handle undefined configStore", () => {
//                 const freshStore = new HyperSpinStore();
//                 expect(freshStore.maxStopOnProfit).toBe(0);
//             });

//             it("should handle undefined gameConfigs", () => {
//                 configStore.gameConfigs = undefined;
//                 expect(hyperSpinStore.maxStopOnProfit).toBe(0);
//             });
//         });

//         describe("minStopOnProfit", () => {
//             it("should return 0", () => {
//                 expect(hyperSpinStore.minStopOnProfit).toBe(0);
//             });
//         });

//         describe("stopOnProfitStep", () => {
//             it("should return totalBet value", () => {
//                 betControlStore.totalBet = 25;
//                 expect(hyperSpinStore.stopOnProfitStep).toBe(25);
//             });

//             it("should return 0 when betControlStore is not available", () => {
//                 const freshStore = new HyperSpinStore();
//                 expect(freshStore.stopOnProfitStep).toBe(0);
//             });
//         });

//         describe("maxStopOnLoss", () => {
//             it("should return user balance", () => {
//                 cascadingUIStore.userBalance = 500;
//                 expect(hyperSpinStore.maxStopOnLoss).toBe(500);
//             });

//             it("should handle undefined cascadingUIStore", () => {
//                 const freshStore = new HyperSpinStore();
//                 expect(freshStore.maxStopOnLoss).toBe(0);
//             });
//         });

//         describe("minStopOnLoss", () => {
//             it("should return 0", () => {
//                 expect(hyperSpinStore.minStopOnLoss).toBe(0);
//             });
//         });

//         describe("stopOnLossStep", () => {
//             it("should return totalBet value", () => {
//                 betControlStore.totalBet = 30;
//                 expect(hyperSpinStore.stopOnLossStep).toBe(30);
//             });

//             it("should return 0 when betControlStore is not available", () => {
//                 const freshStore = new HyperSpinStore();
//                 expect(freshStore.stopOnLossStep).toBe(0);
//             });
//         });
//     });

//     describe("Stop condition setters", () => {
//         describe("setStopOnProfit", () => {
//             it("should set stopOnProfit within valid range", () => {
//                 configStore.gameConfigs.maxWinPerRound = 100;
//                 betControlStore.totalBet = 10;

//                 hyperSpinStore.setStopOnProfit(500);

//                 expect(hyperSpinStore.stopOnProfit).toBe(500);
//             });

//             it("should clamp to maximum value", () => {
//                 configStore.gameConfigs.maxWinPerRound = 50;
//                 betControlStore.totalBet = 10;

//                 hyperSpinStore.setStopOnProfit(1000);

//                 expect(hyperSpinStore.stopOnProfit).toBe(500); // 10 * 50
//             });

//             it("should clamp to minimum value", () => {
//                 hyperSpinStore.setStopOnProfit(-100);

//                 expect(hyperSpinStore.stopOnProfit).toBe(0);
//             });

//             it("should round to 2 decimal places", () => {
//                 hyperSpinStore.setStopOnProfit(123.456789);

//                 expect(hyperSpinStore.stopOnProfit).toBe(123.46);
//             });

//             it("should handle NaN values", () => {
//                 const originalValue = hyperSpinStore.stopOnProfit;
//                 hyperSpinStore.setStopOnProfit(NaN);

//                 expect(hyperSpinStore.stopOnProfit).toBe(originalValue);
//             });

//             it("should handle non-number values", () => {
//                 const originalValue = hyperSpinStore.stopOnProfit;
//                 hyperSpinStore.setStopOnProfit("invalid" as any);

//                 expect(hyperSpinStore.stopOnProfit).toBe(originalValue);
//             });
//         });

//         describe("setStopOnLoss", () => {
//             it("should set stopOnLoss within valid range", () => {
//                 cascadingUIStore.userBalance = 1000;
//                 hyperSpinStore.setStopOnLoss(500);

//                 expect(hyperSpinStore.stopOnLoss).toBe(500);
//             });

//             it("should clamp to maximum value (user balance)", () => {
//                 cascadingUIStore.userBalance = 300;
//                 hyperSpinStore.setStopOnLoss(500);

//                 expect(hyperSpinStore.stopOnLoss).toBe(300);
//             });

//             it("should clamp to minimum value", () => {
//                 hyperSpinStore.setStopOnLoss(-100);

//                 expect(hyperSpinStore.stopOnLoss).toBe(0);
//             });

//             it("should round to 2 decimal places", () => {
//                 cascadingUIStore.userBalance = 1000;
//                 hyperSpinStore.setStopOnLoss(123.456789);

//                 expect(hyperSpinStore.stopOnLoss).toBe(123.46);
//             });

//             it("should handle NaN values", () => {
//                 const originalValue = hyperSpinStore.stopOnLoss;
//                 hyperSpinStore.setStopOnLoss(NaN);

//                 expect(hyperSpinStore.stopOnLoss).toBe(originalValue);
//             });

//             it("should handle non-number values", () => {
//                 const originalValue = hyperSpinStore.stopOnLoss;
//                 hyperSpinStore.setStopOnLoss("invalid" as any);

//                 expect(hyperSpinStore.stopOnLoss).toBe(originalValue);
//             });
//         });
//     });

//     describe("Stop condition changers", () => {
//         describe("changeStopOnProfit", () => {
//             it("should increase stopOnProfit by step value", () => {
//                 betControlStore.totalBet = 10;
//                 hyperSpinStore.stopOnProfit = 50;

//                 hyperSpinStore.changeStopOnProfit(true);

//                 expect(hyperSpinStore.stopOnProfit).toBe(60);
//             });

//             it("should decrease stopOnProfit by step value", () => {
//                 betControlStore.totalBet = 10;
//                 hyperSpinStore.stopOnProfit = 50;

//                 hyperSpinStore.changeStopOnProfit(false);

//                 expect(hyperSpinStore.stopOnProfit).toBe(40);
//             });

//             it("should respect clamping when increasing", () => {
//                 configStore.gameConfigs.maxWinPerRound = 50;
//                 betControlStore.totalBet = 10;
//                 hyperSpinStore.stopOnProfit = 490; // Close to max (500)

//                 hyperSpinStore.changeStopOnProfit(true);

//                 expect(hyperSpinStore.stopOnProfit).toBe(500); // Clamped to max
//             });

//             it("should respect clamping when decreasing", () => {
//                 hyperSpinStore.stopOnProfit = 10;

//                 hyperSpinStore.changeStopOnProfit(false);

//                 expect(hyperSpinStore.stopOnProfit).toBe(0); // Clamped to min
//             });
//         });

//         describe("changeStopOnLoss", () => {
//             it("should increase stopOnLoss by step value", () => {
//                 betControlStore.totalBet = 10;
//                 cascadingUIStore.userBalance = 1000;
//                 hyperSpinStore.stopOnLoss = 50;

//                 hyperSpinStore.changeStopOnLoss(true);

//                 expect(hyperSpinStore.stopOnLoss).toBe(60);
//             });

//             it("should decrease stopOnLoss by step value", () => {
//                 betControlStore.totalBet = 10;
//                 hyperSpinStore.stopOnLoss = 50;

//                 hyperSpinStore.changeStopOnLoss(false);

//                 expect(hyperSpinStore.stopOnLoss).toBe(40);
//             });

//             it("should respect clamping when increasing", () => {
//                 betControlStore.totalBet = 10;
//                 cascadingUIStore.userBalance = 100;
//                 hyperSpinStore.stopOnLoss = 90; // Close to max (100)

//                 hyperSpinStore.changeStopOnLoss(true);

//                 expect(hyperSpinStore.stopOnLoss).toBe(100); // Clamped to max
//             });

//             it("should respect clamping when decreasing", () => {
//                 hyperSpinStore.stopOnLoss = 10;

//                 hyperSpinStore.changeStopOnLoss(false);

//                 expect(hyperSpinStore.stopOnLoss).toBe(0); // Clamped to min
//             });
//         });
//     });

//     describe("Session tracking", () => {
//         describe("hyperSpinInitialBalance", () => {
//             it("should return the initial balance", () => {
//                 hyperSpinStore.startHyperSpinSessionTracking();
//                 expect(hyperSpinStore.hyperSpinInitialBalance).toBe(1000);
//             });

//             it("should return 0 when not initialized", () => {
//                 expect(hyperSpinStore.hyperSpinInitialBalance).toBe(0);
//             });
//         });

//         describe("startHyperSpinSessionTracking", () => {
//             it("should initialize tracking with current balance", () => {
//                 cascadingUIStore.userBalance = 500;
//                 hyperSpinStore.startHyperSpinSessionTracking();

//                 expect(hyperSpinStore.hyperSpinInitialBalance).toBe(500);
//             });

//             it("should reset profit and loss counters", () => {
//                 // Start tracking and create some profit/loss
//                 cascadingUIStore.userBalance = 1000;
//                 hyperSpinStore.startHyperSpinSessionTracking();

//                 cascadingUIStore.userBalance = 1100; // Create profit
//                 hyperSpinStore.updateHyperSpinProfitLoss();

//                 expect(hyperSpinStore.getCurrentHyperSpinProfit()).toBe(100);

//                 // Start new tracking session - should reset counters
//                 hyperSpinStore.startHyperSpinSessionTracking();

//                 expect(hyperSpinStore.getCurrentHyperSpinProfit()).toBe(0);
//                 expect(hyperSpinStore.getCurrentHyperSpinLoss()).toBe(0);
//             });

//             it("should handle undefined cascadingUIStore", () => {
//                 const freshStore = new HyperSpinStore();
//                 expect(() => freshStore.startHyperSpinSessionTracking()).not.toThrow();
//             });
//         });

//         describe("stopHyperSpinSessionTracking", () => {
//             it("should reset all tracking values", () => {
//                 // Start tracking to set initial values
//                 cascadingUIStore.userBalance = 1000;
//                 hyperSpinStore.startHyperSpinSessionTracking();

//                 // Simulate profit/loss updates
//                 cascadingUIStore.userBalance = 1200;
//                 hyperSpinStore.updateHyperSpinProfitLoss();

//                 // Verify values are set
//                 expect(hyperSpinStore.getCurrentHyperSpinProfit()).toBe(200);

//                 // Stop tracking
//                 hyperSpinStore.stopHyperSpinSessionTracking();

//                 expect(hyperSpinStore.hyperSpinInitialBalance).toBe(0);
//                 expect(hyperSpinStore.getCurrentHyperSpinProfit()).toBe(0);
//                 expect(hyperSpinStore.getCurrentHyperSpinLoss()).toBe(0);
//             });
//         });

//         describe("updateHyperSpinProfitLoss", () => {
//             it("should calculate profit when balance increases", () => {
//                 cascadingUIStore.userBalance = 1000;
//                 hyperSpinStore.startHyperSpinSessionTracking();

//                 cascadingUIStore.userBalance = 1200;
//                 hyperSpinStore.updateHyperSpinProfitLoss();

//                 expect(hyperSpinStore.getCurrentHyperSpinProfit()).toBe(200);
//                 expect(hyperSpinStore.getCurrentHyperSpinLoss()).toBe(0);
//             });

//             it("should calculate loss when balance decreases", () => {
//                 cascadingUIStore.userBalance = 1000;
//                 hyperSpinStore.startHyperSpinSessionTracking();

//                 cascadingUIStore.userBalance = 800;
//                 hyperSpinStore.updateHyperSpinProfitLoss();

//                 expect(hyperSpinStore.getCurrentHyperSpinProfit()).toBe(0);
//                 expect(hyperSpinStore.getCurrentHyperSpinLoss()).toBe(200);
//             });

//             it("should handle no change in balance", () => {
//                 cascadingUIStore.userBalance = 1000;
//                 hyperSpinStore.startHyperSpinSessionTracking();

//                 cascadingUIStore.userBalance = 1000;
//                 hyperSpinStore.updateHyperSpinProfitLoss();

//                 expect(hyperSpinStore.getCurrentHyperSpinProfit()).toBe(0);
//                 expect(hyperSpinStore.getCurrentHyperSpinLoss()).toBe(0);
//             });

//             it("should not update when tracking not initialized", () => {
//                 // Don't start tracking
//                 cascadingUIStore.userBalance = 1200;
//                 hyperSpinStore.updateHyperSpinProfitLoss();

//                 expect(hyperSpinStore.getCurrentHyperSpinProfit()).toBe(0);
//                 expect(hyperSpinStore.getCurrentHyperSpinLoss()).toBe(0);
//             });

//             it("should handle undefined cascadingUIStore", () => {
//                 const freshStore = new HyperSpinStore();

//                 expect(() => freshStore.updateHyperSpinProfitLoss()).not.toThrow();
//             });
//         });

//         describe("getCurrentHyperSpinProfit", () => {
//             it("should return current profit value", () => {
//                 // Start with initial balance
//                 cascadingUIStore.userBalance = 1000;
//                 hyperSpinStore.startHyperSpinSessionTracking();

//                 // Create profit scenario
//                 cascadingUIStore.userBalance = 1150;
//                 hyperSpinStore.updateHyperSpinProfitLoss();

//                 expect(hyperSpinStore.getCurrentHyperSpinProfit()).toBe(150);
//             });

//             it("should return 0 when no profit", () => {
//                 cascadingUIStore.userBalance = 1000;
//                 hyperSpinStore.startHyperSpinSessionTracking();

//                 expect(hyperSpinStore.getCurrentHyperSpinProfit()).toBe(0);
//             });
//         });

//         describe("getCurrentHyperSpinLoss", () => {
//             it("should return current loss value", () => {
//                 // Start with initial balance
//                 cascadingUIStore.userBalance = 1000;
//                 hyperSpinStore.startHyperSpinSessionTracking();

//                 // Create loss scenario
//                 cascadingUIStore.userBalance = 925;
//                 hyperSpinStore.updateHyperSpinProfitLoss();

//                 expect(hyperSpinStore.getCurrentHyperSpinLoss()).toBe(75);
//             });

//             it("should return 0 when no loss", () => {
//                 cascadingUIStore.userBalance = 1000;
//                 hyperSpinStore.startHyperSpinSessionTracking();

//                 expect(hyperSpinStore.getCurrentHyperSpinLoss()).toBe(0);
//             });
//         });
//     });

//     describe("Hyper-spin state management", () => {
//         describe("setHyperSpinActive", () => {
//             it("should set isHyperSpin and update UI store", () => {
//                 hyperSpinStore.setHyperSpinActive(true);

//                 expect(hyperSpinStore.isHyperSpin).toBe(true);
//                 expect(hyperSpinStore.isHyperSpinActive).toBe(true);
//                 expect(cascadingUIStore.isHyperSpinActive).toBe(true);
//             });

//             it("should deactivate hyper spin", () => {
//                 hyperSpinStore.setHyperSpinActive(false);

//                 expect(hyperSpinStore.isHyperSpin).toBe(false);
//                 expect(hyperSpinStore.isHyperSpinActive).toBe(false);
//                 expect(cascadingUIStore.isHyperSpinActive).toBe(false);
//             });

//             it("should handle undefined cascadingUIStore", () => {
//                 const freshStore = new HyperSpinStore();
//                 expect(() => freshStore.setHyperSpinActive(true)).not.toThrow();
//             });
//         });

//         describe("isHyperSpinActive", () => {
//             it("should return isHyperSpin value", () => {
//                 hyperSpinStore.isHyperSpin = true;
//                 expect(hyperSpinStore.isHyperSpinActive).toBe(true);

//                 hyperSpinStore.isHyperSpin = false;
//                 expect(hyperSpinStore.isHyperSpinActive).toBe(false);
//             });
//         });
//     });

//     describe("Batch data management", () => {
//         describe("currentBatchData", () => {
//             it("should return current batch data", () => {
//                 hyperSpinStore.initializeHyperSpinBatch();

//                 expect(hyperSpinStore.currentBatchData).not.toBe(null);
//                 expect(hyperSpinStore.currentBatchData?.summary.totalBet).toBe("0.00");
//             });

//             it("should return null when no batch data", () => {
//                 hyperSpinStore.clearBatchData();
//                 expect(hyperSpinStore.currentBatchData).toBe(null);
//             });
//         });

//         describe("spinsLength", () => {
//             it("should return length of spins array", () => {
//                 hyperSpinStore.initializeHyperSpinBatch();

//                 // Add some spins to test
//                 const mockSpinData = {
//                     spinId: 1,
//                     isFreeSpin: false,
//                     spinWinAmount: "50.00",
//                     spinWinAmountRaw: 50,
//                     spinWinMultiplier: "5.00x",
//                     spinWinMultiplierRaw: 5,
//                     winTag: null,
//                     spinBalance: "1050.00",
//                     spinBalanceRaw: 1050,
//                     stake: 10
//                 };

//                 hyperSpinStore.addSpinToBatch(mockSpinData);
//                 hyperSpinStore.addSpinToBatch({ ...mockSpinData, spinId: 2 });
//                 hyperSpinStore.addSpinToBatch({ ...mockSpinData, spinId: 3 });

//                 expect(hyperSpinStore.spinsLength).toBe(3);
//             });

//             it("should return 0 when no batch data", () => {
//                 hyperSpinStore.clearBatchData();
//                 expect(hyperSpinStore.spinsLength).toBe(0);
//             });

//             it("should return 0 when spins array is empty", () => {
//                 hyperSpinStore.initializeHyperSpinBatch();
//                 expect(hyperSpinStore.spinsLength).toBe(0);
//             });
//         });

//         describe("initializeHyperSpinBatch", () => {
//             it("should initialize batch data with correct starting values", () => {
//                 cascadingUIStore.userBalance = 500;

//                 hyperSpinStore.initializeHyperSpinBatch();

//                 expect(hyperSpinStore.currentBatchData).not.toBe(null);
//                 expect(hyperSpinStore.currentBatchData?.summary.totalBet).toBe("0.00");
//                 expect(hyperSpinStore.currentBatchData?.summary.totalBetRaw).toBe(0);
//                 expect(hyperSpinStore.currentBatchData?.summary.hyperSpinStatus).toBe("Ready");
//                 expect(hyperSpinStore.currentBatchData?.summary.totalWin).toBe("0.00");
//                 expect(hyperSpinStore.currentBatchData?.summary.totalWinRaw).toBe(0);
//                 expect(hyperSpinStore.currentBatchData?.summary.startingBalance).toBe("500.00");
//                 expect(hyperSpinStore.currentBatchData?.summary.startingBalanceRaw).toBe(500);
//                 expect(hyperSpinStore.currentBatchData?.summary.endBalance).toBe("0.00");
//                 expect(hyperSpinStore.currentBatchData?.summary.endBalanceRaw).toBe(0);
//                 expect(hyperSpinStore.currentBatchData?.spins).toEqual([]);
//             });

//             it("should reset counters", () => {
//                 // Increment counters first
//                 hyperSpinStore.getNextHyperSpinId(); // 1
//                 hyperSpinStore.getNextHyperSpinId(); // 2
//                 hyperSpinStore.getNextFreeSpinId(); // 1
//                 hyperSpinStore.getNextFreeSpinId(); // 2
//                 hyperSpinStore.getNextFreeSpinId(); // 3

//                 // Verify they are incremented
//                 expect(hyperSpinStore.getNextHyperSpinId()).toBe(3);
//                 expect(hyperSpinStore.getNextFreeSpinId()).toBe(4);

//                 // Initialize batch should reset counters
//                 hyperSpinStore.initializeHyperSpinBatch();

//                 // Should start from 1 again
//                 expect(hyperSpinStore.getNextHyperSpinId()).toBe(1);
//                 expect(hyperSpinStore.getNextFreeSpinId()).toBe(1);
//             });

//             it("should handle undefined cascadingUIStore", () => {
//                 const freshStore = new HyperSpinStore();
//                 expect(() => freshStore.initializeHyperSpinBatch()).not.toThrow();
//             });
//         });

//         describe("startHyperSpinBatch", () => {
//             it("should initialize batch if not exists and set status to Playing", () => {
//                 hyperSpinStore.clearBatchData();

//                 hyperSpinStore.startHyperSpinBatch();

//                 expect(hyperSpinStore.currentBatchData).not.toBe(null);
//                 expect(hyperSpinStore.currentBatchData?.summary.hyperSpinStatus).toBe("Playing");
//             });

//             it("should set existing batch status to Playing", () => {
//                 hyperSpinStore.initializeHyperSpinBatch();
//                 hyperSpinStore.pauseHyperSpinBatch();

//                 hyperSpinStore.startHyperSpinBatch();

//                 expect(hyperSpinStore.currentBatchData?.summary.hyperSpinStatus).toBe("Playing");
//             });
//         });

//         describe("pauseHyperSpinBatch", () => {
//             it("should set batch status to Paused", () => {
//                 hyperSpinStore.initializeHyperSpinBatch();

//                 hyperSpinStore.pauseHyperSpinBatch();

//                 expect(hyperSpinStore.currentBatchData?.summary.hyperSpinStatus).toBe("Paused");
//             });

//             it("should handle no current batch", () => {
//                 hyperSpinStore.clearBatchData();

//                 expect(() => hyperSpinStore.pauseHyperSpinBatch()).not.toThrow();
//             });
//         });

//         describe("resumeHyperSpinBatch", () => {
//             it("should set batch status to Playing", () => {
//                 hyperSpinStore.initializeHyperSpinBatch();
//                 hyperSpinStore.pauseHyperSpinBatch();

//                 hyperSpinStore.resumeHyperSpinBatch();

//                 expect(hyperSpinStore.currentBatchData?.summary.hyperSpinStatus).toBe("Playing");
//             });
//         });

//         describe("completeHyperSpinBatch", () => {
//             it("should set status to Ready and update end balance", () => {
//                 hyperSpinStore.initializeHyperSpinBatch();
//                 cascadingUIStore.userBalance = 750;

//                 hyperSpinStore.completeHyperSpinBatch();

//                 expect(hyperSpinStore.currentBatchData?.summary.hyperSpinStatus).toBe("Ready");
//                 expect(hyperSpinStore.currentBatchData?.summary.endBalance).toBe("750.00");
//                 expect(hyperSpinStore.currentBatchData?.summary.endBalanceRaw).toBe(750);
//             });

//             it("should handle undefined cascadingUIStore", () => {
//                 hyperSpinStore.initializeHyperSpinBatch();
//                 const freshStore = new HyperSpinStore();

//                 expect(() => freshStore.completeHyperSpinBatch()).not.toThrow();
//             });
//         });

//         describe("addSpinToBatch", () => {
//             const mockSpinData = {
//                 spinId: 1,
//                 isFreeSpin: false,
//                 spinWinAmount: "50.00",
//                 spinWinAmountRaw: 50,
//                 spinWinMultiplier: "5.00x",
//                 spinWinMultiplierRaw: 5,
//                 winTag: "Bronze" as const,
//                 spinBalance: "1050.00",
//                 spinBalanceRaw: 1050,
//                 stake: 10
//             };

//             it("should initialize batch if not exists", () => {
//                 hyperSpinStore.clearBatchData();

//                 hyperSpinStore.addSpinToBatch(mockSpinData);

//                 expect(hyperSpinStore.currentBatchData).not.toBe(null);
//                 expect(hyperSpinStore.spinsLength).toBe(1);
//             });

//             it("should add spin data and update totals", () => {
//                 hyperSpinStore.initializeHyperSpinBatch();

//                 hyperSpinStore.addSpinToBatch(mockSpinData);

//                 expect(hyperSpinStore.spinsLength).toBe(1);
//                 expect(hyperSpinStore.currentBatchData?.spins[0]).toStrictEqual(mockSpinData);
//                 expect(hyperSpinStore.currentBatchData?.summary.totalBetRaw).toBe(10);
//                 expect(hyperSpinStore.currentBatchData?.summary.totalBet).toBe("10.00");
//                 expect(hyperSpinStore.currentBatchData?.summary.totalWinRaw).toBe(50);
//                 expect(hyperSpinStore.currentBatchData?.summary.totalWin).toBe("50.00");
//             });

//             it("should accumulate multiple spins", () => {
//                 hyperSpinStore.initializeHyperSpinBatch();

//                 hyperSpinStore.addSpinToBatch(mockSpinData);
//                 hyperSpinStore.addSpinToBatch({ ...mockSpinData, spinId: 2, stake: 15, spinWinAmountRaw: 75 });

//                 expect(hyperSpinStore.spinsLength).toBe(2);
//                 expect(hyperSpinStore.currentBatchData?.summary.totalBetRaw).toBe(25);
//                 expect(hyperSpinStore.currentBatchData?.summary.totalBet).toBe("25.00");
//                 expect(hyperSpinStore.currentBatchData?.summary.totalWinRaw).toBe(125);
//                 expect(hyperSpinStore.currentBatchData?.summary.totalWin).toBe("125.00");
//             });
//         });

//         describe("resetBatchCounters", () => {
//             it("should reset all counters to 0", () => {
//                 // Increment counters to test reset
//                 hyperSpinStore.getNextHyperSpinId(); // 1
//                 hyperSpinStore.getNextHyperSpinId(); // 2
//                 hyperSpinStore.getNextFreeSpinId(); // 1
//                 hyperSpinStore.getNextFreeSpinId(); // 2
//                 hyperSpinStore.getNextFreeSpinId(); // 3

//                 expect(hyperSpinStore.getNextHyperSpinId()).toBe(3); // Should be 3 now

//                 hyperSpinStore.resetBatchCounters();

//                 expect(hyperSpinStore.getNextHyperSpinId()).toBe(1); // Should start from 1 again
//                 expect(hyperSpinStore.getNextFreeSpinId()).toBe(1); // Should start from 1 again
//             });
//         });

//         describe("clearBatchData", () => {
//             it("should set batch data to null and reset counters", () => {
//                 hyperSpinStore.initializeHyperSpinBatch();
//                 hyperSpinStore.getNextHyperSpinId(); // 1
//                 hyperSpinStore.getNextFreeSpinId(); // 1

//                 hyperSpinStore.clearBatchData();

//                 expect(hyperSpinStore.currentBatchData).toBe(null);
//                 expect(hyperSpinStore.getNextHyperSpinId()).toBe(1); // Should start from 1 again
//                 expect(hyperSpinStore.getNextFreeSpinId()).toBe(1); // Should start from 1 again
//             });
//         });

//         describe("recoverInterruptedBatch", () => {
//             it("should recover interrupted batch and activate hyper spin", () => {
//                 hyperSpinStore.initializeHyperSpinBatch();
//                 hyperSpinStore.pauseHyperSpinBatch();

//                 // Simulate interruption by manually setting status
//                 // (In real scenario this would be set externally)
//                 if (hyperSpinStore.currentBatchData) {
//                     hyperSpinStore.currentBatchData.summary.hyperSpinStatus = "Interrupted";
//                 }

//                 const result = hyperSpinStore.recoverInterruptedBatch();

//                 expect(result).toBe(true);
//                 expect(hyperSpinStore.currentBatchData?.summary.hyperSpinStatus).toBe("Playing");
//                 expect(hyperSpinStore.isHyperSpin).toBe(true);
//             });

//             it("should return false when no batch exists", () => {
//                 hyperSpinStore.clearBatchData();

//                 const result = hyperSpinStore.recoverInterruptedBatch();

//                 expect(result).toBe(false);
//             });

//             it("should return false when batch is not interrupted", () => {
//                 hyperSpinStore.initializeHyperSpinBatch();

//                 const result = hyperSpinStore.recoverInterruptedBatch();

//                 expect(result).toBe(false);
//             });
//         });
//     });

//     describe("Counter methods", () => {
//         describe("getNextHyperSpinId", () => {
//             it("should increment and return hyper spin counter", () => {
//                 expect(hyperSpinStore.getNextHyperSpinId()).toBe(1);
//                 expect(hyperSpinStore.getNextHyperSpinId()).toBe(2);
//                 expect(hyperSpinStore.getNextHyperSpinId()).toBe(3);
//             });
//         });

//         describe("getNextFreeSpinId", () => {
//             it("should increment and return free spin counter", () => {
//                 expect(hyperSpinStore.getNextFreeSpinId()).toBe(1);
//                 expect(hyperSpinStore.getNextFreeSpinId()).toBe(2);
//                 expect(hyperSpinStore.getNextFreeSpinId()).toBe(3);
//             });
//         });
//     });

//     describe("Utility methods", () => {
//         describe("determineWinTag", () => {
//             it("should return Amethyst for max win", () => {
//                 expect(hyperSpinStore.determineWinTag(1000, 10, false, false, false, true)).toBe("Amethyst");
//             });

//             it("should return Gold for mega win", () => {
//                 expect(hyperSpinStore.determineWinTag(500, 10, false, true, false, false)).toBe("Gold");
//             });

//             it("should return Silver for super win", () => {
//                 expect(hyperSpinStore.determineWinTag(200, 10, false, false, true, false)).toBe("Silver");
//             });

//             it("should return Bronze for big win", () => {
//                 expect(hyperSpinStore.determineWinTag(100, 10, true, false, false, false)).toBe("Bronze");
//             });

//             it("should return null for regular wins", () => {
//                 expect(hyperSpinStore.determineWinTag(50, 10, false, false, false, false)).toBe(null);
//             });

//             it("should prioritize max win over other win types", () => {
//                 expect(hyperSpinStore.determineWinTag(1000, 10, true, true, true, true)).toBe("Amethyst");
//             });

//             it("should prioritize mega win over super and big wins", () => {
//                 expect(hyperSpinStore.determineWinTag(500, 10, true, true, true, false)).toBe("Gold");
//             });

//             it("should prioritize super win over big win", () => {
//                 expect(hyperSpinStore.determineWinTag(200, 10, true, false, true, false)).toBe("Silver");
//             });
//         });

//         describe("formatNumber and formatMultiplier integration", () => {
//             it("should format numbers correctly in batch data", () => {
//                 hyperSpinStore.initializeHyperSpinBatch();

//                 const mockSpinData = {
//                     spinId: 1,
//                     isFreeSpin: false,
//                     spinWinAmount: "0.00",
//                     spinWinAmountRaw: 0,
//                     spinWinMultiplier: "0.00x",
//                     spinWinMultiplierRaw: 0,
//                     winTag: null,
//                     spinBalance: "1000.00",
//                     spinBalanceRaw: 1000,
//                     stake: 10
//                 };

//                 hyperSpinStore.addSpinToBatch(mockSpinData);

//                 // Check that the summary uses proper formatting
//                 expect(hyperSpinStore.currentBatchData?.summary.totalBet).toMatch(/^\d+\.\d{2}$/);
//                 expect(hyperSpinStore.currentBatchData?.summary.totalWin).toMatch(/^\d+\.\d{2}$/);
//             });
//         });
//     });

//     describe("syncCurrentTotalBetIndex", () => {
//         it("should find correct index for existing total bet", () => {
//             hyperSpinStore.syncCurrentTotalBetIndex(20);

//             expect(hyperSpinStore.currentTotalBetIndex).toBe(2);
//         });

//         it("should set index to -1 for non-existing total bet", () => {
//             hyperSpinStore.syncCurrentTotalBetIndex(999);

//             expect(hyperSpinStore.currentTotalBetIndex).toBe(-1);
//         });

//         it("should handle first total bet", () => {
//             hyperSpinStore.syncCurrentTotalBetIndex(5);

//             expect(hyperSpinStore.currentTotalBetIndex).toBe(0);
//         });

//         it("should handle last total bet", () => {
//             hyperSpinStore.syncCurrentTotalBetIndex(100);

//             expect(hyperSpinStore.currentTotalBetIndex).toBe(4);
//         });

//         it("should handle undefined betControlStore", () => {
//             const freshStore = new HyperSpinStore();

//             expect(() => freshStore.syncCurrentTotalBetIndex(10)).not.toThrow();
//         });
//     });

//     describe("MobX reactions", () => {
//         it("should clamp stop conditions when total bet changes", () => {
//             // Set up initial state
//             configStore.gameConfigs.maxWinPerRound = 50;
//             betControlStore.totalBet = 10;
//             hyperSpinStore.setStopOnProfit(500); // At max
//             hyperSpinStore.setStopOnLoss(500);

//             // Change total bet
//             betControlStore.totalBet = 5; // New max profit = 250

//             // Trigger reaction (in real app this happens automatically)
//             // For testing, we manually call the reaction logic
//             if (configStore.gameConfigs?.maxWinPerRound && hyperSpinStore.stopOnProfit > hyperSpinStore.maxStopOnProfit) {
//                 hyperSpinStore.setStopOnProfit(hyperSpinStore.maxStopOnProfit);
//             }

//             expect(hyperSpinStore.stopOnProfit).toBe(250); // Should be clamped to new max
//         });

//         it("should clamp stop on loss when user balance changes", () => {
//             cascadingUIStore.userBalance = 1000;
//             hyperSpinStore.setStopOnLoss(800);

//             // Change user balance
//             cascadingUIStore.userBalance = 300;

//             // Trigger reaction logic
//             if (cascadingUIStore.userBalance > 0 && hyperSpinStore.stopOnLoss > hyperSpinStore.maxStopOnLoss) {
//                 hyperSpinStore.setStopOnLoss(hyperSpinStore.maxStopOnLoss);
//             }

//             expect(hyperSpinStore.stopOnLoss).toBe(300); // Should be clamped to new balance
//         });

//         it("should handle edge case when max values decrease and stop values are at old max", () => {
//             // This tests the clamping logic when user balance changes
//             cascadingUIStore.userBalance = 1000;
//             hyperSpinStore.setStopOnLoss(990); // Close to max

//             // Decrease max
//             cascadingUIStore.userBalance = 500;

//             // The reaction should clamp the value, but since we can't trigger reactions directly,
//             // we test the clamping logic by calling setStopOnLoss with a high value
//             hyperSpinStore.setStopOnLoss(990);

//             expect(hyperSpinStore.stopOnLoss).toBe(500); // Should be clamped to new max
//         });
//     });

//     describe("Error handling and edge cases", () => {
//         it("should handle undefined stores gracefully", () => {
//             const freshStore = new HyperSpinStore();

//             expect(() => {
//                 freshStore.setHyperSpinActive(true);
//                 freshStore.startHyperSpinSessionTracking();
//                 freshStore.updateHyperSpinProfitLoss();
//                 freshStore.initializeHyperSpinBatch();
//                 freshStore.completeHyperSpinBatch();
//                 freshStore.syncCurrentTotalBetIndex(10);
//             }).not.toThrow();
//         });

//         it("should handle invalid input types", () => {
//             // Test with invalid inputs
//             hyperSpinStore.setStopOnProfit("invalid" as any);
//             hyperSpinStore.setStopOnLoss(null as any);

//             expect(hyperSpinStore.stopOnProfit).toBe(0); // Should not change
//             expect(hyperSpinStore.stopOnLoss).toBe(0); // Should not change

//             // Test addSpinToBatch with invalid data - should not crash but handle gracefully
//             hyperSpinStore.initializeHyperSpinBatch();
//             expect(() => {
//                 hyperSpinStore.addSpinToBatch({} as any); // Empty object should not crash
//             }).not.toThrow();
//         });

//         it("should handle extreme values", () => {
//             hyperSpinStore.setStopOnProfit(Infinity);
//             hyperSpinStore.setStopOnLoss(-Infinity);

//             // Test that extreme values are clamped properly
//             expect(hyperSpinStore.stopOnProfit).toBe(hyperSpinStore.maxStopOnProfit);
//             expect(hyperSpinStore.stopOnLoss).toBe(hyperSpinStore.minStopOnLoss);
//         });

//         it("should handle concurrent operations", () => {
//             // Test multiple operations in sequence
//             hyperSpinStore.initializeHyperSpinBatch();
//             hyperSpinStore.startHyperSpinBatch();

//             for (let i = 0; i < 10; i++) {
//                 hyperSpinStore.addSpinToBatch({
//                     spinId: hyperSpinStore.getNextHyperSpinId(),
//                     isFreeSpin: false,
//                     spinWinAmount: `${i * 10}.00`,
//                     spinWinAmountRaw: i * 10,
//                     spinWinMultiplier: `${i}.00x`,
//                     spinWinMultiplierRaw: i,
//                     winTag: null,
//                     spinBalance: `${1000 + i * 10}.00`,
//                     spinBalanceRaw: 1000 + i * 10,
//                     stake: 10
//                 });
//             }

//             expect(hyperSpinStore.spinsLength).toBe(10);
//             expect(hyperSpinStore.currentBatchData?.summary.totalBetRaw).toBe(100);
//             expect(hyperSpinStore.currentBatchData?.summary.totalWinRaw).toBe(450); // 0+10+20+...+90
//         });
//     });
// });
