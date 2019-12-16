import { DSS_TOKENS_JSON, POST_AUTHORIZATION_USER_DSS, SUCCESS } from "../../app/constants";
import tokens, { DefaultReducerState, TokenDSSModel } from "../../app/reducer/tokens";
import TOKEN from "../__fixtures__/tokens";

const ACTION = {
  payload: {
    access_token: TOKEN,
    expires_in: 300,
    id: "051fbf41-3bc5-8c69-9f59-a80e11a5157b",
    token_type: "Bearer",
  },
  type: POST_AUTHORIZATION_USER_DSS + SUCCESS,
};

describe("reducers", () => {
  describe("dss tokens", () => {
    it("should return the initial state", () => {
      expect(tokens(undefined, {})).toEqual(new DefaultReducerState());
    });

    it("POST_AUTHORIZATION_USER_DSS + SUCCESS", () => {
      expect(tokens(undefined, ACTION)).toEqual(new DefaultReducerState().setIn(["entities", ACTION.payload.id], new TokenDSSModel({
        access_token: ACTION.payload.access_token,
        expires_in: ACTION.payload.expires_in,
        id: ACTION.payload.id,
        token_type: ACTION.payload.token_type,
      })));
    });
  });
});
