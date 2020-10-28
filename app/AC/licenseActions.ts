import * as fs from "fs";
import os from "os";
import {
  DELETE_ALL_TEMPORY_LICENSES, FAIL, LICENSE_PATH, LICENSE_REGISTRY_PATH,
  LicenseManager, LOAD_LICENSE, START, SUCCESS, VERIFY_LICENSE,
} from "../constants";
import { checkLicense } from "../trusted/jwt";
import { toBase64 } from "../utils";

export function deleteAllTemporyLicenses() {
  return (dispatch: (action: {}) => void, getState: () => any) => {
    const state = getState();
    const { connections } = state;
    const licenses = connections.get("licenses");

    licenses.forEach((license) => {
      if (license && license.license) {
        try {
          LicenseManager.deleteLicense(license.license);
        } catch (e) {
          console.log("error", e);
        }
      }
    });

    dispatch({
      type: DELETE_ALL_TEMPORY_LICENSES,
    });
  };
}

export function verifyLicense(license?: string) {
  const licenseStatus = checkLicense(license);

  return {
    payload: { licenseStatus },
    type: VERIFY_LICENSE,
  };
}

function readRegistryLicense(): string {
  const { execSync } = require("child_process");

  let cmdResult = undefined;
  try {
    const dummyStdio: any[] = [];
    cmdResult = execSync("REG QUERY \"" + LICENSE_REGISTRY_PATH + "\" /v license", {
      stdio: dummyStdio,
      timeout: 60000,
      windowsHide: true,
    }).toString();
  } catch (e) {
    // License is not found in registry
    if (os.type() === "Windows_NT") {
      console.error(e);
    }
    return "";
  }

  const prefix = cmdResult.match(/license\s*REG_SZ\s*/);
  if (null === prefix) {
    // Error while searching license value
    return "";
  }

  const licPos = cmdResult.toString().indexOf(prefix) + prefix.toString().length;
  const searchResult = cmdResult.toString().substr(licPos).trim();

  return searchResult;
}

export function loadLicense(license?: string) {
  return (dispatch: (action: {}) => void) => {
    dispatch({ type: LOAD_LICENSE + START });

    setTimeout(() => {
      let data = "";
      let licenseStatus = true;
      let lic;
      let lic_format = "NONE";
      let lic_error = 911; // CTLICENSE_R_ERROR_NO_LICENSE_IN_STORE

      // Шаблон информации о лицензии для заполнения
      lic = {
        aud: "-",
        core: 65535,
        desc: "CryptoARM GOST",
        exp: 0,
        iat: 0,
        iss: 'ООО "Цифровые технологии"',
        jti: "",
        sub: "CryptoARM GOST",
      };
      
      if (license && license.length) {
        data = license;
      } else {
        let result: any | undefined = undefined;
        try {
          data = readRegistryLicense();
          result = JSON.parse(LicenseManager.checkLicense(data));
        } catch(e) {
          //
        }

        if ((!result || !result.verify) && fs.existsSync(LICENSE_PATH)) {
          data = fs.readFileSync(LICENSE_PATH, "utf8");
        }
      }
      
      data = data.replace(/(\r\n|\n|\r)/gm, "");
      data = data.trim();
      
      try {
        if (data && data.length) {
          const status = JSON.parse(LicenseManager.checkLicense(data));
 
          if (status.verify) {
            lic_format = status.type;
            lic.exp = status.attribute ? status.attribute.ExpirationTime : status.payload ? status.payload.exp : null;
            lic.iat = 0;
            licenseStatus = true;
            lic_error = 900; // CTLICENSE_R_NO_ERROR
            dispatch({ payload: { data, lic, lic_format, licenseStatus, lic_error }, type: LOAD_LICENSE + SUCCESS });
          } else {
            lic_format = status.type;
            licenseStatus = false;
            lic_error = status.errcode; // CTLICENSE_R_ERROR_NO_LICENSE_IN_STORE
            dispatch({ payload: { data, lic_format, licenseStatus, lic_error }, type: LOAD_LICENSE + FAIL });
          }
        } else {
          const status = JSON.parse(LicenseManager.checkTrialLicense());
          // // Проверка на наличие и истечение временной лицензии
          if (status.verify) {
            const expirationTimeTrial = status.attribute.ExpirationTime;
            lic_format = "TRIAL";
            lic.exp = expirationTimeTrial;
            lic.iat = expirationTimeTrial - 14 * 86400;
            data = "";
            licenseStatus = true;
            lic_error = 900;
            dispatch({ payload: { data, lic, lic_format, licenseStatus, lic_error }, type: LOAD_LICENSE + SUCCESS });
          } else {
            lic_format = "NONE"; // Лицензия отсутствует, т.к. триальная истекла
            licenseStatus = false; // Статуст лицензии: 0 - не действует
            data = "";
            lic_error = 911; // CTLICENSE_R_ERROR_NO_LICENSE_IN_STORE
            dispatch({ payload: { data, lic_format, licenseStatus, lic_error }, type: LOAD_LICENSE + FAIL });
          }
        }
      } catch (e) {
        console.log("error", e);
      }
    }, 0);
  };
}
