import * as fs from "fs";
import { OrderedMap, Record } from "immutable";
import {
  ADD_TRUSTED_SERVICE, DELETE_TRUSTED_SERVICE, HIDE_MODAL_ADD_TRUSTED_SERVICE, SHOW_MODAL_ADD_TRUSTED_SERVICE, TRUSTED_SERVICES_JSON, VERIFY_CERTIFICATE_FOR_TRUSTED_SERVICE,
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

    case VERIFY_CERTIFICATE_FOR_TRUSTED_SERVICE:
      return trustedServices.setIn(["entities", payload.url, "cert", "status"], payload.certificateStatus)
      .setIn(["entities", payload.url, "cert", "verified"], true);
  }

  if (type === ADD_TRUSTED_SERVICE || type === DELETE_TRUSTED_SERVICE) {
    const tempTrustedServices = trustedServices.entities.map((value) => {
      return value
      .setIn(["cert", "verified"], false)
      .setIn(["cert", "status"], false);
    });

    const state = {
      trustedServices: tempTrustedServices,
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
