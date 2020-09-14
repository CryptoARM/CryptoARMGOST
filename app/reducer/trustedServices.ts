import * as fs from "fs";
import { OrderedMap, Record } from "immutable";
import {
  ADD_TRUSTED_SERVICE, DELETE_TRUSTED_SERVICE, HIDE_MODAL_ADD_TRUSTED_SERVICE, SHOW_MODAL_ADD_TRUSTED_SERVICE, TRUSTED_SERVICES_JSON,
} from "../constants";
import { CertificateModel } from "./certificates";

export const TrustedServiceModel = Record({
  cert: CertificateModel,
  url: null,
});

export const DefaultReducerState = Record({
  cert: undefined,
  entities: OrderedMap({}),
  showModal: false,
  urlToCheck: "",
});

export default (trustedServices = new DefaultReducerState(), action) => {
  const { type, payload } = action;
  switch (type) {
    case ADD_TRUSTED_SERVICE:
      trustedServices = trustedServices.setIn(["entities", payload.service], new TrustedServiceModel({
        cert: new CertificateModel(payload.certificate),
        url: payload.service,
      }));
      break;

      case DELETE_TRUSTED_SERVICE:
        trustedServices = trustedServices.deleteIn(["entities", payload.url]);
        break;

    case SHOW_MODAL_ADD_TRUSTED_SERVICE:
      return trustedServices.set("showModal", true)
        .set("urlToCheck", payload.urlToCheck)
        .set("cert", payload.cert);

    case HIDE_MODAL_ADD_TRUSTED_SERVICE:
      return trustedServices.set("showModal", false)
        .set("urlToCheck", "");
  }

  if (type === ADD_TRUSTED_SERVICE || type === DELETE_TRUSTED_SERVICE) {
    const state = {
      trustedServices: trustedServices.entities,
    };

    const sstate = JSON.stringify(state, null, 4);

    fs.writeFile(TRUSTED_SERVICES_JSON, sstate, (err: any) => {
      if (err) {
        // tslint:disable-next-line:no-console
        console.log("------- error write to ", TRUSTED_SERVICES_JSON);
      }
    });
  }

  return trustedServices;
};
