
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { push } from "react-router-redux";
import {
  ADD_CONNECTION, ADD_LICENSE, ADD_REMOTE_FILE, CHANGE_OUTFOLDER, CHANGE_SIGNATURE_DETACHED,
  CHANGE_SIGNATURE_TIMESTAMP, DOWNLOAD_REMOTE_FILE, FAIL, LOCATION_MAIN,
  PACKAGE_SELECT_FILE, REMOVE_ALL_FILES, REMOVE_ALL_REMOTE_FILES, REMOVE_CONNECTION,
  SET_CONNECTED, SET_REMOTE_FILES_PARAMS, START, SUCCESS, TOGGLE_SAVE_TO_DOCUMENTS,
  VERIFY_SIGNATURE,
} from "../constants";
import store from "../store/index";
import { checkLicense } from "../trusted/jwt";
import * as signs from "../trusted/sign";
import { extFile } from "../utils";
import { fileExists } from "../utils";
import { CONNECTION, DECRYPT, DISCONNECT, ENCRYPT, SIGN, UNAVAILABLE, VERIFIED, VERIFY } from "./constants";
import io from "./socketIO";

// tslint:disable-next-line:no-var-requires
const request = require("request");
const TMP_DIR = os.tmpdir();
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

io.on(CONNECTION, (socket) => {
  store.dispatch({ type: ADD_CONNECTION, payload: { id: socket.id, socket } });
  store.dispatch({ type: SET_CONNECTED, payload: { id: socket.id } });

  socket.on(SIGN, (data: ISignRequest) => {
    try {
      $(".side-nav").sideNav("hide");
    } catch (e) {
      //
    }

    cleanFileLists();
    openWindow(SIGN);
    downloadFiles(data, socket);

    store.dispatch({ type: CHANGE_SIGNATURE_DETACHED, payload: { detached: false } });
    store.dispatch({ type: CHANGE_SIGNATURE_TIMESTAMP, payload: { timestamp: true } });
    store.dispatch({ type: CHANGE_OUTFOLDER, payload: { outfolder: "" } });
    store.dispatch({ type: TOGGLE_SAVE_TO_DOCUMENTS, payload: { saveToDocuments: false } });

    if (data && data.params && data.params.license) {
      addLicenseToStore(socket.id, data.params.license);
    }
  });

  socket.on(VERIFY, (data: ISignRequest) => {
    try {
      $(".side-nav").sideNav("hide");
    } catch (e) {
      //
    }

    cleanFileLists();
    openWindow(VERIFY);
    downloadFiles(data, socket);

    store.dispatch({ type: CHANGE_SIGNATURE_DETACHED, payload: { detached: false } });
    store.dispatch({ type: CHANGE_SIGNATURE_TIMESTAMP, payload: { timestamp: true } });
    store.dispatch({ type: CHANGE_OUTFOLDER, payload: { outfolder: "" } });
    store.dispatch({ type: TOGGLE_SAVE_TO_DOCUMENTS, payload: { saveToDocuments: false } });
  });

  socket.on(ENCRYPT, (data: IEncryptRequest) => {
    try {
      $(".side-nav").sideNav("hide");
    } catch (e) {
      //
    }

    cleanFileLists();
    openWindow(ENCRYPT);
    downloadFiles(data, socket);
  });

  socket.on(DECRYPT, (data: IEncryptRequest) => {
    try {
      $(".side-nav").sideNav("hide");
    } catch (e) {
      //
    }

    cleanFileLists();
    openWindow(DECRYPT);
    downloadFiles(data, socket);

    if (data && data.params && data.params.license) {
      addLicenseToStore(socket.id, data.params.license);
    }
  });

  socket.on(DISCONNECT, () => {
    store.dispatch({ type: REMOVE_CONNECTION, payload: { id: socket.id, socket } });
  });
});

const addLicenseToStore = (id: string, license: string) => {
  if (license) {
    if (checkLicense(license)) {
      try {
        const L_M = new trusted.utils.License_Mng();
        L_M.addLicense(license);

        store.dispatch({ type: ADD_LICENSE, payload: { id, license } });
      } catch (e) {
        console.log("error", e);
      }
    }
  }
};

const downloadFiles = (data: ISignRequest | IEncryptRequest, socket: SocketIO.Socket) => {
  const { params } = data;

  if (!params) {
    return;
  }

  const { extra, files } = params;

  if (!files || !files.length) {
    return;
  }

  store.dispatch({
    payload: {
      method: data.method,
      token: params.token,
      uploader: params.uploader,
    },
    type: SET_REMOTE_FILES_PARAMS,
  });

  files.forEach((file) => {
    const pathForSave = path.join(TMP_DIR, file.name);

    store.dispatch({ type: ADD_REMOTE_FILE, payload: { id: file.id, file: { ...file, socketId: socket.id } } });

    download(file, pathForSave, (err: Error, ss, goodPath) => {
      if (err) {
        socket.emit(UNAVAILABLE, { id: file.id });
        socket.broadcast.emit(UNAVAILABLE, { id: file.id });
      } else {
        if (goodPath) {
          store.dispatch({ type: DOWNLOAD_REMOTE_FILE + SUCCESS, payload: { id: file.id } });

          const fileProps = getFileProperty(goodPath);

          store.dispatch({
            type: PACKAGE_SELECT_FILE + START,
          });

          const fileId = Date.now() + Math.random();

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

                socket.emit(VERIFIED, signatureInfo);

                signatureInfo = signatureInfo.map((info) => {
                  return {
                    fileId,
                    ...info,
                    id: Math.random(),
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
                  generateId: true,
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
                  socket: socket.id,
                }],
              },
              type: PACKAGE_SELECT_FILE + SUCCESS,
            });
          }, 0);
        }
      }
    });
  });
};

function download(file: IFileProperty, pathname: string, done: (err: Error, url?: string, path?: string) => void): void {
  const { url } = file;
  const sendReq: any = request.get(url);

  sendReq.on("response", (response) => {
    switch (response.statusCode) {
      case 200:
        const totalSize = parseInt(response.headers["content-length"], 10);
        store.dispatch({ type: DOWNLOAD_REMOTE_FILE + START, payload: { id: file.id, totalSize } });

        let indexFile: number = 1;
        let newOutUri: string = pathname;
        while (fileExists(newOutUri)) {
          const parsed = path.parse(pathname);

          newOutUri = path.join(parsed.dir, parsed.name + "_(" + indexFile + ")" + parsed.ext);
          indexFile++;
        }

        pathname = newOutUri;

        const stream = fs.createWriteStream(pathname);

        response.on("data", (chunk) => {
          stream.write(chunk);
        }).on("end", () => {
          stream.on("close", () => {
            done(null, url, pathname);
          });
          stream.end();
        });

        break;
      default:
        done(new Error("Server responded with status code" + response.statusCode));
    }
  });

  sendReq.on("error", (err) => {
    fs.unlink(pathname);
    done(err);
  });
}

const getFileProperty = (filepath: string) => {
  const stat = fs.statSync(filepath);

  const extension = extFile(filepath);

  return {
    extension,
    filename: path.basename(filepath),
    filesize: stat.size,
    fullpath: filepath,
    mtime: stat.birthtime,
    size: stat.size,
  };
};

const cleanFileLists = () => {
  store.dispatch({ type: REMOVE_ALL_FILES });
  store.dispatch({ type: REMOVE_ALL_REMOTE_FILES });
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
