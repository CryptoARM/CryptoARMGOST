import * as fs from "fs";
import { OrderedMap, Record } from "immutable";
import { DSS_CERTIFICATES_JSON, DSS_GET_CERTIFICATES, START, SUCCESS, } from "../constants";
import { arrayToMap, mapToArr } from "../utils";

export const DSSCertificateModel = Record({
  id: null,
  DName: null,
  CertificateBase64: null,
  Status: null,
  IsDefault: null,
  CertificateAuthorityID: null,
  CspID: null,
  HashAlgorithms: null,
  ProviderName: null,
  ProviderType: null,
  PrivateKeyNotBefore: null,
  PrivateKeyNotAfter: null,
  HasPin: null,
  FriendlyName: null,
});

export const DefaultReducerState = Record({
  entities: OrderedMap({}),
});

export default (DSSCertificates = new DefaultReducerState(), action) => {
  const { type, payload } = action;
  switch (type) {
    case DSS_GET_CERTIFICATES + SUCCESS:
      console.log(payload.certificateMap);
      DSSCertificates = DSSCertificates
        .update("entities", (entities) => entities.merge(arrayToMap(payload.certificateMap, DSSCertificateModel)));
      break;
  }

  if (type === DSS_GET_CERTIFICATES + SUCCESS) {
    const state = {
      DSSCertificates: mapToArr(DSSCertificates.entities),
    };

    const sstate = JSON.stringify(state, null, 4);

    fs.writeFile(DSS_CERTIFICATES_JSON, sstate, (err: any) => {
      if (err) {
        // tslint:disable-next-line:no-console
        console.log("------- error write to ", DSS_CERTIFICATES_JSON);
      }
    });
  }

  return DSSCertificates;
};
