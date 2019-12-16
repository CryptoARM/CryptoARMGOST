import * as fs from "fs";
import { OrderedMap, Record } from "immutable";
import { GET_POLICY_DSS, POLICY_DSS_JSON, SUCCESS } from "../constants";
import { arrayToMap, mapToArr } from "../utils";

export const PolicyDSSModel = Record({
  id: null,
  policy: null,
});

export const DefaultReducerState = Record({
  entities: OrderedMap({}),
});

export default (policyDSS = new DefaultReducerState(), action) => {
  const { type, payload } = action;
  switch (type) {
    case GET_POLICY_DSS + SUCCESS:
      policyDSS = policyDSS
        .setIn(["entities", payload.id], new PolicyDSSModel(payload));
      break;
  }

  return policyDSS;
};
