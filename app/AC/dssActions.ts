import * as os from "os";
import {
  CREATE_TEMP_USER_DSS, DELETE_CERTIFICATE, FAIL, GET_CERTIFICATES_DSS,
  GET_POLICY_DSS, POST_AUTHORIZATION_USER_DSS, POST_OPERATION_CONFIRMATION,
  POST_PERFORM_OPERATION, POST_TRANSACTION_DSS, RESPONSE,
  START, SUCCESS, USER_NAME,
} from "../constants";
import { uuid } from "../utils";
import logger from "../winstonLogger";

/**
 * Фукнция генерации стуктуры сертификата DSS
 * @param {trusted.pki.Certificate} certificate объект trusted.pki.Certificate
 * @param certificateProps данные о сертификате, полученные в ходе запроса на Сервис Подписи
 * @param dssUserID идентификатор пользователя
 */
export function addServiceCertificate(certificate: trusted.pki.Certificate, certificateProps: any, dssUserID: string) {
  return {
    active: false,
    category: "MY",
    dssCertID: certificateProps.ID,
    dssUserID,
    format: "PEM",
    hasPin: certificateProps.HasPin,
    hash: certificate.thumbprint,
    id: `${certificateProps.ID}_${dssUserID}`,
    issuerFriendlyName: certificate.issuerFriendlyName,
    issuerName: certificate.issuerName,
    key: "1",
    notAfter: certificate.notAfter,
    notBefore: certificate.notBefore,
    organizationName: certificate.organizationName,
    publicKeyAlgorithm: certificate.publicKeyAlgorithm,
    serial: certificate.serialNumber,
    signatureAlgorithm: certificate.signatureAlgorithm,
    signatureDigestAlgorithm: certificate.signatureDigestAlgorithm,
    status: false,
    subjectFriendlyName: certificate.subjectFriendlyName,
    subjectName: certificate.subjectName,
    verified: false,
    version: certificate.version,
    x509: certificate.export(trusted.DataFormat.PEM).toString(),
  };
}

export function deleteDssCertificate(id: string, dssUserID: string) {
  return {
    payload: {
      dssUserID,
      id,
    },
    type: DELETE_CERTIFICATE,
  };
}

/**
 * Отправка POST запроса
 * @param url адрес электронного ресурса, на который отправляется POST запрос
 * @param postfields тело POST запроса
 * @param headerfields заголовок POST запроса
 */
export const postApi = async (url: string, postfields: string, headerfields: string[]) => {
  return new Promise((resolve, reject) => {
    const curl = new window.Curl();
    curl.setOpt("URL", url);
    curl.setOpt("TIMEOUT", 600);
    curl.setOpt("FOLLOWLOCATION", true);
    curl.setOpt(window.Curl.option.HTTPHEADER, headerfields);

    if (postfields) {
      curl.setOpt(window.Curl.option.POSTFIELDS, postfields);
    }
    curl.on("end", function (statusCode: number, response: any) {
      let data;
      try {

        if (statusCode !== 200) {
          throw new Error(`Неожиданный ответ, код ${statusCode}`);
        }
        data = JSON.parse(response.toString());
      } catch (error) {
        reject(`Ошибка загрузки данных: ${error.message}`);
        return;
      } finally {
        curl.close();
      }
      resolve(data);
    });
    curl.on("error", (error: { message: any; }) => {
      curl.close();
      reject(new Error(`Ошибка загрузки данных по URL ${url}, ошибка: ${error.message}`));
    });
    curl.perform();
  });
};

/**
 * Отправка GET запроса
 * @param url адрес электронного ресурса, на который отправляется GET запрос
 * @param headerfields заголовок GET запроса
 */
export const getApi = async (url: string, headerfields: string[]) => {
  return new Promise((resolve, reject) => {
    const curl = new window.Curl();
    curl.setOpt("URL", url);
    curl.setOpt("FOLLOWLOCATION", true);
    curl.setOpt(window.Curl.option.HTTPHEADER, headerfields);
    curl.on("end", function (statusCode: number, response: { toString: () => string; }) {
      let data;
      try {
        if (statusCode !== 200) {
          throw new Error(`Неожиданный ответ, код ${statusCode}`);
        }
        data = JSON.parse(response.toString());
      } catch (error) {
        reject(`Ошибка загрузки данных: ${error.message}`);
        return;
      } finally {
        curl.close();
      }
      resolve(data);
    });
    curl.on("error", (error: { message: any; }) => {
      curl.close();
      reject(new Error(`Ошибка загрузки данных по URL ${url}, ошибка: ${error.message}`));
    });
    curl.perform();
  });
};

