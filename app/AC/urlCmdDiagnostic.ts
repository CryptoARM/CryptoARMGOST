import * as fs from "fs";
import os from "os";
import {
  CERTIFICATES_DSS_JSON,
  DIAGNOSTIC_FROM_URL,
  LICENSE_PATH,
  LicenseManager,
  START,
  TSP_OCSP_ENABLED,
} from "../constants";
import localize from "../i18n/localize";
import { IUrlCommandApiV4Type } from "../parse-app-url";
import store from "../store";
import { Store } from "../trusted/store";
import { fileExists } from "../utils";
import { finishCurrentUrlCmd } from "./urlActions";
import { PkiCertToCertInfo } from "./urlCmdCertInfo";
import { paramsRequest, postRequest, removeWarningMessage } from "./urlCmdUtils";

interface IDiagnosticsInformation {
  id: string;
  SYSTEMINFORMATION?: ISystemInformation;
  CSP_ENABLED?: boolean;
  CADES_ENABLED?: boolean;
  VERSIONS?: IVersions;
  PROVIDERS?: IProviders;
  LICENSES?: ILicenses;
  PERSONALCERTIFICATES?: ICertificateInfo[];
}

interface ISystemInformation {
  type: string;
  arch: string;
  platform: string;
  packageType?: string;
}

interface IVersions {
  csp: string;
  cryptoarm: string;
}

interface IProviders {
  GOST2012_256: boolean;
  GOST2012_512: boolean;
}

interface ILicenses {
  csp: ILicenseInfo;
  cryptoarm: ILicenseInfo;
}

interface ILicenseInfo {
  status: boolean;
  type: "permament" | "temporary";
  expiration?: string;
}

interface ICertificateInfo {
  id: string;
  hash: string;
  issuerFriendlyName: string;
  issuerName: string;
  notAfter: string;
  notBefore: string;
  subjectFriendlyName: string;
  subjectName: string;
  status: boolean;
  serial: string;
}

function paramsRequestDiag(id: string) {
  return JSON.stringify(paramsRequest("diagnostics.parameters", id));
}

export function handleUrlCommandDiagnostics(command: IUrlCommandApiV4Type) {
  store.dispatch({
    type: DIAGNOSTIC_FROM_URL + START,
  });

  postRequest(command.url, paramsRequestDiag(command.id)).then(
    (data: any) => {
      const operation = data.result.operation;
      if (!operation || !operation.length) {
        // tslint:disable-next-line: no-console
        console.log("Error! Empty operation list.");
        return;
      }

      const infoRequest = JSON.stringify({
        jsonrpc: "2.0",
        method: "diagnostics.information",
        params: collectDiagnosticInfo(data.id, operation),
      });

      postRequest(command.url, infoRequest).then(
        (respData: any) => {
          const remote = window.electron.remote;
          remote.getCurrentWindow().minimize();
          store.dispatch(finishCurrentUrlCmd());
          removeWarningMessage();
        },
        (error) => {
          store.dispatch(finishCurrentUrlCmd(false));
          removeWarningMessage();
          // tslint:disable-next-line: no-console
          console.log(
            "Error sending of diagnostics info with id " +
              command.id +
              ". Error description: " +
              error,
          );
        },
      );
    },
    (error) => {
      store.dispatch(finishCurrentUrlCmd(false));
      removeWarningMessage();
      // tslint:disable-next-line: no-console
      console.log(
        "Error recieving parameters of diagnostics command with id " +
          command.id +
          ". Error description: " +
          error,
      );
    },
  );
}

