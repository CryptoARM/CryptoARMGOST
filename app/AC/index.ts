import * as fs from "fs";
import * as path from "path";
import logger from "../winstonLogger";
import { push } from "react-router-redux";
import { ICertificateRequestCA } from "../components/Services/types";
import {
  ACTIVE_CONTAINER, ACTIVE_FILE, ADD_CERTIFICATE_REQUEST_CA,
  ADD_RECIPIENT_CERTIFICATE,
  CHANGE_ARCHIVE_FILES_BEFORE_ENCRYPT, CHANGE_DELETE_FILES_AFTER_ENCRYPT,
  CHANGE_ECRYPT_ENCODING, CHANGE_LOCALE, CHANGE_OUTFOLDER,
  CHANGE_SETTINGS_NAME, CHANGE_SIGNATURE_DETACHED, CHANGE_SIGNATURE_ENCODING,
  CHANGE_SIGNATURE_TIMESTAMP,
  DEFAULT_DOCUMENTS_PATH, DELETE_FILE, DELETE_PASSWORD_DSS,
  DELETE_RECIPIENT_CERTIFICATE, FAIL, GET_CERTIFICATE_FROM_CONTAINER,
  LOAD_ALL_CERTIFICATES, LOAD_ALL_CONTAINERS, PACKAGE_DELETE_FILE,
  PACKAGE_SELECT_FILE, PACKAGE_SIGN, REMEMBER_PASSWORD_DSS,
  REMOVE_ALL_CERTIFICATES, REMOVE_ALL_CONTAINERS,
  REMOVE_ALL_FILES, REMOVE_ALL_REMOTE_FILES, SELECT_FILE,
  SELECT_SIGNER_CERTIFICATE, SELECT_TEMP_CONTENT_OF_SIGNED_FILES, START,
  SUCCESS, INTERRUPT, PART_SUCCESS, UNSELECT_ALL_FILES,
  TOGGLE_SAVE_TO_DOCUMENTS,
  VERIFY_CERTIFICATE,
  VERIFY_SIGNATURE,
  MULTI_DIRECT_OPERATION, LOCATION_RESULTS_MULTI_OPERATIONS,
  VERIFY_CRL,
  USER_NAME,
} from "../constants";
import settings, { IOcspModel, ISignModel, ITspModel } from "../reducer/settings";
import { connectedSelector } from "../selectors";
import { ERROR, SIGNED, UPLOADED, VERIFIED } from "../server/constants";
import * as signs from "../trusted/sign";
import { Store } from "../trusted/store";
import { extFile, fileCoding, fileExists, md5 } from "../utils";
import { postRequest, removeWarningMessage } from "./urlCmdUtils";
import store from "../store";
import { finishCurrentUrlCmd } from "./urlActions";


export function changeLocation(location: string) {
  return (dispatch: (action: {}) => void) => {
    dispatch(push(location));
  };
}

export interface IFile {
  id: string;
  filename: string;
  mtime: Date;
  fullpath: string;
  extension: string | undefined;
  active: boolean;
  extra: any;
  remoteId?: string;
}

interface IFilePath {
  fullpath: string;
  extra?: any;
  remoteId?: string;
}

interface INormalizedSignInfo {
  serialNumber: string;
  subjectFriendlyName: string;
  issuerFriendlyName: string;
  notBefore: number;
  notAfter: number;
  digestAlgorithm: string;
  signingTime: number | undefined;
  subjectName: string;
  issuerName: string;
}

interface ISignParams {
  signModel: ISignModel;
  tspModel: ITspModel;
  ocspModel: IOcspModel;
}

