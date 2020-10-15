import * as fs from "fs";
import { OrderedMap, Record } from "immutable";
import { CREATE_TEMP_USER_DSS, DSS_USERS_JSON, POST_AUTHORIZATION_USER_DSS, START, SUCCESS } from "../constants";
import { mapToArr } from "../utils";

export const UsersDSSModel = Record({
  authUrl: null,
  dssUrl: null,
  id: null,
  login: null,
  isApiv2: null,
});

export const DefaultReducerState = Record({
  entities: OrderedMap({}),
  temp: OrderedMap({}),
});

export default (users = new DefaultReducerState(), action) => {
  const { type, payload } = action;

  switch (type) {
    case CREATE_TEMP_USER_DSS + START:
      users = users.setIn(["temp", payload.id], new UsersDSSModel({
        authUrl: payload.authUrl,
        dssUrl: payload.dssUrl,
        id: payload.id,
        login: payload.login,
        isApiv2: payload.isApiv2,
      }));
      break;
    case POST_AUTHORIZATION_USER_DSS + SUCCESS:
      users = users.setIn(["entities", payload.id], users.getIn(["temp", payload.id]));
      break;
  }

  if (type === POST_AUTHORIZATION_USER_DSS + SUCCESS) {
    const state = {
      users: mapToArr(users.entities),
    };

    const sstate = JSON.stringify(state, null, 4);

    if (DSS_USERS_JSON) {
      fs.writeFile(DSS_USERS_JSON, sstate, (err: any) => {
        if (err) {
          // tslint:disable-next-line:no-console
          console.log("------- error write to ", DSS_USERS_JSON);
        }
      });
    }
  }

  return users;
};
