import * as os from "os";
import {
  DSS_GET_CERTIFICATES, DSS_POST_AUTHORIZATION_USER, FAIL, START, SUCCESS,
} from "../constants";
import { uuid } from "../utils";

export async function postApi(url: string, postfields: any, headerfields: string[]) {
  return new Promise((resolve, reject) => {
    const curl = new window.Curl();
    curl.setOpt("URL", url);
    curl.setOpt("FOLLOWLOCATION", true);
    curl.setOpt(window.Curl.option.HTTPHEADER, headerfields);
    curl.setOpt(window.Curl.option.POSTFIELDS, postfields);
    curl.on("end", function(statusCode: number, response: any) {
      let data;
      try {

        if (statusCode !== 200) {
          throw new Error(`Unexpected response, status code ${statusCode}`);
        }
        data = JSON.parse(response.toString());
      } catch (error) {
        console.log(response);
        reject(`Cannot load data, error: ${error.message}`);
        return;
      } finally {
        curl.close.bind(curl);
      }
      resolve(data);
    });
    curl.on("error", (error: { message: any; }) => {
      curl.close.bind(curl);
      reject(new Error(`Cannot load data by url ${url}, error: ${error.message}`));
    });
    curl.perform();
  });
}

export async function getApi(url: string, headerfields: string[]) {
  return new Promise((resolve, reject) => {
    const curl = new window.Curl();
    curl.setOpt("URL", url);
    curl.setOpt("FOLLOWLOCATION", true);
    curl.setOpt(window.Curl.option.HTTPHEADER, headerfields);
    curl.on("end", function(statusCode: number, response: { toString: () => string; }) {
      let data;
      try {
        if (statusCode !== 200) {
          throw new Error(`Unexpected response, status code ${statusCode}`);
        }
        data = JSON.parse(response.toString());
      } catch (error) {
        reject(`Cannot load data, error: ${error.message}`);
        return;
      } finally {
        curl.close.bind(curl);
      }
      resolve(data);
    });
    curl.on("error", (error: { message: any; }) => {
      curl.close.bind(curl);
      reject(new Error(`Cannot load data by url ${url}, error: ${error.message}`));
    });
    curl.perform();
  });
}

export function dssPostMFAAuthUser(url: string, login: string, password: string) {
  return (dispatch) => {
    dispatch({
      type: DSS_POST_AUTHORIZATION_USER + START,
    });

    setTimeout(async () => {
      let data1: any;
      let data2: any;
      const body = {
        Resource: "urn:cryptopro:dss:signserver:signserver",
      };

      try {
        // https://dss.cryptopro.ru/STS/confirmation
        data1 = await postApi(
          `${url}`,
          JSON.stringify(body),
          [
            "Content-Type: application/x-www-form-urlencoded",
            `Authorization: Basic ${Buffer.from(login + ":" + password).toString("base64")}`,
          ],
        );
        if ( data1.IsFinal === true ) {
          dispatch({
            payload: {
              access_token: data1.AccessToken,
              expires_in: data1.ExpiresIn,
              id: uuid(),
            },
            type: DSS_POST_AUTHORIZATION_USER + SUCCESS,
          });
        } else {
          const challengeResponse = {
            Resource: "urn:cryptopro:dss:signserver:signserver",
            ChallengeResponse:
            {
              TextChallengeResponse:
              [{
                RefId: `${data1.Challenge.ContextData.RefID}`},
              ],
            },
          };
          const deploy: number = 10000;
          var timeout: number = 0;
          var timerHandle: NodeJS.Timeout | null;
          timerHandle = setTimeout(async function req() {
            timeout += deploy;
            if (timeout >= (data1.Challenge.TextChallenge["0"].ExpiresIn * 1000)) {
              Materialize.toast(`Время ожидания подтверждения истекло`, 4000, "toast-ca_error");
              dispatch({
                type: DSS_POST_AUTHORIZATION_USER + FAIL,
              });
              if ( timerHandle instanceof NodeJS.Timeout ) {
                clearTimeout(timerHandle);
              }
              timerHandle = null;
            }
            data2 = await postApi(
              `${url}`,
              JSON.stringify(challengeResponse),
              [
                `Authorization: Basic ${Buffer.from(login + ":" + password).toString("base64")}`,
              ],
            );
            if ( data2.IsFinal === true ) {
              dispatch({
                payload: {
                  access_token: data2.AccessToken,
                  expires_in: data2.ExpiresIn,
                  id: uuid(),
                },
                type: DSS_POST_AUTHORIZATION_USER + SUCCESS,
              });
              if ( timerHandle instanceof NodeJS.Timeout ) {
                clearTimeout(timerHandle);
              }
              timerHandle = null;
            } else if (data2.IsError === true) {
              Materialize.toast(data2.ErrorDescription, 4000, "toast-ca_error");
              dispatch({
                type: DSS_POST_AUTHORIZATION_USER + FAIL,
              });
              if ( timerHandle instanceof NodeJS.Timeout ) {
                clearTimeout(timerHandle);
              }
              timerHandle = null;
            } else { setTimeout(req, deploy); }
          }, deploy);
        }
      } catch (e) {
        Materialize.toast(e, 4000, "toast-ca_error");
        dispatch({
          type: DSS_POST_AUTHORIZATION_USER + FAIL,
        });
      }
    }, 0);
  };
}

export function dssPostAuthUser(url: string, login: string, password: string) {
  return (dispatch) => {
    dispatch({
      type: DSS_POST_AUTHORIZATION_USER + START,
    });

    setTimeout(async () => {
      let data: any;
      let body: string;

      try {
        // https://dss.cryptopro.ru/STS/oauth
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
          type: DSS_POST_AUTHORIZATION_USER + SUCCESS,
        });
      } catch (e) {
        Materialize.toast(e, 4000, "toast-ca_error");

        dispatch({
          type: DSS_POST_AUTHORIZATION_USER + FAIL,
        });
      }
    }, 0);
  };
}

export function getCertificates(url: string, token: string) {
  return (dispatch) => {
    dispatch({
      type: DSS_GET_CERTIFICATES + START,
    });

    setTimeout(async () => {
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
          hcertificates.push({id: certificate.ID, ...certificate});
        }
        dispatch({
          payload: {
            certificateMap: hcertificates,
          },
          type: DSS_GET_CERTIFICATES + SUCCESS,
        });
      } catch (e) {
        Materialize.toast(e, 4000, "toast-ca_error");

        dispatch({
          type: DSS_GET_CERTIFICATES + FAIL,
        });
      }
    }, 0);
  };
}
