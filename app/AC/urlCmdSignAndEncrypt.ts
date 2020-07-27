import {
  FAIL, LOCATION_CERTIFICATE_SELECTION_FOR_ENCRYPT,
  LOCATION_CERTIFICATE_SELECTION_FOR_SIGNATURE, LOCATION_CERTIFICATES, MY,
  START, SUCCESS, URL_CMD_CERTIFICATES_EXPORT, URL_CMD_CERTIFICATES_IMPORT,
} from "../constants";
import localize from "../i18n/localize";
import { IUrlCommandApiV4Type, URLActionType } from "../parse-app-url";
import store from "../store";
import { navigationLock, navigationUnlock } from "./globalLocks";
import { certificateInfo } from "./urlCmdCertInfo";
import { openWindow, paramsRequest, postRequest, writeCertToTmpFile } from "./urlCmdUtils";
import { dispatchURLAction } from "./urlActions";

interface ICertResp {
  jsonrpc: string;
  result: ICertificateParameters;
  id: string;
}

interface ICertificateParameters {
  operation: "import"|"export"|"information";
  props: ICertificateOperationProps;
}

interface ICertificateOperationProps {
  headerText?: string;
  descriptionText?: string;
  store?: string[];
  multy?: boolean;
  certificateBase64?: string;
}

interface ICertToExport {
  certificateBase64: string;
  friendlyName: string;
}

function paramsRequestSignAndEncrypt(id: string) {
  return JSON.stringify(paramsRequest("signAndEncrypt.parameters", id));
}

export function handleUrlCommandSignAmdEncrypt( command: IUrlCommandApiV4Type ) {
  postRequest(command.url, paramsRequestSignAndEncrypt(command.id)).then(
    (data: any) => {
      const operation = data.result.operation;
      const props = data.result.props;

      if (operation && operation.includes("SIGN")) {
        return dispatchURLAction({
          name: "sign-documents-from-url",
          url: command.url,
          // tslint:disable-next-line: object-literal-sort-keys
          accessToken: command.id,
          props,
        });
      } else {
        return dispatchURLAction({
          name: "verify-documents-from-url",
          url: command.url,
          // tslint:disable-next-line: object-literal-sort-keys
          accessToken: command.id,
          props,
        });
      }
      /*const props = data.result.props;
      switch (operation) {
        case "export":
          exportCertificates(props, data.id, command.url);
          break;

        case "import":
          importCertificate(props);
          break;

        case "information":
          certificateInfo(props.certificateBase64, data.id, command.url);
          break;

        default:
          // tslint:disable-next-line: no-console
          console.log("Error! Unsupported certificates method: " + operation);
          break;
      }*/
    },
    (error) => {
      $(".toast-url-cmd-cert-params-fail-err-descr").remove();
      Materialize.toast(error, 3000, "toast-url-cmd-cert-params-fail-err-descr");

      // tslint:disable-next-line: no-console
      console.log("Error recieving parameters of certificate command with id " + command.id
        + ". Error description: " + error);
    },
  );
}

function exportCertificates(props: ICertificateOperationProps, id: string, url: string) {
  const stores = (props.store && (props.store.length > 0)) ? props.store : [MY];

  store.dispatch({
    type: URL_CMD_CERTIFICATES_EXPORT + START,
    // tslint:disable-next-line: object-literal-sort-keys
    payload: {
      expProps: props,
      id,
      operation: URL_CMD_CERTIFICATES_EXPORT,
      url,
    },
  });
  navigationLock();

  const targetLocation = props.multy ? LOCATION_CERTIFICATE_SELECTION_FOR_ENCRYPT
    : LOCATION_CERTIFICATE_SELECTION_FOR_SIGNATURE;

  openWindow(targetLocation, stores[0]);
}

function importCertificate(props: ICertificateOperationProps) {
  const certStore = props.store ? props.store : ["MY"];

  if (!props.certificateBase64) {
    $(".toast-url-cmd-cert-import-fail").remove();
    Materialize.toast(localize("UrlCommand.cert_import_fail", window.locale),
      3000, "toast-url-cmd-cert-import-fail");
    return;
  }
  const certTmpPath = writeCertToTmpFile(props.certificateBase64);

  store.dispatch({
    payload: {
      certPath: certTmpPath,
      impProps: props,
      operation: URL_CMD_CERTIFICATES_IMPORT,
    },
    type: URL_CMD_CERTIFICATES_IMPORT + START,
  });
  navigationLock();

  openWindow(LOCATION_CERTIFICATES, certStore[0]);
}