function gatherRemoteFileInfo(
  file: IFile,
  newPath: string,
  urlActions: any,
  upload: boolean
) {
  try {
    if (!(urlActions && urlActions.action && urlActions.action.isDetachedSign) && !upload) {
      fs.unlinkSync(file.fullpath);
    }
  } catch (e) {
    //
  }

  if (upload) {
    let cms = signs.loadSign(newPath);
    if (cms.isDetached()) {
      // tslint:disable-next-line:no-conditional-assignment
      if (!(cms = signs.setDetachedContent(cms, newPath))) {
        throw new Error(("err"));
      }
    }

    const signatureInfo = signs.getSignPropertys(cms);

    const normalyzeSignatureInfo: INormalizedSignInfo[] = [];

    signatureInfo.forEach((info: any) => {
      const subjectCert = info.certs[info.certs.length - 1];

      let x509;

      if (subjectCert.object) {
        try {
          let cmsContext = subjectCert.object.export(trusted.DataFormat.PEM).toString();

          cmsContext = cmsContext.replace("-----BEGIN CERTIFICATE-----", "");
          cmsContext = cmsContext.replace("-----END CERTIFICATE-----", "");
          cmsContext = cmsContext.replace(/\r\n|\n|\r/gm, "");

          x509 = cmsContext;
        } catch (e) {
          //
        }
      }

      normalyzeSignatureInfo.push({
        serialNumber: subjectCert.serial,
        digestAlgorithm: subjectCert.signatureDigestAlgorithm,
        issuerFriendlyName: subjectCert.issuerFriendlyName,
        issuerName: subjectCert.issuerName,
        notAfter: new Date(subjectCert.notAfter).getTime(),
        notBefore: new Date(subjectCert.notBefore).getTime(),
        organizationName: subjectCert.organizationName,
        signingTime: info.signingTime ? new Date(info.signingTime).getTime() : undefined,
        subjectFriendlyName: info.subject,
        subjectName: subjectCert.subjectName,
        x509,
      });
    });

    const extra = file.extra;

    if (extra && extra.signType === "0" || extra.signType === "1") {
      extra.signType = parseInt(extra.signType, 10);
    }

    return {
      file: file,
      newPath: newPath,
      normalyzeSignatureInfo: normalyzeSignatureInfo
    };
  }
}

function uploadFiles(
  remoteFilesToUpload: any[],
  uploader: any,
  urlActions: any
) {
  const infoRequest = {
    jsonrpc: "2.0",
    method: "signAndEncrypt.outDirectResults",
    params: {
      directResults: [],
      id: urlActions.action.id,
    },
  };

  remoteFilesToUpload.forEach((uploadData: any) => {
    infoRequest.params.directResults.push({
      id: uploadData.file.remoteId,
      out: fs.readFileSync(uploadData.newPath, "base64"),
      signers: uploadData.normalyzeSignatureInfo,
    });

    try {
      fs.unlinkSync(uploadData.newPath);

      if (urlActions && urlActions.action && urlActions.action.isDetachedSign) {
        fs.unlinkSync(uploadData.file.fullpath);
        fs.unlinkSync(uploadData.newPath.substring(0, uploadData.newPath.lastIndexOf(".")));
      }
    } catch (e) {
      //
    }
  });

  postRequest(uploader, JSON.stringify(infoRequest)).then(
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
      console.log("Error sending of diagnostics info with id " + urlActions.id
        + ". Error description: " + error);
    },
  );
}

