import * as fs from "fs";

import { OrderedMap, Record } from "immutable";
import { mapToArr } from "../../app/utils";
import {
  ADD_SERVICE, CA_SERVICE_LOCAL, CHANGE_SERVICE_NAME, CHANGE_SERVICE_SETTINGS,
  DELETE_SERVICE, GET_CA_REGREQUEST, POST_CA_REGREQUEST, SERVICES_JSON, SUCCESS,
} from "../constants";

export const ServiceModel = Record({
  id: null,
  name: null,
  settings: OrderedMap({}),
  type: null,
});

export const SettingsModel = Record({
  url: null,
  template_file: null,
});

export const DefaultReducerState = Record({
  entities: OrderedMap({}),
});

export default (services = new DefaultReducerState(), action) => {
  const { type, payload } = action;

  switch (type) {
    case POST_CA_REGREQUEST + SUCCESS:
    case GET_CA_REGREQUEST + SUCCESS:
    case ADD_SERVICE:
      services = services.setIn(["entities", payload.service.id], new ServiceModel(payload.service));
      if (payload.settings) {
        services = services.setIn(["entities", payload.service.id, "settings"], new SettingsModel(payload.settings));
      }
      break;

    case DELETE_SERVICE:
      const service = services.getIn(["entities", payload.id]);

      if (service && service.type === CA_SERVICE_LOCAL && service.settings) {
        try {
          fs.unlinkSync(service.settings.template_file);
        } catch (e) {
          //
        }
      }

      services = services
        .deleteIn(["entities", payload.id]);
      break;

    case CHANGE_SERVICE_SETTINGS:
      services = services.setIn(["entities", payload.id, "settings"], new SettingsModel(payload.settings));
      break;

    case CHANGE_SERVICE_NAME:
      services = services.setIn(["entities", payload.id, "name"], payload.name);
      break;
  }

  if (type === ADD_SERVICE || type === DELETE_SERVICE ||
    type === CHANGE_SERVICE_SETTINGS || type === CHANGE_SERVICE_NAME ||
    type === POST_CA_REGREQUEST + SUCCESS || type === GET_CA_REGREQUEST + SUCCESS) {

    const state = {
      services: mapToArr(services.entities),
    };

    const sstate = JSON.stringify(state, null, 4);

    fs.writeFile(SERVICES_JSON, sstate, (err: any) => {
      if (err) {
        // tslint:disable-next-line:no-console
        console.log("------- error write to ", SERVICES_JSON);
      }
    });
  }

  return services;
};
