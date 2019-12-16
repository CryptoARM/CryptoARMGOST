import * as fs from "fs";
import { OrderedMap, Record } from "immutable";
import {
  CERTIFICATES_DSS_JSON, DELETE_CERTIFICATE, FAIL,
  GET_CERTIFICATES_DSS, POST_AUTHORIZATION_USER_DSS, START, SUCCESS,
} from "../constants";
import { arrayToMap, mapToArr } from "../utils";

export const CertificateDSSModel = Record({
  active: null,
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
  notAfter: null,
  notBefore: null,
  organizationName: null,
  publicKeyAlgorithm: null,
  serial: null,
  signatureAlgorithm: null,
  signatureDigestAlgorithm: null,
  status: null,
  subjectFriendlyName: null,
  subjectName: null,
  verified: null,
  version: null,
  x509: null,
});

export const DefaultReducerState = Record({
  entities: OrderedMap({}),
  loaded: false,
  loading: false,
});

export default (certificatesDSS = new DefaultReducerState(), action) => {
  const { type, payload } = action;
  switch (type) {
    case POST_AUTHORIZATION_USER_DSS + START:
    case GET_CERTIFICATES_DSS + START:
      return certificatesDSS.set("loading", true);

    case GET_CERTIFICATES_DSS + SUCCESS:
      certificatesDSS = certificatesDSS
        .setIn(["entities", payload.dssUserID], arrayToMap(payload.certificateMap, CertificateDSSModel))
        .set("loading", false)
        .set("loaded", true);
      break;

    case POST_AUTHORIZATION_USER_DSS + FAIL:
    case GET_CERTIFICATES_DSS + FAIL:
      return certificatesDSS = certificatesDSS
        .set("loading", false)
        .set("loaded", true);

    case DELETE_CERTIFICATE:
      certificatesDSS = certificatesDSS.deleteIn(["entities", payload.dssUserID, payload.id]);
      break;
  }

  if (type === GET_CERTIFICATES_DSS + SUCCESS && CERTIFICATES_DSS_JSON ||
    type === DELETE_CERTIFICATE && CERTIFICATES_DSS_JSON) {
    const state = {
      certificatesDSS: certificatesDSS.entities,
    };

    const sstate = JSON.stringify(state, null, 4);

    fs.writeFile(CERTIFICATES_DSS_JSON, sstate, (err: any) => {
      if (err) {
        // tslint:disable-next-line:no-console
        console.log("------- error write to ", CERTIFICATES_DSS_JSON);
      }
    });
  }

  return certificatesDSS;
};