function postAuthorizationUserSuccess(type: string, body: any, dssUserID: string) {
  return {
    payload: {
      access_token: body.AccessToken,
      expires_in: body.ExpiresIn,
      id: dssUserID,
    },
    type: type + SUCCESS,
  };
}

function postAuthorizationUserFail(type: string, error: string) {
  return {
    payload: {
      error,
    },
    type: type + FAIL,
  };
}

/**
 * Функция формирования и отправки запроса к ЦИ на инициализацию процедуры аутентификации
 * @param {IUserDSS} user структура с данными о пользователе
 */
export function dssAuthIssue(user: IUserDSS) {
  return async (dispatch) => {
    dispatch({
      payload: {
        authUrl: user.authUrl,
        dssUrl: user.dssUrl,
        id: user.id,
        login: user.user,
        confApiVersion: user.confApiVersion,
      },
      type: CREATE_TEMP_USER_DSS + START,
    });
    let headerfield: string[];
    let body: any;
    const password_value = user.password ? user.password : "";
    headerfield = [
      "Content-Type: application/json; charset=utf-8",
      `Authorization: Basic ${Buffer.from(user.user + ":" + password_value).toString("base64")}`,
    ];
    body = {
      Resource: "urn:cryptopro:dss:signserver:signserver",
    };
    return dispatch(
      dssPostMFAUser(user.authUrl.replace("/oauth", (user.confApiVersion === "v2.0") ? "/v2.0/confirmation" : "/confirmation"), headerfield, body, user.id, POST_AUTHORIZATION_USER_DSS),
    );
  };
}

/**
 * Функция подтверждения операции (транзакции)
 * @param url электронный адрес Сервиса Подписи
 * @param token маркер доступа
 * @param TransactionTokenId идентификатор транзакции, созданной на Cервисе Подписи
 * @param dssUserID идентификатор пользователя
 * @param {string} [offlineCode] код, для подтверждения транзакации оффлайн
 */
export function dssOperationConfirmation(url: string, token: string, TransactionTokenId: string, dssUserID: string, offlineCode?: string) {
  return async (dispatch) => {
    let headerfield: string[];
    let body: any;
    headerfield = [
      "Content-Type: application/json; charset=utf-8",
      `Authorization: Bearer ${token}`,
    ];
    body = {
      Resource: "urn:cryptopro:dss:signserver:signserver",
      TransactionTokenId,
    };
    return dispatch(dssPostMFAUser(url, headerfield, body, dssUserID, POST_OPERATION_CONFIRMATION));
  };
}

/**
 * Функция обычной и двухфакторной аутентификации
 * @param url электронный адрес Сервиса Подписи
 * @param headerfield заголовок запроса, содержащий в себе базовые аутентификационные данные пользователя
 * @param body объект, содержащий идентификатор ресурса и транзакции (при подтверждения операции)
 * @param dssUserID идентификатор пользователя
 * @param type action
 * @param {any} [cResponse] используется оффлайн подтверждение
 */
