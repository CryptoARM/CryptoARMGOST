import FormData from "form-data";
import * as fs from "fs";
import fetch from "node-fetch";
import * as path from "path";
import { push } from "react-router-redux";
import {
  ADD_LICENSE, ADD_REMOTE_FILE, CANCEL_URL_ACTION, DECRYPT,
  DOWNLOAD_REMOTE_FILE, ENCRYPT, ENCRYPTED, FAIL,
  LOCATION_MAIN, PACKAGE_SELECT_FILE, REMOVE_ALL_FILES,
  REMOVE_ALL_REMOTE_FILES, REMOVE_URL_ACTION, SET_REMOTE_FILES_PARAMS,
  SIGN, SIGN_DOCUMENTS_FROM_URL, START, SUCCESS,
  TMP_DIR, VERIFY, VERIFY_DOCUMENTS_FROM_URL, VERIFY_SIGNATURE,
} from "../constants";
import { IUrlCommandApiV4Type, URLActionType } from "../parse-app-url";
import store from "../store";
import { checkLicense } from "../trusted/jwt";
import * as signs from "../trusted/sign";
import { extFile, fileExists, md5 } from "../utils";
import { handleUrlCommandCertificates } from "./urlCmdCertificates";
import { handleUrlCommandCertificateInfo } from "./urlCmdCertInfo";

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

export function dispatchURLCommand(
  command: IUrlCommandApiV4Type,
) {
  switch (command.command.toLowerCase()) {
    case "certificates":
      handleUrlCommandCertificates(command);
      break;

    case "certificateinfo":
      handleUrlCommandCertificateInfo(command);
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
}

export async function cancelUrlAction(data: ISignRequest | IEncryptRequest) {

  const { params } = data;

  if (!params) {
    return;
  }
  const { extra, files, uploader } = params;

  for (const file of files) {

    const form = new FormData();

    form.append("id", file.id);
    form.append("success", "0");

    await window.fetch(uploader,
      {
        method: "POST",
        body: form,
      });

  }

  store.dispatch({
    type: CANCEL_URL_ACTION,
  });
}

function signDocumentsFromURL(action: URLActionType) {
  store.dispatch({
    type: SIGN_DOCUMENTS_FROM_URL + START,
  });

  cleanFileLists();
  openWindow(SIGN);

  setTimeout(async () => {
    try {
      let data: any;

      const urlObj = new URL(action.url);

      if (action.accessToken) {
        urlObj.searchParams.append("accessToken", action.accessToken);
      }

      if (action.command) {
        urlObj.searchParams.append("command", action.command);
      }

      data = await getJsonFromURL(urlObj.toString());

      if (data && data.params && data.params.files) {
        await downloadFiles(data);
      } else {
        throw new Error("Error get JSON or json incorrect");
      }

      if (data && data.params && data.params.license && data.params.extra) {
        addLicenseToStore(data.params.extra.token, data.params.license);
      }

      store.dispatch({
        payload: { ...action, json: data },
        type: SIGN_DOCUMENTS_FROM_URL + SUCCESS,
      });
    } catch (error) {
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

      const urlObj = new URL(action.url);

      if (action.accessToken) {
        urlObj.searchParams.append("accessToken", action.accessToken);
      }

      if (action.command) {
        urlObj.searchParams.append("command", action.command);
      }

      data = await getJsonFromURL(urlObj.toString());

      if (data && data.params && data.params.files) {
        await downloadFiles(data);
      } else {
        throw new Error("Error get JSON or json incorrect");
      }

      store.dispatch({
        payload: { ...action, json: data },
        type: VERIFY_DOCUMENTS_FROM_URL + SUCCESS,
      });
    } catch (error) {
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
  const { params } = data;

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