function collectDiagnosticInfo(
  id: string,
  diagOperations: string[],
): IDiagnosticsInformation {
  const result: IDiagnosticsInformation = { id };
  if (diagOperations.includes("SYSTEMINFORMATION")) {
    const sysinfo: ISystemInformation = {
      type: os.type(),
      // tslint:disable-next-line: object-literal-sort-keys
      arch: os.arch(),
      platform: os.platform(),
    };

    switch (sysinfo.platform) {
      case "win32":
        sysinfo.packageType = "msi";
        break;
      case "darwin":
        sysinfo.packageType = "pkg";
        break;
      default:
        {
          if (checkIfUtilIsAvailable("dpkg")) {
            sysinfo.packageType = "deb";
          } else if (checkIfUtilIsAvailable("rpm")) {
            sysinfo.packageType = "rpm";
          } else if (checkIfUtilIsAvailable("yum")) {
            sysinfo.packageType = "rpm";
          } else if (checkIfUtilIsAvailable("dnf")) {
            sysinfo.packageType = "rpm";
          }
        }
        break;
    }

    result.SYSTEMINFORMATION = sysinfo;
  }

  if (diagOperations.includes("CSP_ENABLED")) {
    try {
      result.CSP_ENABLED = trusted.utils.Csp.isGost2012_256CSPAvailable();
    } catch (e) {
      result.CSP_ENABLED = true;
      if (window.tcerr) {
        if (window.tcerr.message) {
          if (window.tcerr.message.indexOf("libcapi") !== -1) {
            result.CSP_ENABLED = false;
          }
        }
      }
    }
  }

  if (diagOperations.includes("CADES_ENABLED")) {
    result.CADES_ENABLED = TSP_OCSP_ENABLED;
  }

  if (diagOperations.includes("VERSIONS")) {
    const versions: IVersions = {
      cryptoarm: localize("About.version", window.locale),
      csp: "",
    };

    try {
      versions.csp =
        trusted.utils.Csp.getCPCSPVersion() +
        "." +
        trusted.utils.Csp.getCPCSPVersionPKZI();
    } catch (e) {
      //
    }

    result.VERSIONS = versions;
  }

  if (diagOperations.includes("PROVIDERS")) {
    try {
      const providers: IProviders = {
        GOST2012_256: trusted.utils.Csp.isGost2012_256CSPAvailable(),
        GOST2012_512: trusted.utils.Csp.isGost2012_512CSPAvailable(),
      };

      result.PROVIDERS = providers;
    } catch (e) {
      //
    }
  }

  if (diagOperations.includes("LICENSES")) {
    const licCryptoarm: ILicenseInfo = {
      status: false,
      type: "permament",
    };

    let license = "";
    try {
      license = fs.readFileSync(LICENSE_PATH, "utf8");

      license = license.replace(/(\r\n|\n|\r)/gm, "");
      license = license.trim();
    } catch (e) {
      //
    }

    try {
      if (license && license.length) {
        const status = JSON.parse(LicenseManager.checkLicense(license));

        licCryptoarm.type = "permament";
        if (status.verify) {
          licCryptoarm.status = true;
        } else {
          licCryptoarm.status = false;
        }
      } else {
        const status = JSON.parse(LicenseManager.checkTrialLicense());
        licCryptoarm.type = "temporary";
        licCryptoarm.expiration = status.attribute.ExpirationTime + "000";
        if (status.verify) {
          licCryptoarm.status = true;
        } else {
          licCryptoarm.status = false;
        }
      }
    } catch (e) {
      //
    }

    const licCsp: any = {
      status: false,
    };

    try {
      licCsp.status = trusted.utils.Csp.checkCPCSPLicense();
    } catch (e) {
      //
    }

    const lics: ILicenses = {
      cryptoarm: licCryptoarm,
      csp: licCsp,
    };

    result.LICENSES = lics;
  }

  if (diagOperations.includes("PERSONALCERTIFICATES")) {
    const certificateStore = new Store();

    const certs: trusted.pki.Certificate[] = [];

    for (const item of certificateStore.items) {
      if (item.category === "MY") {
        certs.push(certificateStore.getPkiObject(item));
      }
    }

    if (fileExists(CERTIFICATES_DSS_JSON)) {
      const certificatesDSS = fs.readFileSync(CERTIFICATES_DSS_JSON, "utf8");

      if (certificatesDSS) {
        try {
          const data = JSON.parse(certificatesDSS);

          for (const key1 of Object.keys(data.certificatesDSS)) {
            for (const key2 of Object.keys(data.certificatesDSS[key1])) {
              const cert = data.certificatesDSS[key1][key2];
              if (cert.category === "MY") {
                certs.push(certificateStore.getPkiObject(cert));
              }
            }
          }
        } catch (e) {
          //
        }
      }
    }

    const certInfos: ICertificateInfo[] = [];
    let isMynsvyaz: boolean = false;
    for (const cert of certs) {
      if (cert) {
        const chain = trusted.utils.Csp.buildChain(cert);
        if (chain && chain.length) {
          const rootCertInChain = chain.items(chain.length - 1);

          if (
            rootCertInChain &&
            rootCertInChain.thumbprint.toLowerCase() ===
              "4BC6DC14D97010C41A26E058AD851F81C842415A".toLowerCase()
          ) {
            isMynsvyaz = true;
          } else {
            isMynsvyaz = false;
          }
        } else {
          isMynsvyaz = false;
        }

        certInfos.push(PkiCertToCertInfo(id, cert, isMynsvyaz));
      }
    }

    result.PERSONALCERTIFICATES = certInfos;
  }

  return result;
}

function checkIfUtilIsAvailable(utilName: string, params?: string[]) {
  const { spawnSync } = require("child_process");

  let paramsToUse = params;
  if (!paramsToUse) {
    paramsToUse = ["--help"];
  }

  try {
    const res = spawnSync(utilName, paramsToUse, {
      timeout: 3000,
      windowsHide: true,
    });
    if (res.output && !res.error) {
      return true;
    }
  } catch (e) {
    //
  }

  return false;
}
