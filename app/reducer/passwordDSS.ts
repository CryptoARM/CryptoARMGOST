import { OrderedMap, Record } from "immutable";
import { DELETE_PASSWORD_DSS, REMEMBER_PASSWORD_DSS } from "../constants";

export const PasswordDSSModel = Record({
  id: null,
  password: null,
});

export const DefaultReducerState = Record({
  entities: OrderedMap({}),
});

export default (passwordDSS = new DefaultReducerState(), action) => {
  const { type, payload } = action;
  switch (type) {
    case REMEMBER_PASSWORD_DSS:
      passwordDSS = passwordDSS.setIn(["entities", payload.id], new PasswordDSSModel(payload));
      break;

    case DELETE_PASSWORD_DSS:
      return passwordDSS.deleteIn(["entities", payload.id]);
  }

  return passwordDSS;
};