export function urlCmdCertImportFail() {
  navigationUnlock();
  store.dispatch({type: URL_CMD_CERTIFICATES_IMPORT + FAIL});
  $(".toast-url-cmd-cert-import-fail").remove();
  Materialize.toast(localize("UrlCommand.cert_import_fail", window.locale),
    3000, "toast-url-cmd-cert-import-fail");
}

export function urlCmdCertImportSuccess() {
  navigationUnlock();
  store.dispatch({type: URL_CMD_CERTIFICATES_IMPORT + SUCCESS});
  $(".toast-url-cmd-cert-import-success").remove();
  Materialize.toast(localize("UrlCommand.cert_import_sucess", window.locale),
    3000, "toast-url-cmd-cert-import-success");
}

export function urlCmdSendCert(cert: any, id: string, url: string) {
  const certValue = converCertToPlainBase64(cert);
  postRequest( url, sendCertReq(id, certValue, cert.subjectFriendlyName )).then(
    (data: any) => {
      navigationUnlock();
      store.dispatch({type: URL_CMD_CERTIFICATES_EXPORT + SUCCESS});
      $(".toast-url-cmd-cert-export-success").remove();
      Materialize.toast(localize("UrlCommand.cert_export_sucess", window.locale),
        3000, "toast-url-cmd-cert-export-success");
    },
    (error) => {
      navigationUnlock();
      store.dispatch({type: URL_CMD_CERTIFICATES_EXPORT + FAIL});
      $(".toast-url-cmd-cert-export-fail-err-descr").remove();
      Materialize.toast(error, 3000, "toast-url-cmd-cert-export-fail-err-descr");
      $(".toast-url-cmd-cert-export-fail").remove();
      Materialize.toast(localize("UrlCommand.cert_export_fail", window.locale),
        3000, "toast-url-cmd-cert-export-fail");
    },
  );
}

export function urlCmdSendCerts(certs: any, id: string, url: string) {
  const certificatesToSend = [];
  for (const cert of certs) {
    certificatesToSend.push({
      certificateBase64: converCertToPlainBase64(cert),
      friendlyName: cert.subjectFriendlyName,
    });
  }
  postRequest( url, sendCertsReq(id, certificatesToSend )).then(
    (data: any) => {
      navigationUnlock();
      store.dispatch({type: URL_CMD_CERTIFICATES_EXPORT + SUCCESS});
      $(".toast-url-cmd-certs-export-success").remove();
      Materialize.toast(localize("UrlCommand.certs_export_success", window.locale),
        3000, "toast-url-cmd-certs-export-success");
    },
    (error) => {
      navigationUnlock();
      store.dispatch({type: URL_CMD_CERTIFICATES_EXPORT + FAIL});
      $(".toast-url-cmd-certs-export-fail").remove();
      Materialize.toast(localize("UrlCommand.certs_export_fail", window.locale),
        3000, "toast-url-cmd-certs-export-fail");
    },
  );
}

function converCertToPlainBase64(certToConvert: any) {
  const cert: trusted.pki.Certificate = window.PKISTORE.getPkiObject(certToConvert);
  let result: string = cert.export(trusted.DataFormat.PEM).toString();
  result = result.replace("-----BEGIN CERTIFICATE-----", "");
  result = result.replace("-----END CERTIFICATE-----", "");
  result = result.replace(/\r\n|\n|\r/gm, "");

  return result;
}

export function urlCmdCertExportFail() {
  navigationUnlock();
  store.dispatch({type: URL_CMD_CERTIFICATES_EXPORT + FAIL});
  $(".toast-url-cmd-cert-export-fail").remove();
  Materialize.toast(localize("UrlCommand.certs_export_fail", window.locale),
    3000, "toast-url-cmd-cert-export-fail");
}
