import { IService } from "../components/Services/types";
import {
  ADD_SERVICE, CHANGE_SERVICE_NAME,
  CHANGE_SERVICE_SETTINGS, DELETE_SERVICE, SET_SERVICE_AS_DEFAULT,
} from "../constants";

export function addService(service: IService) {
  return {
    payload: {
      service,
    },
    type: ADD_SERVICE,
  };
}

export function deleteService(id: string) {
  return {
    payload: {
      id,
    },
    type: DELETE_SERVICE,
  };
}

export function changeServiceSettings(id: string, settings: any) {
  return {
    payload: {
      id,
      settings,
    },
    type: CHANGE_SERVICE_SETTINGS,
  };
}

export function changeServiceName(id: string, name: string) {
  return {
    payload: {
      id,
      name,
    },
    type: CHANGE_SERVICE_NAME,
  };
}

export function setServiceAsDefault(id: string) {
  return {
    payload: {
      id,
    },
    type: SET_SERVICE_AS_DEFAULT,
  };
}
