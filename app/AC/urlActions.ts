import FormData from "form-data";
import * as fs from "fs";
import https from "https";
import fetch, { Headers } from "node-fetch";
import * as path from "path";
import { push } from "react-router-redux";
import {
  ADD_LICENSE, ADD_REMOTE_FILE, CANCEL_URL_ACTION, DECRYPT,
  DOWNLOAD_REMOTE_FILE, ENCRYPT, FAIL, LOCATION_MAIN, PACKAGE_SELECT_FILE,
  REMOVE_ALL_FILES, REMOVE_ALL_REMOTE_FILES, REMOVE_URL_ACTION,
  SERVICE_CHAIN, SET_REMOTE_FILES_PARAMS, SIGN, SIGN_DOCUMENTS_FROM_URL,
  START, SUCCESS, TMP_DIR, URL_CMD, VERIFY, VERIFY_DOCUMENTS_FROM_URL,
  VERIFY_SIGNATURE,
} from "../constants";
import { IUrlCommandApiV4Type, URLActionType } from "../parse-app-url";
import store from "../store";
import { checkLicense } from "../trusted/jwt";
import * as signs from "../trusted/sign";
import { extFile, fileExists, mapToArr, md5 } from "../utils";
import { toggleReverseOperations, toggleSaveCopyToDocuments, toggleSigningOperation } from "./settingsActions";
import { showModalAddTrustedService } from "./trustedServicesActions";
import { handleUrlCommandCertificates } from "./urlCmdCertificates";
import { handleUrlCommandDiagnostics } from "./urlCmdDiagnostic";
import { handleUrlCommandSignAmdEncrypt } from "./urlCmdSignAndEncrypt";
import { handleUrlCommandStartView } from "./urlCmdStartView";
import { postRequest, removeWarningMessage } from "./urlCmdUtils";

const remote = window.electron.remote;

interface IFileProperty {
  name: string;
  url: string;
  id: string;
}

interface ISignRequest {
  id: string;
  method: string;
  params: {
    token: string;
    files: IFileProperty[];
    uploader: string;
    extra: any;
    license?: string;
  };
  controller: string;
}

interface IEncryptRequest {
  id: string;
  method: string;
  params: {
    token: string;
    files: IFileProperty[];
    uploader: string;
    extra: any;
    license?: string;
  };
  controller: string;
}

export async function checkTrustedServiceForCommand(
  command: IUrlCommandApiV4Type) {
  const hostToCheck = getServiceBaseLinkFromUrl(command.url);

  const curl = new window.Curl();
  try {
    curl.setOpt("URL", hostToCheck);
    curl.setOpt("CERTINFO", true);
    curl.on("end", (status: any) => {
      let cert: trusted.pki.Certificate | undefined;
      if (status !== 200) {
        // throw Error(`Invalid status code: ${status}`)
      } else {
        try {
          const certInfo: string | number | any[] | null = curl.getInfo(Curl.info.CERTINFO);

          if (!certInfo) {
            throw new Error("Error while recieving certificate info");
          }
          const certs: string[] = certInfo.filter((itm: string): boolean => itm.search("Cert:") === 0);
          if (certs.length === 0) {
            throw new Error("Certificate blob is not found in recieved data");
          }
          cert = findServerCert(certs);
        } catch (e) {
          // tslint:disable-next-line:no-console
          console.error("Error loading certificate ", e.message);
        }
      }
      curl.close();
      processCommandForService(command, isTrusted (cert, hostToCheck) , cert);
    });

    // 2nd method to get certificate if cURL not work
    curl.on("error", (error: any) => {
      obtainCertWithHttps(command, hostToCheck);
    });
    curl.perform();
  } catch (e) {
    // tslint:disable-next-line:no-console
    console.error("Error with CURL:", e);

    if (curl) {
      curl.close();
    }
    obtainCertWithHttps(command, hostToCheck);
    return;
  }
}

function obtainCertWithHttps(command: IUrlCommandApiV4Type, hostToCheck: string) {
  const url = new URL (command.url);

  const hostName = url.host;
  const options = {
    ca: SERVICE_CHAIN,
    hostname: hostName,
    method: "GET",
    path: "/",
    port: 443,
    checkServerIdentity(host: any, cert: any) {
      try {
        curCert = new trusted.pki.Certificate();
        curCert.import(cert.raw, trusted.DataFormat.DER);
        processCommandForService(command, isTrusted (curCert, hostToCheck), curCert);
      } catch (e) {
        // tslint:disable-next-line:no-console
        console.error("Error while importing service certificate:", e);
        processCommandForService(command, false);
      }
    },
  };
  options.agent = new https.Agent(options);
  let curCert: trusted.pki.Certificate;
  const req = https.request(options, (res) => { /*...*/ });
  req.on("error", (e) => {
    // tslint:disable-next-line:no-console
    console.log("problem with request: " + e.message);
    processCommandForService(command, false);
  });
  req.end();
}

