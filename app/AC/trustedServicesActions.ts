import { ADD_TRUSTED_SERVICE, HIDE_MODAL_ADD_TRUSTED_SERVICE, SHOW_MODAL_ADD_TRUSTED_SERVICE } from "../constants";
import { uuid } from "../utils";

export function addTrustedService(service: string) {
  return {
    payload: {
      id: uuid(),
      service,
    },
    type: ADD_TRUSTED_SERVICE,
  };
}

export function showModalAddTrustedService(
  serviceUrl: string,
  cert: trusted.pki.Certificate | undefined  = undefined
  ) {
  return {
    payload: {
      urlToCheck: serviceUrl,
      cert
    },
    type: SHOW_MODAL_ADD_TRUSTED_SERVICE,
  };
}

export function hideModalAddTrustedService() {
  return {
    type: HIDE_MODAL_ADD_TRUSTED_SERVICE,
  };
}
