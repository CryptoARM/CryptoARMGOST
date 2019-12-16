import { CERTIFICATES_DSS_JSON, GET_CERTIFICATES_DSS, START, SUCCESS } from "../../app/constants";
import certificatesDSS, { CertificateDSSModel, DefaultReducerState } from "../../app/reducer/certificatesDSS";
import { arrayToMap, mapToArr } from "../../app/utils";
import CERTIFICATES, { certificateMap } from "../__fixtures__/certificates";

const ACTION = {
  payload: {
    certificateMap,
  },
  type: GET_CERTIFICATES_DSS + SUCCESS,
};

describe("reducers", () => {
  describe("certificates DSS", () => {
    it("should return the initial state", () => {
      expect(certificatesDSS(undefined, {})).toEqual(new DefaultReducerState());
    });

    it("POST_AUTHORIZATION_USER_DSS + SUCCESS", () => {
      expect(certificatesDSS(undefined, ACTION)).toEqual(new DefaultReducerState()
      .update("entities", (entities) =>
       entities.merge(arrayToMap(ACTION.payload.certificateMap, CertificateDSSModel))));
    });
  });
});