export function packageSign(
  files: IFile[],
  cert: trusted.pki.Certificate,
  policies: string[],
  params: ISignParams | null = null,
  format: trusted.DataFormat,
  folderOut: string,
  folderOutDSS?: string[],
  multiResult?: any = null,
  multipackage?: boolean = false,
) {
  return (dispatch: (action: {}) => void, getState: () => any) => {
    dispatch({
      type: PACKAGE_SIGN + START,
    });

    let packageSignResult = true;

    setTimeout(() => {
      const signedFilePackage: IFilePath[] = [];
      const signedFileIdPackage: string[] = [];
      const state = getState();
      const { urlActions, remoteFiles } = state;
      let i: number = 0;
      let remoteFilesToUpload: any[] = [];

      files.every((file) => {
        const newPath = folderOutDSS ? folderOutDSS[i] : signs.signFile(file.fullpath, cert, policies, params, format, folderOut);
        if (newPath) {
          signedFileIdPackage.push(file.id);

          if (!file.remoteId) {
            signedFilePackage.push({ fullpath: newPath });
          }

          if (file.remoteId) {
            var result = gatherRemoteFileInfo(file, newPath, urlActions, remoteFiles.uploader !== null);
            if (result) {
              remoteFilesToUpload.push( result );
            }
          }
        } else {
          packageSignResult = false;
          if (file.remoteId) {
            return false;
          }
        }
        i++;
        return true;
      });

      if (remoteFiles.uploader) {
        if (!packageSignResult) {
          dispatch({
            type: PACKAGE_SIGN + INTERRUPT,
          });
          return;
        } else {
          uploadFiles(remoteFilesToUpload, remoteFiles.uploader, urlActions);
        }
      }

      dispatch({
        payload: { packageSignResult },
        type: PACKAGE_SIGN + SUCCESS,
      });

      files.forEach((file) => {
        logger.log({
          certificate: cert.subjectName,
          level: "info",
          message: "",
          operation: "Подпись",
          operationObject: {
            in: path.basename(file.fullpath),
            out: path.basename(folderOut),
          },
          userName: USER_NAME,
        });
      });

      if (multiResult) {
        dispatch({
          payload: { status: true, directResult: multiResult },
          type: MULTI_DIRECT_OPERATION + (multipackage ? PART_SUCCESS : SUCCESS),
        });

        if (multiResult.operations.save_copy_to_documents) {
          for (const file of files) {
              const signedFile = signedFilePackage[files.indexOf(file)];
              const copyUriOriginalFile = path.join(DEFAULT_DOCUMENTS_PATH, path.basename(file.fullpath));
              const copyUriSignedFile = path.join(DEFAULT_DOCUMENTS_PATH, path.basename(signedFile.fullpath));

              fs.copyFileSync(signedFile.fullpath, copyUriSignedFile); // копирую подписанный файл
              if (policies.includes("detached")) {
                fs.copyFileSync(file.fullpath, copyUriOriginalFile); } // копирую оригинальный файл
          }
        }
        if (!remoteFiles.uploader && !multipackage) {
          dispatch(push(LOCATION_RESULTS_MULTI_OPERATIONS));
        }
        if (policies.includes("detached")) {
          for (const file of files) {
            const copyUriOriginalFile = path.join(folderOut, path.basename(file.fullpath));
            if (!fileExists(copyUriOriginalFile)) {
               fs.copyFileSync(file.fullpath, copyUriOriginalFile);
            }
          }
        }
        dispatch(filePackageDelete(signedFileIdPackage));
      } else {
        dispatch(filePackageSelect(signedFilePackage));
        dispatch(filePackageDelete(signedFileIdPackage));
      }
    }, 0);
  };
}

export function packageReSign(
  files: IFile[],
  cert: trusted.pki.Certificate,
  policies: string[],
  format: trusted.DataFormat,
  folderOut: string,
  folderOutDSS?: string[],
  multiResult?: any = null,
  multipackage?: boolean = false,
  doNotFinalizeOperation?: boolean = false,
) {
  return (dispatch: (action: {}) => void, getState: () => any) => {
    if (!multipackage) {
      dispatch({
        type: PACKAGE_SIGN + START,
      });
    }

    let packageSignResult = true;
    let remoteFilesToUpload: any[] = [];

    setTimeout(() => {
      const signedFilePackage: IFilePath[] = [];
      const signedFileIdPackage: string[] = [];
      const state = getState();
      const { connections, remoteFiles, urlActions } = state;
      let i: number = 0;

      files.forEach((file) => {
        const newPath = folderOutDSS ? folderOutDSS[i] : signs.signFile(file.fullpath, cert, policies, null, format, folderOut);
        if (newPath) {
          signedFileIdPackage.push(file.id);
          if (!file.remoteId) {
            signedFilePackage.push({ fullpath: newPath });
          } else {
            var result = gatherRemoteFileInfo(file, newPath, urlActions, remoteFiles.uploader !== null);
            if (result) {
              remoteFilesToUpload.push( result );
            }
          }
        } else {
          packageSignResult = false;
        }
        i++;
      });

      if (remoteFiles.uploader) {
        if (!packageSignResult) {
          dispatch({
            type: PACKAGE_SIGN + INTERRUPT,
          });
          return;
        } else {
          uploadFiles(remoteFilesToUpload, remoteFiles.uploader, urlActions);
        }
      }
      dispatch({
        payload: { packageSignResult },
        type: PACKAGE_SIGN + SUCCESS,
      });
      if (multiResult) {
        dispatch({
          payload: { status: true, directResult: multiResult },
          type: MULTI_DIRECT_OPERATION + (doNotFinalizeOperation ? PART_SUCCESS : SUCCESS),
        });
        dispatch(filePackageDelete(signedFileIdPackage));
        if (!remoteFiles.uploader && !doNotFinalizeOperation) {
          files.forEach((file) => {
            logger.log({
              certificate: cert.subjectName,
              level: "info",
              message: "",
              operation: "Подпись",
              operationObject: {
                in: path.basename(file.fullpath),
                out: path.basename(folderOut),
              },
              userName: USER_NAME,
            });
          });
          dispatch(push(LOCATION_RESULTS_MULTI_OPERATIONS));
        }
      } else {
        dispatch(filePackageSelect(signedFilePackage));
        dispatch(filePackageDelete(signedFileIdPackage));
      }
    }, 0);
  };
}