function isTrusted(cert: any, hostToCheck: string): boolean {
  const state = store.getState();
  const { trustedServices } = state;
  let serviceIsTrusted = false;

  if (cert && trustedServices && trustedServices.entities) {
    const serviceUrlToCheck = getServiceBaseLinkFromUrl(hostToCheck);
    const findResult = mapToArr(trustedServices.entities).find(
      (value: any) => {
        if (value.url !== serviceUrlToCheck) {
          return false;
        }

        let curCert: trusted.pki.Certificate;
        if (value.cert && value.cert.x509) {
          try {
            curCert = new trusted.pki.Certificate();
            curCert.import(Buffer.from(value.cert.x509), trusted.DataFormat.PEM);
          } catch (e) {
            //
          }
        }
        if (!curCert) {
          return false;
        }
        return curCert.compare(cert) === 0;
      },
    );
    serviceIsTrusted = (undefined !== findResult);
  }

  return serviceIsTrusted;
}

function processCommandForService(
  command: IUrlCommandApiV4Type,
  serviceIsTrusted: boolean,
  cert?: trusted.pki.Certificate,
) {
  store.dispatch(startUrlCmd(command));
  if (serviceIsTrusted) {
    dispatchURLCommand(command);
  } else {
    store.dispatch(showModalAddTrustedService(command.url, cert));

    const curWindow = remote.getCurrentWindow();
    if (curWindow.isMinimized()) {
      curWindow.restore();
    }

    curWindow.show();
    curWindow.focus();

    store.dispatch(push(LOCATION_MAIN));

    return;
  }
}

function findServerCert(certs: string[]): trusted.pki.Certificate | undefined {
  const parsedCerts: trusted.pki.Certificate[] = [];
  // importing chain certificates to trusted.pki.Certificate objects
  certs.forEach((certItem: string) => {
    try {
      const cert = new trusted.pki.Certificate();
      cert.import(Buffer.from(certItem.substr(5)), trusted.DataFormat.PEM);
      parsedCerts.push(cert);
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.error("Error parsing certificate ", e.message);
    }
  });

  if (parsedCerts.length === 0) {
    return undefined;
  }

  if (parsedCerts.length === 1) {
    return parsedCerts[0];
  }

  let result = parsedCerts[0];
  let nextCert;
  // Search last certificate in chain
  do {
    nextCert = parsedCerts.find((curCert: trusted.pki.Certificate) => {
      // next cert must be issued by current result
      // and must not be selfsigned (to avoid infinite loop on root certificate)
      return (result.subjectName === curCert.issuerName) && (!curCert.isSelfSigned);
    });

    if (nextCert) {
      result = nextCert;
    }
  } while (nextCert);

  return result;
}

export function dispatchURLCommand(
  command: IUrlCommandApiV4Type,
) {
  switch (command.command.toLowerCase()) {
    // Restore window for commands:
    case "certificates":
    case "signandencrypt":
    case "startview":
      {
        const curWindow = window.electron.remote.getCurrentWindow();
        if (curWindow.isMinimized()) {
          curWindow.restore();
        }
        curWindow.show();
        curWindow.focus();
      }
      break;

    // Do not show window for commands:
    case "diagnostics":
    default:
      break;
  }

  switch (command.command.toLowerCase()) {
    case "certificates":
      handleUrlCommandCertificates(command);
      break;

    case "diagnostics":
      handleUrlCommandDiagnostics(command);
      break;

    case "signandencrypt":
      handleUrlCommandSignAmdEncrypt(command);
      break;

    case "startview":
      handleUrlCommandStartView(command);
      break;

    default:
      break;
  }
}

export function dispatchURLAction(
  action: URLActionType,
) {
  switch (action.name) {
    case SIGN_DOCUMENTS_FROM_URL:
      signDocumentsFromURL(action);
      break;

    case VERIFY_DOCUMENTS_FROM_URL:
      verifyDocumentsFromURL(action);
      break;
  }
}

export function removeUrlAction() {
  store.dispatch({
    type: REMOVE_URL_ACTION,
  });
  store.dispatch(finishCurrentUrlCmd());
  removeWarningMessage();
}

