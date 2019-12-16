import { OrderedMap, Record } from "immutable";
import {
  FAIL, POST_AUTHORIZATION_USER_DSS, POST_OPERATION_CONFIRMATION,
  RESPONSE, START, SUCCESS,
} from "../constants";

const ResponseModel = Record({
  Headerfield: [],
  Image: "",
  Label: "",
  RefID: "",
  Title: "",
  id: null,
});

const DefaultReducerState = Record({
  entities: OrderedMap({}),
});

export default (responses = new DefaultReducerState(), action) => {
  const { type, payload } = action;

  switch (type) {
    case POST_AUTHORIZATION_USER_DSS + START:
      return new DefaultReducerState();

    case POST_OPERATION_CONFIRMATION + RESPONSE:
    case POST_AUTHORIZATION_USER_DSS + RESPONSE:
      return responses.setIn(["entities", payload.RefID], new ResponseModel({
        Headerfield: payload.Headerfield.slice(),
        Image: payload.Image,
        Label: payload.Label,
        RefID: payload.RefID,
        Title: payload.Title,
        id: payload.RefID,
      }));

    case POST_OPERATION_CONFIRMATION + RESPONSE + SUCCESS:
    case POST_OPERATION_CONFIRMATION + RESPONSE + FAIL:
    case POST_AUTHORIZATION_USER_DSS + RESPONSE + SUCCESS:
    case POST_AUTHORIZATION_USER_DSS + RESPONSE + FAIL:
      if (payload && payload.RefID) {
        return responses.deleteIn(["entities", payload.RefID]);
      }
  }

  return responses;
};