export function filePackageSelect(files: IFilePath[]) {
  return (dispatch: (action: {}) => void) => {
    dispatch({
      type: PACKAGE_SELECT_FILE + START,
    });

    setTimeout(() => {
      const filePackage: IFile[] = [];

      files.forEach((file: IFilePath) => {
        const { fullpath, extra, remoteId } = file;
        const stat = fs.statSync(fullpath);
        const extension = extFile(fullpath);

        const fileProps = {
          active: true,
          extension,
          extra,
          filename: path.basename(fullpath),
          filesize: stat.size,
          fullpath,
          id: md5(fullpath),
          mtime: stat.birthtime,
          remoteId,
          size: stat.size,
        };

        filePackage.push(fileProps);
      });

      dispatch({
        payload: { filePackage },
        type: PACKAGE_SELECT_FILE + SUCCESS,
      });
    }, 0);
  };
}

export function filePackageDelete(filePackage: string[]) {
  return {
    payload: { filePackage },
    type: PACKAGE_DELETE_FILE,
  };
}

export function removeAllFiles() {
  return {
    type: REMOVE_ALL_FILES,
  };
}

export function unselectAllFiles() {
  return {
    type: UNSELECT_ALL_FILES,
  };
}

export function removeAllRemoteFiles() {
  return {
    type: REMOVE_ALL_REMOTE_FILES,
  };
}

export function selectTempContentOfSignedFiles(tempContentOfSignedFiles: string) {
  return {
    payload: { tempContentOfSignedFiles },
    type: SELECT_TEMP_CONTENT_OF_SIGNED_FILES,
  };
}

export function loadAllCertificates() {
  return (dispatch: (action: {}) => void) => {
    dispatch({
      type: LOAD_ALL_CERTIFICATES + START,
    });

    setTimeout(() => {
      const certificateStore = new Store();

      window.PKISTORE = certificateStore;
      window.TRUSTEDCERTIFICATECOLLECTION = certificateStore.trustedCerts;

      const crls = [];
      const certs = [];

      for (const item of certificateStore.items) {
        if (item.type === "CERTIFICATE") {
          if (!item.id) {
            item.id = item.provider + "_" + item.category + "_" + item.hash;
          }

          certs.push(item);
        } else if (item.type === "CRL") {
          if (!item.id) {
            item.id = item.provider + "_" + item.category + "_" + item.hash;
          }

          crls.push(item);
        }
      }

      dispatch({
        certs,
        crls,
        type: LOAD_ALL_CERTIFICATES + SUCCESS,
      });
    }, 0);
  };
}

export function removeAllCertificates() {
  return {
    type: REMOVE_ALL_CERTIFICATES,
  };
}

export function verifyCertificate(certificateId: string) {
  return (dispatch: (action: {}) => void, getState: () => any) => {
    const { certificates } = getState();

    const certItem = certificates.getIn(["entities", certificateId]);
    const certificate = window.PKISTORE.getPkiObject(certItem);
    let certificateStatus = false;

    try {
      certificateStatus = trusted.utils.Csp.verifyCertificateChain(certificate);
    } catch (e) {
      certificateStatus = false;
    }

    dispatch({
      payload: { certificateId, certificateStatus },
      type: VERIFY_CERTIFICATE,
    });
  };
}

