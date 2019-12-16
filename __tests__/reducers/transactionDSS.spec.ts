import { POST_TRANSACTION_DSS, START, SUCCESS } from "../../app/constants";
import transactionDSS, { DefaultReducerState, TransactionDSSModel } from "../../app/reducer/transactionDSS";
import TOKEN from "../__fixtures__/tokens";
import TRANSACTION from "../__fixtures__/transactions";

const ACTION = {
  payload: {
    id: TOKEN,
  },
  type: POST_TRANSACTION_DSS + SUCCESS,
};

describe("reducers", () => {
  describe("policy DSS", () => {
    it("should return the initial state", () => {
      expect(transactionDSS(undefined, {})).toEqual(new DefaultReducerState());
    });

    it("GET_POLICY_DSS + SUCCESS", () => {
      expect(transactionDSS(undefined, ACTION)).toEqual(new DefaultReducerState()
      .setIn(["entities", ACTION.payload.id], new TransactionDSSModel(ACTION.payload)));
    });
  });
});
