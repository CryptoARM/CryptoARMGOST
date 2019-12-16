import { GET_POLICY_DSS, POLICY_DSS_JSON, SUCCESS } from "../../app/constants";
import policyDSS, { DefaultReducerState, PolicyDSSModel } from "../../app/reducer/policyDSS";
import { arrayToMap, mapToArr } from "../../app/utils";
import POLICY, { NORMALIZE_POLICY, UID } from "../__fixtures__/policy";

const ACTION = {
  payload: {
    id: UID,
    policy: NORMALIZE_POLICY,
  },
  type: GET_POLICY_DSS + SUCCESS,
};

describe("reducers", () => {
  describe("policy DSS", () => {
    it("should return the initial state", () => {
      expect(policyDSS(undefined, {})).toEqual(new DefaultReducerState());
    });

    it("GET_POLICY_DSS + SUCCESS", () => {
      expect(policyDSS(undefined, ACTION)).toEqual(new DefaultReducerState()
      .setIn(["entities", ACTION.payload.id], new PolicyDSSModel(ACTION.payload)));
    });
  });
});
