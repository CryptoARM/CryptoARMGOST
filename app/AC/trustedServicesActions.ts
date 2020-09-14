import { ADD_TRUSTED_SERVICE, DELETE_TRUSTED_SERVICE, HIDE_MODAL_ADD_TRUSTED_SERVICE, SHOW_MODAL_ADD_TRUSTED_SERVICE } from "../constants";
import { uuid } from "../utils";
import { certificateToPkiItemInfo } from "./urlCmdCertInfo";

export function addTrustedService(service: string, cert: string) {
  const pkiCertificate = new trusted.pki.Certificate();

  try {
    pkiCertificate.import(Buffer.from(cert), trusted.DataFormat.PEM);
  } catch (e) {
    // tslint:disable-next-line: no-console
    console.log("Error addTrustedService", e);
    return;
  }

  const pkiItemCert = certificateToPkiItemInfo(pkiCertificate);
  pkiItemCert.x509 = cert;

  return {
    payload: {
      certificate: pkiItemCert,
      id: uuid(),
      service,
    },
    type: ADD_TRUSTED_SERVICE,
  };
}

export function showModalAddTrustedService(
  serviceUrl: string,
  cert?: trusted.pki.Certificate,
) {
  return {
    payload: {
      cert,
      urlToCheck: serviceUrl,
    },
    type: SHOW_MODAL_ADD_TRUSTED_SERVICE,
  };
}

export function hideModalAddTrustedService() {
  return {
    type: HIDE_MODAL_ADD_TRUSTED_SERVICE,
  };
}

export function deleteTrustedService(url: string) {
  return {
    payload: {
      url,
    },
    type: DELETE_TRUSTED_SERVICE,
  };
}