export function dssPostMFAUser(url: string, headerfield: string[], body: any, dssUserID: string, type: string, cResponse?: any) {
  return async (dispatch) => {
    dispatch({
      type: type + START,
    });

    let data1: any;
    let data2: any;

    try {
      if (!cResponse) {
        data1 = await postApi(
          `${url}`,
          JSON.stringify(body),
          headerfield,
        );
      }
      if (data1 && data1.IsFinal === true) {
        if (!data1.IsError) {
          dispatch(postAuthorizationUserSuccess(type, data1, dssUserID));
          return data1;
        } else {
          dispatch(postAuthorizationUserFail(type, data1.ErrorDescription));
          return data1;
        }
      } else {
        if (data1) {
          dispatch({
            payload: {
              Headerfield: headerfield.slice(),
              Image: data1.Challenge.TextChallenge[0].Image ? data1.Challenge.TextChallenge[0].Image.Value : "",
              Label: data1.Challenge.TextChallenge[0].Label,
              RefID: data1.Challenge.ContextData.RefID,
              Title: data1.Challenge.Title.Value,
            },
            type: type + RESPONSE,
          });
        }

        const challengeResponse = cResponse ? cResponse : {
          ChallengeResponse:
          {
            TextChallengeResponse:
              [
                {
                  RefId: `${data1.Challenge.ContextData.RefID}`,
                },
              ],
          },
          Resource: "urn:cryptopro:dss:signserver:signserver",
        };

        const RefID = challengeResponse.ChallengeResponse.TextChallengeResponse[0].RefId;

        const deploy: number = 10000;
        let timeout: number = 0;
        let timerHandle: NodeJS.Timeout | null;

        return await new Promise((resolve, reject) => {
          timerHandle = setInterval(async () => {
            timeout += deploy;
            if (data1 && timeout >= (data1.Challenge.TextChallenge["0"].ExpiresIn * 1000)) {
              dispatch(postAuthorizationUserFail(type, "Время ожидания подтверждения истекло"));
              dispatch({
                payload: {
                  RefID,
                },
                type: type + RESPONSE + FAIL,
              });
              if (timerHandle) {
                clearInterval(timerHandle);
                timerHandle = null;
                reject("Время ожидания подтверждения истекло");
              }
            }

            data2 = await postApi(
              `${url}`,
              JSON.stringify(challengeResponse),
              headerfield,
            )
              .catch((error) => {
                dispatch(postAuthorizationUserFail(type, error));
                dispatch({
                  payload: {
                    RefID,
                  },
                  type: type + RESPONSE + FAIL,
                });
                if (timerHandle) {
                  clearInterval(timerHandle);
                  timerHandle = null;
                  reject(error);
                }
              });
            if (data2.IsFinal === true && !data2.IsError) {
              dispatch(postAuthorizationUserSuccess(type, data2, dssUserID));
              dispatch({
                payload: {
                  RefID,
                },
                type: type + RESPONSE + SUCCESS,
              });
              if (timerHandle) {
                clearInterval(timerHandle);
                timerHandle = null;
                resolve(data2);
              }
            } else if (data2.IsError === true) {
              dispatch(postAuthorizationUserFail(type, data2.ErrorDescription));
              dispatch({
                payload: {
                  RefID,
                },
                type: type + RESPONSE + FAIL,
              });
              if (timerHandle) {
                clearInterval(timerHandle);
                timerHandle = null;
                reject(data2.ErrorDescription);
              }
            }
          }, 10000);
        });
      }
    } catch (e) {
      dispatch(postAuthorizationUserFail(type, e));
      dispatch({
        type: type + RESPONSE + FAIL,
      });
      throw new Error(e);
    }
  };
}

/**
 * Функция обычной аутентификации пользователя
 * @param url электронный адрес Сервиса Подписи
 * @param login логин пользователя
 * @param password пароль пользователя
 */
export function dssPostAuthUser(url: string, login: string, password: string) {
  return async (dispatch) => {
    dispatch({
      type: POST_AUTHORIZATION_USER_DSS + START,
    });

    let data: any;
    let body: string;

    try {
      body = "grant_type=password" + "&client_id=" + encodeURIComponent("cryptoarm") + "&scope=dss" +
        "&username=" + encodeURIComponent(login) + "&password=" + encodeURIComponent(password) +
        "&resource=https://dss.cryptopro.ru/SignServer/rest/api/certificates";
      data = await postApi(
        `${url}/token`,
        body,
        [
          "Content-Type: application/x-www-form-urlencoded",
        ],
      );
      dispatch({
        payload: {
          access_token: data.access_token,
          expires_in: data.expires_in,
          id: uuid(),
          token_type: data.token_type,
        },
        type: POST_AUTHORIZATION_USER_DSS + SUCCESS,
      });
    } catch (e) {
      dispatch({
        type: POST_AUTHORIZATION_USER_DSS + FAIL,
      });
      throw new Error(e);
    }
  };
}

/**
 * Функция получения сертификатов пользователя Сервиса Подписи
 * @param url электронный адрес Сервиса Подписи
 * @param dssUserID идентификатор пользователя
 * @param token маркер доступа
 */
