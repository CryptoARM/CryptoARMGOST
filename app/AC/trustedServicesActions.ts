import { ADD_TRUSTED_SERVICE, HIDE_MODAL_ADD_TRUSTED_SERVICE, SHOW_MODAL_ADD_TRUSTED_SERVICE } from "../constants";
import { uuid } from "../utils";

export function addTrustedService(service: string, cert: string) {
  return {
    payload: {
      certificate: cert,
      id: uuid(),
      service,
    },
    type: ADD_TRUSTED_SERVICE,
  };
}

export function showModalAddTrustedService(
  serviceUrl: string,
  cert?: trusted.pki.Certificate,
) {
  return {
    payload: {
      cert,
      urlToCheck: serviceUrl,
    },
    type: SHOW_MODAL_ADD_TRUSTED_SERVICE,
  };
}

export function hideModalAddTrustedService() {
  return {
    type: HIDE_MODAL_ADD_TRUSTED_SERVICE,
  };
}
