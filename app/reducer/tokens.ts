import * as fs from "fs";
import { OrderedMap, Record } from "immutable";
import { DSS_TOKENS_JSON, POST_AUTHORIZATION_USER_DSS, SUCCESS, POST_OPERATION_CONFIRMATION } from "../constants";
import { mapToArr } from "../utils";

export const TokenDSSModel = Record({
  access_token: null,
  expires_in: null,
  id: null,
  time: null,
  token_type: null,
});

export const DefaultReducerState = Record({
  tokensAuth: OrderedMap({}),
  tokensDss: OrderedMap({}),
});

export default (tokens = new DefaultReducerState(), action) => {
  const { type, payload } = action;

  switch (type) {
    case POST_AUTHORIZATION_USER_DSS + SUCCESS:
      tokens = tokens.setIn(["tokensAuth", payload.id], new TokenDSSModel({
        access_token: payload.access_token,
        expires_in: payload.expires_in,
        id: payload.id,
        time: new Date().getTime(),
        token_type: payload.token_type,
      }));
      break;
    case POST_OPERATION_CONFIRMATION + SUCCESS:
      tokens = tokens.setIn(["tokensDss", payload.id], new TokenDSSModel({
        access_token: payload.access_token,
        expires_in: payload.expires_in,
        id: payload.id,
        time: new Date().getTime(),
        token_type: payload.token_type,
      }));
      break;
  }
  return tokens;
};