export async function cancelUrlAction(
  method: string,
  url: string,
  id: string,
) {
  const data = {
    jsonrpc: "2.0",
    method,
    params: {
      id,
      status: "Canceled",
      // tslint:disable-next-line: object-literal-sort-keys
      error: null,
      errorDescription: null,
    },
  };

  postRequest(url, JSON.stringify(data)).then(
    (respData: any) => {
      remote.getCurrentWindow().minimize();
      store.dispatch(finishCurrentUrlCmd());
      removeWarningMessage();
    },
    (error) => {
      store.dispatch(finishCurrentUrlCmd(false));
      removeWarningMessage();
      // tslint:disable-next-line: no-console
      console.log("Error cancel action with id " + id
        + ". Error description: " + error);
    },
  );

  store.dispatch({
    type: CANCEL_URL_ACTION,
  });
  store.dispatch(finishCurrentUrlCmd(false));
  removeWarningMessage();
}

function signDocumentsFromURL(action: URLActionType) {
  console.log("signDocumentsFromURL");
  store.dispatch({
    type: SIGN_DOCUMENTS_FROM_URL + START,
  });

  cleanFileLists();
  openWindow(SIGN);

  store.dispatch(toggleReverseOperations(false));
  store.dispatch(toggleSigningOperation(true));
  store.dispatch(toggleSaveCopyToDocuments(false));
  store.dispatch({
    type: SIGN_DOCUMENTS_FROM_URL + START,
  });
  setTimeout(async () => {
    try {
      let data: any;

      data = action.props;
      data.method = "sign";
      data.uploader = action.url;

      if (data && data.files) {
        await downloadFiles(data);
      } else {
        throw new Error("Error get JSON or json incorrect");
      }

      if (data && data.license && data.extra) {
        addLicenseToStore(data.extra.token, data.license);
      }

      store.dispatch({
        payload: { ...action, json: data },
        type: SIGN_DOCUMENTS_FROM_URL + SUCCESS,
      });
    } catch (error) {
      store.dispatch(finishCurrentUrlCmd(false));
      removeWarningMessage();
      store.dispatch({
        type: SIGN_DOCUMENTS_FROM_URL + FAIL,
      });
    }
  }, 0);
}

function verifyDocumentsFromURL(action: URLActionType) {
  store.dispatch({
    type: VERIFY_DOCUMENTS_FROM_URL + START,
  });

  cleanFileLists();
  openWindow(VERIFY);

  setTimeout(async () => {
    try {
      let data: any;

      data = action.props;
      data.method = "verify";
      data.uploader = action.url;

      if (data && data.files) {
        await downloadFiles(data);
      } else {
        throw new Error("Error get JSON or json incorrect");
      }

      store.dispatch({
        payload: { ...action, json: data },
        type: VERIFY_DOCUMENTS_FROM_URL + SUCCESS,
      });
    } catch (error) {
      store.dispatch(finishCurrentUrlCmd(false));
      removeWarningMessage();
      store.dispatch({
        type: VERIFY_DOCUMENTS_FROM_URL + FAIL,
      });
    }
  }, 0);
}

const getJsonFromURL = async (url: string): Promise<void> => {
  const response = await fetch(url, { method: "GET" });

  if (response.ok) {
    const json = await response.json();

    return json;
  } else {
    return;
  }
};

