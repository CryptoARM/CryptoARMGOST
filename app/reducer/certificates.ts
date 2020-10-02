import { OrderedMap, Record } from "immutable";
import {
  ADD_SERVICE_CERTIFICATE, DELETE_CERTIFICATE, DELETE_SERVICE, LOAD_ALL_CERTIFICATES,
  REMOVE_ALL_CERTIFICATES, START, SUCCESS, VERIFY_CERTIFICATE, GET_CERTIFICATES_DSS, RESET_DSS_CERTIFICATES_VERIFIED
} from "../constants";
import { arrayToMap } from "../utils";

export const CertificateModel = Record({
  active: false,
  category: null,
  dssCertID: null,
  dssUserID: null,
  format: null,
  hasPin: null,
  hash: null,
  id: null,
  issuerFriendlyName: null,
  issuerName: null,
  key: null,
  keyUsageString: null,
  notAfter: null,
  notBefore: null,
  organizationName: null,
  provider: null,
  publicKeyAlgorithm: null,
  serial: null,
  service: null,
  serviceId: null,
  signatureAlgorithm: null,
  signatureDigestAlgorithm: null,
  status: false,
  subjectFriendlyName: null,
  subjectName: null,
  type: null,
  uri: null,
  verified: false,
  version: null,
  x509: null,
});

export const DefaultReducerState = Record({
  entities: OrderedMap({}),
  loaded: false,
  loading: false,
});

export default (certificates = new DefaultReducerState(), action) => {
  const { type, certs, payload } = action;
  switch (type) {
    case LOAD_ALL_CERTIFICATES + START:
      return certificates.set("loading", true);

    case LOAD_ALL_CERTIFICATES + SUCCESS:
      return certificates
        .update("entities", (entities) => arrayToMap(certs, CertificateModel).merge(entities))
        .set("loading", false)
        .set("loaded", true);

    case VERIFY_CERTIFICATE:
      return certificates
        .setIn(["entities", payload.certificateId, "status"], payload.certificateStatus)
        .setIn(["entities", payload.certificateId, "verified"], true);

    case REMOVE_ALL_CERTIFICATES:
      const allServicesCerts = certificates.get("entities").filter((certificate: any) => certificate.dssUserID !== null);
      return certificates = new DefaultReducerState().setIn(["entities"], allServicesCerts);

    case RESET_DSS_CERTIFICATES_VERIFIED:
      return certificates
      .setIn(["entities", payload, "verified"], false);

    case ADD_SERVICE_CERTIFICATE:
      return certificates
        .setIn(["entities", payload.certificate.id], new CertificateModel(payload.certificate));

    case DELETE_SERVICE:
      const certificatesFromService = certificates.get("entities").filter((certificate: any) => certificate.serviceId === payload.id);
      certificatesFromService.forEach((certificate: any) => certificates = certificates.deleteIn(["entities", certificate.id]));

      return certificates;

    case DELETE_CERTIFICATE:
      return certificates.deleteIn(["entities", payload.id]);

    case GET_CERTIFICATES_DSS + SUCCESS:
      return certificates
        .update("entities", (entities) => entities.merge(arrayToMap(payload.certificateMap, CertificateModel)))
        .set("loading", false)
        .set("loaded", true);
  }

  return certificates;
};
