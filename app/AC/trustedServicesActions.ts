import { ADD_TRUSTED_SERVICE, SHOW_MODAL_ADD_TRUSTED_SERVICE } from "../constants";
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

export function showModalAddTrustedService() {
  return {
    type: SHOW_MODAL_ADD_TRUSTED_SERVICE,
  };
}