export function verifyCRL(crlId: string) {
  return (dispatch: (action: {}) => void, getState: () => any) => {
    const { crls } = getState();

    const crlItem = crls.getIn(["entities", crlId]);
    const crl = window.PKISTORE.getPkiObject(crlItem);
    let crlStatus = false;

    try {
      crlStatus = trusted.utils.Csp.verifyCRL(crl);
    } catch (e) {
      crlStatus = false;
    }

    dispatch({
      payload: { crlId, crlStatus },
      type: VERIFY_CRL,
    });
  };
}

export function selectSignerCertificate(selected: string) {
  return {
    payload: { selected },
    type: SELECT_SIGNER_CERTIFICATE,
  };
}

export function loadAllContainers() {
  return (dispatch: (action: {}) => void) => {
    dispatch({
      type: LOAD_ALL_CONTAINERS + START,
    });

    setTimeout(() => {
      let enumedContainers: any[] = [];

      try {
        enumedContainers = trusted.utils.Csp.enumContainers(75);
      } catch (e) {
        dispatch({
          type: LOAD_ALL_CONTAINERS + FAIL,
        });
      }

      const filteredContainers = [];

      for (const cont of enumedContainers) {
        filteredContainers.push({
          friendlyName: cont.container,
          id: Math.random(),
          name: cont.unique,
          reader: cont.fqcnA.substring(4, cont.fqcnA.lastIndexOf("\\")),
        });
      }

      dispatch({
        containers: filteredContainers,
        type: LOAD_ALL_CONTAINERS + SUCCESS,
      });
    }, 200);
  };
}

export function removeAllContainers() {
  return {
    type: REMOVE_ALL_CONTAINERS,
  };
}

export function getCertificateFromContainer(container: number) {
  return (dispatch: (action: {}) => void, getState: () => any) => {
    dispatch({
      payload: { container },
      type: GET_CERTIFICATE_FROM_CONTAINER + START,
    });

    setTimeout(() => {
      const { containers } = getState();
      const cont = containers.getIn(["entities", container]);
      let certificate;

      try {
        certificate = trusted.utils.Csp.getCertificateFromContainer(cont.name, 75);
        const certificateItem = {
          hash: certificate.thumbprint,
          issuerFriendlyName: certificate.issuerFriendlyName,
          key: "1",
          notAfter: certificate.notAfter,
          organizationName: certificate.organizationName,
          publicKeyAlgorithm: certificate.publicKeyAlgorithm,
          serial: certificate.serialNumber,
          signatureAlgorithm: certificate.signatureAlgorithm,
          signatureDigestAlgorithm: certificate.signatureDigestAlgorithm,
          subjectFriendlyName: certificate.subjectFriendlyName,
          subjectName: certificate.subjectName,
          provider: "CRYPTOPRO",
          object: certificate,
        };

        dispatch({
          payload: { container, certificate, certificateItem },
          type: GET_CERTIFICATE_FROM_CONTAINER + SUCCESS,
        });
      } catch (e) {
        dispatch({
          payload: { container },
          type: GET_CERTIFICATE_FROM_CONTAINER + FAIL,
        });
      }
    }, 0);
  };
}

export function activeContainer(container: number) {
  return {
    payload: { container },
    type: ACTIVE_CONTAINER,
  };
}

export function selectFile(fullpath: string, name?: string, mtime?: Date, size?: number, remoteId?: string) {
  let stat;

  if (!fileExists(fullpath)) {
    return {
      type: SELECT_FILE + FAIL,
    };
  }

  if (!mtime || !size) {
    stat = fs.statSync(fullpath);
  }

  const extension = extFile(fullpath);
  const file = {
    extension,
    filename: name ? name : path.basename(fullpath),
    fullpath,
    mtime: mtime ? mtime : (stat ? stat.birthtime : undefined),
    remoteId,
    id: md5(fullpath),
    filesize: size ? size : (stat ? stat.size : undefined),
  };

  return {
    // generateId: true,
    payload: { file },
    type: SELECT_FILE,
  };
}