const downloadFiles = async (data: ISignRequest | IEncryptRequest) => {
  const params = data;

  if (!params) {
    return;
  }
  const { extra, files } = params;

  store.dispatch({
    payload: {
      method: data.method,
      token: extra ? extra.token : null,
      uploader: params.uploader,
    },
    type: SET_REMOTE_FILES_PARAMS,
  });

  for (const file of files) {
    if (file.name) {
      let pathForSave = path.join(TMP_DIR, file.name);

      store.dispatch({ type: ADD_REMOTE_FILE, payload: { id: file.id, file: { ...file } } });

      let indexFile: number = 1;
      let newOutUri: string = pathForSave;
      while (fileExists(newOutUri)) {
        const parsed = path.parse(pathForSave);

        newOutUri = path.join(parsed.dir, parsed.name + "_(" + indexFile + ")" + parsed.ext);
        indexFile++;
      }

      pathForSave = newOutUri;

      const fileUrl = file.urlDetached ? new URL(file.urlDetached) : new URL(file.url);

      if (extra && extra.token) {
        fileUrl.searchParams.append("accessToken", extra.token);
      }

      store.dispatch({ type: DOWNLOAD_REMOTE_FILE + START, payload: { id: file.id } });

      await downloadFile(fileUrl.toString(), pathForSave);

      store.dispatch({ type: DOWNLOAD_REMOTE_FILE + SUCCESS, payload: { id: file.id } });

      if (file.urlDetached && file.url && extFile(pathForSave) === "sig") {
        const fileUrlContent = new URL(file.url);

        if (extra && extra.token) {
          fileUrlContent.searchParams.append("accessToken", extra.token);
        }

        await downloadFile(fileUrlContent.toString(), pathForSave.substring(0, pathForSave.lastIndexOf(".")));
      }

      store.dispatch({
        type: PACKAGE_SELECT_FILE + START,
      });

      const fileProps = getFileProperty(pathForSave);

      const fileId = fileProps.id;

      setTimeout(() => {
        if (fileProps.filename.split(".").pop() === "sig") {
          let signaruteStatus = false;
          let signatureInfo;
          let cms: trusted.cms.SignedData;

          try {
            cms = signs.loadSign(fileProps.fullpath);

            if (cms.isDetached()) {
              if (!(cms = signs.setDetachedContent(cms, fileProps.fullpath))) {
                throw new Error(("err"));
              }
            }

            signaruteStatus = signs.verifySign(cms);
            signatureInfo = signs.getSignPropertys(cms);

            signatureInfo = signatureInfo.map((info) => {
              return {
                fileId,
                ...info,
                id: Math.random(),
                verifyingTime: new Date().getTime(),
              };
            });

          } catch (error) {
            store.dispatch({
              payload: { error, fileId },
              type: VERIFY_SIGNATURE + FAIL,
            });
          }

          if (signatureInfo) {
            store.dispatch({
              payload: { fileId, signaruteStatus, signatureInfo },
              type: VERIFY_SIGNATURE + SUCCESS,
            });
          }
        }

        store.dispatch({
          payload: {
            filePackage: [{
              ...fileProps,
              active: true,
              extra,
              id: fileId,
              remoteId: file.id,
            }],
          },
          type: PACKAGE_SELECT_FILE + SUCCESS,
        });
      }, 0);
    }
  }
};

async function downloadFile(url: string, fileOutPath: string) {
  const res = await fetch(url);
  let indexFile: number = 1;
  let newOutUri: string = fileOutPath;
  while (fileExists(newOutUri)) {
    const parsed = path.parse(fileOutPath);

    newOutUri = path.join(parsed.dir, parsed.name + "_(" + indexFile + ")" + parsed.ext);
    indexFile++;
  }

  fileOutPath = newOutUri;

  await new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(fileOutPath);
    res.body.pipe(fileStream);
    res.body.on("error", (err) => {
      reject(err);
    });
    fileStream.on("finish", function () {
      resolve();
    });
  });
}

const getFileProperty = (filepath: string) => {
  const stat = fs.statSync(filepath);

  const extension = extFile(filepath);

  return {
    extension,
    id: md5(filepath),
    filename: path.basename(filepath),
    filesize: stat.size,
    fullpath: filepath,
    mtime: stat.birthtime,
    size: stat.size,
  };
};

const addLicenseToStore = (id: string, license: string) => {
  if (license) {
    if (checkLicense(license)) {
      try {
        const L_M = new trusted.utils.License_Mng();
        L_M.addLicense(license);

        store.dispatch({ type: ADD_LICENSE, payload: { id, license } });
      } catch (e) {
        // tslint:disable-next-line:no-console
        console.log("Error add license", e);
      }
    }
  }
};

const cleanFileLists = () => {
  store.dispatch({ type: REMOVE_ALL_FILES });
  store.dispatch({ type: REMOVE_ALL_REMOTE_FILES });
  store.dispatch({ type: REMOVE_URL_ACTION });
};

const openWindow = (operation: string) => {
  remote.getCurrentWindow().show();
  remote.getCurrentWindow().focus();

  switch (operation) {
    case SIGN:
    case VERIFY:
      store.dispatch(push(LOCATION_MAIN));
      return;

    case ENCRYPT:
    case DECRYPT:
      store.dispatch(push(LOCATION_MAIN));
      return;

    default:
      return;
  }
};

export const startUrlCmd = (command: any) => {
  return {
    payload: { urlCommand: command },
    type: URL_CMD + START,
  };
};

export const finishCurrentUrlCmd = (isSuccessfull: boolean = true) => {
  return {
    type: URL_CMD + (isSuccessfull ? SUCCESS : FAIL),
  };
};

export const getServiceBaseLinkFromUrl = (urlValue: string, includeProtocol: boolean = true): string => {
  const parsedUrl = new URL(urlValue);

  if (!parsedUrl) {
    return urlValue;
  }

  if (includeProtocol && parsedUrl.origin) {
    return parsedUrl.origin;
  }

  return (parsedUrl.host) ? parsedUrl.host : urlValue;
};
