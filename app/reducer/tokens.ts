import * as fs from "fs";
import { OrderedMap, Record } from "immutable";
import { DSS_POST_AUTHORIZATION_USER, DSS_TOKENS_JSON, SUCCESS } from "../constants";
import { mapToArr } from "../utils";

export const TokenDSSModel = Record({
  access_token: null,
  expires_in: null,
  id: null,
  token_type: null,
});

export const DefaultReducerState = Record({
  entities: OrderedMap({}),
});

export default (tokens = new DefaultReducerState(), action) => {
  const { type, payload } = action;

  switch (type) {
    case DSS_POST_AUTHORIZATION_USER + SUCCESS:
      tokens = tokens.setIn(["entities", payload.id], new TokenDSSModel({
        access_token: payload.access_token,
        expires_in: payload.expires_in,
        id: payload.id,
        token_type: payload.token_type,
      }));
      break;
  }

  if (type === DSS_POST_AUTHORIZATION_USER + SUCCESS) {
    const state = {
      tokens: mapToArr(tokens.entities),
    };

    const sstate = JSON.stringify(state, null, 4);

    fs.writeFile(DSS_TOKENS_JSON, sstate, (err: any) => {
      if (err) {
        // tslint:disable-next-line:no-console
        console.log("------- error write to ", DSS_TOKENS_JSON);
      }
    });
  }

  return tokens;
};