export function activeFile(fileId: string, isActive: boolean = true) {
  return {
    payload: { fileId, isActive },
    type: ACTIVE_FILE,
  };
}

export function deleteFile(fileId: number) {
  return {
    payload: { fileId },
    type: DELETE_FILE,
  };
}

export function verifySignature(fileId: string, showOpenDialogForDetached: boolean = true, svsURL?: string) {
  return (dispatch: (action: {}) => void, getState: () => any) => {
    const state = getState();
    const { connections, documents, files, multiOperations } = state;
    let signaruteStatus = false;
    let signatureInfo;
    let cms: trusted.cms.SignedData;
    let file = files.getIn(["entities", fileId]);

    if (!file) {
      file = documents.getIn(["entities", fileId]);
    }

    if (!file) {
      file = multiOperations.getIn(["entities", fileId]);
    }

    try {
      cms = signs.loadSign(file.fullpath);

      if (cms.isDetached()) {
        // tslint:disable-next-line:no-conditional-assignment
        if (!(cms = signs.setDetachedContent(cms, file.fullpath, showOpenDialogForDetached))) {
          throw new Error(("err"));
        }
      }

      signaruteStatus = signs.verifySign(cms);
      signatureInfo = signs.getSignPropertys(cms);

      signatureInfo = signatureInfo.map((info: any) => {
        return {
          fileId,
          ...info,
          id: Math.random(),
          verifyingTime: new Date().getTime(),
        };
      });

    } catch (error) {
      dispatch({
        payload: { error, fileId },
        type: VERIFY_SIGNATURE + FAIL,
      });
    }

    if (svsURL) {
      const uri = file.fullpath;
      let cmsContext = null;

      if (fileCoding(uri) === trusted.DataFormat.PEM) {
        cmsContext = fs.readFileSync(uri, "utf8");
        cmsContext = cmsContext.replace("-----BEGIN CMS-----\n", "");
        cmsContext = cmsContext.replace("\n-----END CMS-----", "");
        cmsContext = cmsContext.replace(/\n/g, "");
      } else {
        cmsContext = fs.readFileSync(uri, "base64");
      }

      const body = JSON.stringify({
        Content: cmsContext,
        SignatureType: "CAdES",
        VerifyParams: {
          VerifyAll: true,
        },
      });

      window.request.post(svsURL, {
        body,
        headers: {
          "content-type": "application/json",
        },
      }, (error: any, response: any, body: any) => {
        if (error) {
          dispatch({
            payload: { error, fileId },
            type: VERIFY_SIGNATURE + FAIL,
          });
        }

        const statusCode = response.statusCode;

        if (statusCode !== 200) {
          dispatch({
            payload: { error: JSON.parse(response.body).Message, fileId },
            type: VERIFY_SIGNATURE + FAIL,
          });
          Materialize.toast(JSON.parse(response.body).Message, 2000, "toast-dss_status");
        } else {
          if (body && body.length) {
            const dssResponse = JSON.parse(body);

            console.log("dssResponse", dssResponse);
          }
        }
      });
    } else if (signatureInfo) {
      dispatch({
        payload: { fileId, signaruteStatus, signatureInfo },
        type: VERIFY_SIGNATURE + SUCCESS,
      });
    }
  };
}

export function addRecipientCertificate(certId: number) {
  return {
    payload: { certId },
    type: ADD_RECIPIENT_CERTIFICATE,
  };
}

export function deleteRecipient(recipient: number) {
  return {
    payload: { recipient },
    type: DELETE_RECIPIENT_CERTIFICATE,
  };
}

export function addCertificateRequestCA(certificateRequestCA: ICertificateRequestCA) {
  return {
    payload: {
      certificateRequestCA,
    },
    type: ADD_CERTIFICATE_REQUEST_CA,
  };
}

export function rememberPasswordDSS(id: string, password: string) {
  return {
    payload: {
      id,
      password,
    },
    type: REMEMBER_PASSWORD_DSS,
  };
}

export function deletePasswordDSS(id: string) {
  return {
    payload: {
      id,
    },
    type: DELETE_PASSWORD_DSS,
  };
}
