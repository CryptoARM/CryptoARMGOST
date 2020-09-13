import { LicenseManager } from "../constants";

const CTLICENSE_R_NO_ERROR: number = 900;
const CTLICENSE_R_ERROR_INTERNAL: number = 901;
const CTLICENSE_R_ERROR_LOAD_LICENSE: number = 902;
const CTLICENSE_R_ERROR_TOKEN_FORMAT: number = 903;
const CTLICENSE_R_ERROR_SIGN: number = 904;
const CTLICENSE_R_ERROR_PARSING: number = 905;
const CTLICENSE_R_ERROR_STUCTURE: number = 906;
const CTLICENSE_R_ERROR_PRODUCT: number = 907;
const CTLICENSE_R_ERROR_EXPIRED_TIME: number = 908;
const CTLICENSE_R_ERROR_NOT_STARTED: number = 909;
const CTLICENSE_R_ERROR_OPERATION_BLOCK: number = 910;
const CTLICENSE_R_ERROR_NO_LICENSE_IN_STORE: number = 911;
const CTLICENSE_R_ERROR_STORE_IS_LOCKED: number = 912;

export function checkLicense(key?: string): boolean {
  try {
    const res = key ? JSON.parse(LicenseManager.checkLicense(key)).verify : LicenseManager.accessOperations();
    return res;
  } catch (err) {
    return false;
  }
}

export function getErrorMessage(errCode: number): string {
  switch (errCode) {
    case CTLICENSE_R_ERROR_INTERNAL:
      return "License.jwtErrorInternal";
    case CTLICENSE_R_ERROR_LOAD_LICENSE:
      return "License.jwtErrorLoad";
    case CTLICENSE_R_ERROR_TOKEN_FORMAT:
      return "License.jwtErrorTokenFormat";
    case CTLICENSE_R_ERROR_SIGN:
      return "License.jwtErrorSign";
    case CTLICENSE_R_ERROR_PARSING:
      return "License.jwtErrorParsing";
    case CTLICENSE_R_ERROR_STUCTURE:
      return "License.jwtErrorStructure";
    case CTLICENSE_R_ERROR_PRODUCT:
      return "License.jwtErrorProduct";
    case CTLICENSE_R_ERROR_EXPIRED_TIME:
      return "License.jwtErrorExpired";
    case CTLICENSE_R_ERROR_NOT_STARTED:
      return "License.jwtErrorStarted";
    case CTLICENSE_R_ERROR_OPERATION_BLOCK:
      return "License.jwtErrorOperation";
    case CTLICENSE_R_ERROR_NO_LICENSE_IN_STORE:
      return "License.jwtErrorNoLicenseInStore";
    case CTLICENSE_R_ERROR_STORE_IS_LOCKED:
      return "License.jwtErrorStoreIsLocked";
    default:
      return "License.jwtErrorCode";
  }
}