export function getCertificatesDSS(url: string, dssUserID: string, token: string) {
  return async (dispatch) => {
    dispatch({
      type: GET_CERTIFICATES_DSS + START,
    });

    let data: any;
    try {
      // https://dss.cryptopro.ru/SignServer/rest
      data = await getApi(
        `${url}/api/certificates`,
        [
          `Authorization: Bearer ${token}`,
        ],
      );
      const hcertificates: any[] = [];
      for (const certificate of data) {
        const cert = new trusted.pki.Certificate();
        cert.import(Buffer.from(certificate.CertificateBase64), trusted.DataFormat.PEM);
        hcertificates.push(addServiceCertificate(cert, certificate, dssUserID));
      }
      dispatch({
        payload: {
          certificateMap: hcertificates,
          dssUserID,
        },
        type: GET_CERTIFICATES_DSS + SUCCESS,
      });

      if ( data.certificate !== 0) {
      for (const certificate of data) {
        logger.log({
          certificate: certificate.DName,
          level: "info",
          message: "",
          operation: "Импорт сертификата",
          operationObject: {
            in: certificate.DName,
            out: "Null",
          },
          userName: USER_NAME,
        });
        }
      } else {
        logger.log({
          level: "error",
          message: "Сертификаты отсутствуют",
          operation: "Импорт сертификата",
          operationObject: {
            in: "CN=" + "Сертификаты отсутствуют",
            out: "Null",
          },
          userName: USER_NAME,
        });
      }

    } catch (e) {

      logger.log({
        level: "error",
        message: "Ошибка получения сертификатов",
        operation: "Импорт сертификата",
        operationObject: {
          in: "CN=" ,
          out: "Null",
        },
        userName: USER_NAME,
      });

      dispatch({
        type: GET_CERTIFICATES_DSS + FAIL,
        payload: {
          error: e,
        },
      });
      throw new Error(e);
    }
  };
}

/**
 * Функция получения политики Сервиса Подписи
 * @param url электронный адрес Сервиса Подписи
 * @param dssUserID идентификатор пользователя
 * @param token маркер доступа
 */
export function getPolicyDSS(url: string, dssUserID: string, token: string) {
  return async (dispatch) => {
    dispatch({
      type: GET_POLICY_DSS + START,
    });

    let data: any;
    try {
      // https://dss.cryptopro.ru/SignServer/rest
      data = await getApi(
        `${url}/api/policy`,
        [
          `Authorization: Bearer ${token}`,
        ],
      );
      const policy = data.ActionPolicy.filter(function (item: any) {
        return item.Action === "Issue" || item.Action === "SignDocument" || item.Action === "SignDocuments";
      });
      dispatch({
        payload: {
          id: dssUserID,
          policy,
        },
        type: GET_POLICY_DSS + SUCCESS,
      });
      return policy;
    } catch (e) {
      dispatch({
        type: GET_POLICY_DSS + FAIL,
        payload: {
          error: e,
        },
      });
      throw new Error(e);
    }
  };
}

/**
 * Функция создания транзакции на Сервисе Подписи
 * @param url электронный адрес Сервиса Подписи
 * @param token маркер доступа
 * @param {ITransaction} body объект, содержащий параметры транзакции
 */
export function createTransactionDSS(url: string, token: string, body: ITransaction, fileId: string[]) {
  return async (dispatch) => {
    dispatch({
      type: POST_TRANSACTION_DSS + START,
    });

    let data: any;
    try {
      // https://dss.cryptopro.ru/STS/oauth
      data = await postApi(
        `${url}/api/transactions`,
        JSON.stringify(body),
        [
          `Authorization: Bearer ${token}`,
          "Content-Type: application/json; charset=utf-8",
        ],
      );
      dispatch({
        payload: {
          fileId,
          id: data,
        },
        type: POST_TRANSACTION_DSS + SUCCESS,
      });
      return data;
    } catch (e) {
      dispatch({
        type: POST_TRANSACTION_DSS + FAIL,
        payload: {
          error: e,
        },
      });
      throw new Error(e);
    }
  };
}

/**
 * Функция выполнения и получения результата операции на Сервисе Подписи
 * @param url электронный адрес Сервиса Подписи
 * @param token маркер доступа
 * @param {IDocumentDSS | IDocumentPackageDSS} body объект, содержащий информацию о документе или пакете документов
 */
export function dssPerformOperation(url: string, token: string, body?: IDocumentDSS | IDocumentPackageDSS) {
  return async (dispatch) => {
    dispatch({
      type: POST_PERFORM_OPERATION + START,
    });
    let data: any;
    try {
      data = await postApi(
        `${url}`,
        body ? JSON.stringify(body) : "{}",
        [
          `Authorization: Bearer ${token}`,
          "Content-Type: application/json; charset=utf-8",
        ],
      );
      dispatch({
        payload: {
          id: data,
        },
        type: POST_PERFORM_OPERATION + SUCCESS,
      });
      return data;
    } catch (e) {
      dispatch({
        type: POST_PERFORM_OPERATION + FAIL,
        payload: {
          error: e,
        },
      });
      throw new Error(e);
    }
  };
}
