import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";
import * as actions from "../../app/AC/dssActions";
import {
  FAIL, GET_CERTIFICATES_DSS, GET_POLICY_DSS, POST_AUTHORIZATION_USER_DSS,
  POST_PERFORM_OPERATION, POST_TRANSACTION_DSS, START, SUCCESS, SIGNATURE_TYPE,
} from "../../app/constants";
import { uuid } from "../../app/utils";
import CERTIFICATES, { certificateMap } from "../__fixtures__/certificates";
import POLICY, { NORMALIZE_POLICY } from "../__fixtures__/policy";
import TOKEN, { INCORRECT_TOKEN } from "../__fixtures__/tokens";
import TRANSACTION, { TRANSACTION_ID } from "../__fixtures__/transactions";

const URL = "https://dss.cryptopro.ru/STS/oauth";
const LOGIN = "test";
const PASSWORD = "password";
const INCORRECT_PASSWORD = "incorrectPassword";
const UID = "051fbf41-3bc5-8c69-9f59-a80e11a5157b";

const DATA = {
  access_token: TOKEN,
  expires_in: 300,
  token_type: "Bearer",
};

const body = "grant_type=password" + "&client_id=" + encodeURIComponent("cryptoarm") + "&scope=dss" +
  "&username=" + encodeURIComponent(LOGIN) + "&password=" + encodeURIComponent(PASSWORD) +
  "&resource=https://dss.cryptopro.ru/SignServer/rest/api/certificates";

actions.postApi = jest.fn((url: string, postfields: any, headerfields: string[]) => {
  if (postfields === body) {
    return Promise.resolve(DATA);
  } else {
    return Promise.reject("Cannot load data");
  }
});

const header = [
  `Authorization: Bearer ${TOKEN}`,
];

actions.getApi = jest.fn((url: string, headerfields: string[]) => {
  if (headerfields[0] === header[0]) {
    return Promise.resolve(CERTIFICATES);
  } else {
    return Promise.reject("Cannot load data");
  }
});

uuid = jest.fn(() => UID);

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe("DSS actions", () => {
  it("creates POST_AUTHORIZATION_USER_DSS + SUCCESS", () => {
    const store = mockStore({});

    const expectedActions = [
      { type: POST_AUTHORIZATION_USER_DSS + START },
      {
        payload: {
          access_token: TOKEN,
          expires_in: 300,
          id: UID,
          token_type: "Bearer",
        },
        type: POST_AUTHORIZATION_USER_DSS + SUCCESS,
      },
    ];

    return store.dispatch(actions.dssPostAuthUser(URL, LOGIN, PASSWORD)).then(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  it("creates POST_AUTHORIZATION_USER_DSS + FAIL", () => {
    const store = mockStore({});

    const expectedActions = [
      { type: POST_AUTHORIZATION_USER_DSS + START },
      {
        type: POST_AUTHORIZATION_USER_DSS + FAIL,
      },
    ];

    return store.dispatch(actions.dssPostAuthUser(URL, LOGIN, INCORRECT_PASSWORD)).then(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  it("creates GET_CERTIFICATES_DSS + SUCCESS", () => {
    const store = mockStore({});

    const expectedActions = [
      { type: GET_CERTIFICATES_DSS + START },
      {
        payload: {
          certificateMap,
        },
        type: GET_CERTIFICATES_DSS + SUCCESS,
      },
    ];

    return store.dispatch(actions.getCertificatesDSS(URL, TOKEN)).then(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  it("creates GET_CERTIFICATES_DSS + FAIL", () => {
    const store = mockStore({});

    const expectedActions = [
      { type: GET_CERTIFICATES_DSS + START },
      {
        payload: {
          error: "Cannot load data",
        },
        type: GET_CERTIFICATES_DSS + FAIL,
      },
    ];

    return store.dispatch(actions.getCertificatesDSS(URL, INCORRECT_TOKEN)).then(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  it("creates GET_POLICY_DSS + SUCCESS", () => {
    actions.getApi = jest.fn((url: string, headerfields: string[]) => {
      if (headerfields[0] === header[0]) {
        return Promise.resolve(POLICY);
      } else {
        return Promise.reject("Cannot load data");
      }
    });

    const store = mockStore({});

    const expectedActions = [
      { type: GET_POLICY_DSS + START },
      {
        payload: {
          id: UID,
          policy: NORMALIZE_POLICY,
        },
        type: GET_POLICY_DSS + SUCCESS,
      },
    ];

    return store.dispatch(actions.getPolicyDSS(URL, TOKEN)).then(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  it("creates POST_TRANSACTION_DSS + SUCCESS", () => {
    actions.postApi = jest.fn((url: string, postfields: any, headerfields: string[]) => {
      if (postfields === JSON.stringify(TRANSACTION)) {
        return Promise.resolve(TOKEN);
      } else {
        return Promise.reject("Cannot load data");
      }
    });

    const store = mockStore({});

    const expectedActions = [
      { type: POST_TRANSACTION_DSS + START },
      {
        payload: {
          id: TOKEN,
        },
        type: POST_TRANSACTION_DSS + SUCCESS,
      },
    ];

    return store.dispatch(actions.createTransactionDSS(URL, TOKEN, TRANSACTION)).then(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  it("creates POST_TRANSACTION_DSS + SUCCESS", () => {
    actions.postApi = jest.fn((url: string, postfields: any, headerfields: string[]) => Promise.resolve({
      AccessToken: DATA.access_token,
      ExpiresIn: DATA.expires_in,
      IsFinal: true,
    }));

    const store = mockStore({});

    const expectedActions = [
      { type: POST_AUTHORIZATION_USER_DSS + START },
      {
        payload: {
          access_token: TOKEN,
          expires_in: 300,
          id: UID,
        },
        type: POST_AUTHORIZATION_USER_DSS + SUCCESS,
      },
    ];

    return store.dispatch(actions.dssOperationConfirmation(URL, TOKEN, TRANSACTION_ID)).then(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });
  });

  it("creates POST_TRANSACTION_DSS + SUCCESS", () => {
    actions.postApi = jest.fn((url: string, postfields: any, headerfields: string[]) => Promise.resolve("MIIE2wYJKoZIhvc"));

    const BODY_SIG: IDocumentDSS = {
      Content: "VBERi0xLjUNCiW1tbW14Kfu",
      Name: "test",
      Signature: {
        Type: SIGNATURE_TYPE.CAdES,
        Parameters: {
          CADESType: "BES",
          IsDetached: "false",
        },
        CertificateId: 1,
        PinCode: "",
      },
    };

    const store = mockStore({});

    const expectedActions = [
      { type: POST_PERFORM_OPERATION + START },
      {
        payload: {
          id: "MIIE2wYJKoZIhvc",
        },
        type: POST_PERFORM_OPERATION + SUCCESS,
      },
    ];

    return store.dispatch(actions.dssPerformOperation(URL, TOKEN, BODY_SIG)).then(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});
