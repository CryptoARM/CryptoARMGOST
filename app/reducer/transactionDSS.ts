import * as fs from "fs";
import { OrderedMap, Record } from "immutable";
import { POST_TRANSACTION_DSS, START, SUCCESS } from "../constants";

export const TransactionDSSModel = Record({
  fileId: null,
  id: null,
});

export const DefaultReducerState = Record({
  entities: OrderedMap({}),
});

export default (transactionDSS = new DefaultReducerState(), action) => {
  const { type, payload } = action;
  switch (type) {
    case POST_TRANSACTION_DSS + SUCCESS:
      transactionDSS = transactionDSS
        .setIn(["entities", payload.id], new TransactionDSSModel(payload));
      break;
  }
  return transactionDSS;
};
