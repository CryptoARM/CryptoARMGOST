import {
  FAIL, LOCATION_CERTIFICATE_SELECTION_FOR_ENCRYPT,
  LOCATION_CERTIFICATE_SELECTION_FOR_SIGNATURE, LOCATION_CERTIFICATES, MY,
  START, SUCCESS, URL_CMD_CERTIFICATES_EXPORT, URL_CMD_CERTIFICATES_IMPORT,
} from "../constants";
import localize from "../i18n/localize";
import { IUrlCommandApiV4Type } from "../parse-app-url";
import store from "../store";
import { navigationLock, navigationUnlock } from "./globalLocks";
import { finishCurrentUrlCmd } from "./urlActions";
import { certificateInfo } from "./urlCmdCertInfo";
import {
  displayWarningMessage, openWindow, paramsRequest,
  postRequest, removeWarningMessage, writeCertToTmpFile,
} from "./urlCmdUtils";

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

function paramsRequestCerts(id: string) {
  return JSON.stringify(paramsRequest("certificates.parameters", id));
}

function sendCertReq(id: string, certificate: string, friendlyName: string) {
  return JSON.stringify({
    jsonrpc: "2.0",
    method: "certificates.base64",
    params: {
      id,
      // tslint:disable-next-line: object-literal-sort-keys
      certificateBase64: certificate,
      friendlyName,
    },
  });
}

function sendCertsReq(id: string, certificates: ICertToExport[]) {
  return JSON.stringify({
    jsonrpc: "2.0",
    method: "certificates.base64",
    params: {
      id,
      // tslint:disable-next-line: object-literal-sort-keys
      certificates,
    },
  });
}

export function handleUrlCommandCertificates( command: IUrlCommandApiV4Type ) {
  postRequest(command.url, paramsRequestCerts(command.id)).then(
    (data: any) => {
      const operation = data.result.operation;
      const props = data.result.props;
      displayWarningMessage(command.command, command.url, operation);
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
      }
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
  store.dispatch(finishCurrentUrlCmd(false));
  store.dispatch({type: URL_CMD_CERTIFICATES_IMPORT + FAIL});
  removeWarningMessage();
  $(".toast-url-cmd-cert-import-fail").remove();
  Materialize.toast(localize("UrlCommand.cert_import_fail", window.locale),
    3000, "toast-url-cmd-cert-import-fail");
}

export function urlCmdCertImportSuccess() {
  navigationUnlock();
  store.dispatch(finishCurrentUrlCmd());
  store.dispatch({type: URL_CMD_CERTIFICATES_IMPORT + SUCCESS});
  removeWarningMessage();
  $(".toast-url-cmd-cert-import-success").remove();
  Materialize.toast(localize("UrlCommand.cert_import_sucess", window.locale),
    3000, "toast-url-cmd-cert-import-success");
}

export function urlCmdSendCert(cert: any, id: string, url: string) {
  const certValue = converCertToPlainBase64(cert);
  postRequest( url, sendCertReq(id, certValue, cert.subjectFriendlyName )).then(
    (data: any) => {
      navigationUnlock();
      store.dispatch(finishCurrentUrlCmd());
      store.dispatch({type: URL_CMD_CERTIFICATES_EXPORT + SUCCESS});
      removeWarningMessage();
      $(".toast-url-cmd-cert-export-success").remove();
      Materialize.toast(localize("UrlCommand.cert_export_sucess", window.locale),
        3000, "toast-url-cmd-cert-export-success");
    },
    (error) => {
      navigationUnlock();
      store.dispatch(finishCurrentUrlCmd(false));
      store.dispatch({type: URL_CMD_CERTIFICATES_EXPORT + FAIL});
      removeWarningMessage();
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
      store.dispatch(finishCurrentUrlCmd());
      store.dispatch({type: URL_CMD_CERTIFICATES_EXPORT + SUCCESS});
      removeWarningMessage();
      $(".toast-url-cmd-certs-export-success").remove();
      Materialize.toast(localize("UrlCommand.certs_export_success", window.locale),
        3000, "toast-url-cmd-certs-export-success");
    },
    (error) => {
      navigationUnlock();
      store.dispatch(finishCurrentUrlCmd(false));
      store.dispatch({type: URL_CMD_CERTIFICATES_EXPORT + FAIL});
      removeWarningMessage();
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
