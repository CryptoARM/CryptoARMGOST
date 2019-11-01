import * as os from "os";
import { ICertificateRequestCA, IRegRequest } from "../components/Services/types";
import {
  DELETE_CERTIFICATE_REQUEST_CA, FAIL, GET_CA_CERTREQUEST,
  GET_CA_CERTREQUEST_STATUS, GET_CA_REGREQUEST, HOME_DIR,
  POST_CA_CERTREQUEST, POST_CA_CERTREQUEST_СONFIRMATION, POST_CA_REGREQUEST, START, SUCCESS, USER_NAME,
} from "../constants";
import { uuid } from "../utils";
import logger from "../winstonLogger";
export async function postApi(url: string, postfields: any, headerfields: string[]) {
  return new Promise((resolve, reject) => {
    const curl = new window.Curl();

    curl.setOpt("URL", url);
    curl.setOpt("FOLLOWLOCATION", true);
    curl.setOpt(window.Curl.option.HTTPHEADER, headerfields);
    curl.setOpt(window.Curl.option.POSTFIELDS, postfields);

    curl.on("end", function (statusCode: number, response: any) {
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

export async function postApiAuthCert(url: string, postfields: any, headerfields: string[], thumbprint: string) {
  return new Promise((resolve, reject) => {
    const curl = new window.Curl();

    curl.setOpt("URL", url);
    curl.setOpt("FOLLOWLOCATION", true);
    curl.setOpt(window.Curl.option.HTTPHEADER, headerfields);
    if (os.type() === "Windows_NT") {
      curl.setOpt(window.Curl.option.SSLCERT, `CurrentUser\\MY\\${thumbprint}`);
    } else {
      curl.setOpt(window.Curl.option.SSLCERTTYPE, 'CERT_SHA1_HASH_PROP_ID:CERT_SYSTEM_STORE_CURRENT_USER:MY');
      curl.setOpt(window.Curl.option.SSLCERT, `${thumbprint}`);
    }
    curl.setOpt(window.Curl.option.POSTFIELDS, postfields);

    curl.on("end", function (statusCode: number, response: { toString: () => string; }) {
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

export async function getApi(url: string, headerfields: string[]) {
  return new Promise((resolve, reject) => {
    const curl = new window.Curl();

    curl.setOpt("URL", url);
    curl.setOpt("FOLLOWLOCATION", true);
    curl.setOpt(window.Curl.option.HTTPHEADER, headerfields);
    curl.on("end", function (statusCode: number, response: { toString: () => string; }) {
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

export async function getApiAuthCert(url: string, headerfields: string[], thumbprint: string) {
  return new Promise((resolve, reject) => {
    const curl = new window.Curl();

    curl.setOpt("URL", url);
    curl.setOpt("FOLLOWLOCATION", true);
    curl.setOpt(window.Curl.option.HTTPHEADER, headerfields);
    if (os.type() === "Windows_NT") {
      curl.setOpt(window.Curl.option.SSLCERT, `CurrentUser\\MY\\${thumbprint}`);
    } else {
      curl.setOpt(window.Curl.option.SSLCERTTYPE, 'CERT_SHA1_HASH_PROP_ID:CERT_SYSTEM_STORE_CURRENT_USER:MY');
      curl.setOpt(window.Curl.option.SSLCERT, `${thumbprint}`);
    }
    curl.on("end", function(statusCode: number, response: { toString: () => string; }) {
      let data;

      try {
        if (statusCode !== 200) {
          throw new Error(`Unexpected response, status code ${statusCode}`);
        }
      } catch (error) {
        reject(`Cannot load data, error: ${error.message}`);
        return;
      } finally {
        curl.close.bind(curl);
      }

      data = JSON.parse(response.toString());

      resolve(data);
    });

    curl.on("error", (error: { message: any; }) => {
      curl.close.bind(curl);
      reject(new Error(`Cannot load data by url ${url}, error: ${error.message}`));
    });

    curl.perform();
  });
}

export async function getCertApi(url: string, headerfields: string[]) {
  return new Promise((resolve, reject) => {
    const curl = new window.Curl();
    let data = new Buffer("");

    curl.setOpt("URL", url);
    curl.setOpt("FOLLOWLOCATION", true);
    curl.setOpt(window.Curl.option.HTTPHEADER, headerfields);
    curl.on("end", function(statusCode: number, response: { toString: () => string; }) {
      try {
        if (statusCode !== 200) {
          throw new Error(`Unexpected response, status code ${statusCode}`);
        }
      } catch (error) {
        reject(`Cannot load data, error: ${error.message}`);
        return;
      } finally {
        curl.close.bind(curl);
      }

      const cert = new trusted.pki.Certificate();
      cert.import(data);
      resolve(cert.export(trusted.DataFormat.PEM).toString());
    });

    curl.on('data', (chunk, curlInstance) => {
      data = Buffer.concat([data, chunk]);
      return chunk.length;
    });

    curl.on("error", (error: { message: any; }) => {
      curl.close.bind(curl);
      reject(new Error(`Cannot load data by url ${url}, error: ${error.message}`));
    });

    curl.perform();
  });
}

export async function getCertApiAuthCert(url: string, headerfields: string[], thumbprint: string) {
  return new Promise((resolve, reject) => {
    const curl = new window.Curl();
    let data = new Buffer("");

    curl.setOpt("URL", url);
    curl.setOpt("FOLLOWLOCATION", true);
    curl.setOpt(window.Curl.option.HTTPHEADER, headerfields);
    if (os.type() === "Windows_NT") {
      curl.setOpt(window.Curl.option.SSLCERT, `CurrentUser\\MY\\${thumbprint}`);
    } else {
      curl.setOpt(window.Curl.option.SSLCERTTYPE, 'CERT_SHA1_HASH_PROP_ID:CERT_SYSTEM_STORE_CURRENT_USER:MY');
      curl.setOpt(window.Curl.option.SSLCERT, `${thumbprint}`);
    }
    curl.on("end", function(statusCode: number, response: { toString: () => string; }) {
      try {
        if (statusCode !== 200) {
          throw new Error(`Unexpected response, status code ${statusCode}`);
        }
      } catch (error) {
        reject(`Cannot load data, error: ${error.message}`);
        return;
      } finally {
        curl.close.bind(curl);
      }

      try {
        const cert = new trusted.pki.Certificate();
        cert.import(data);
        resolve(cert.export(trusted.DataFormat.PEM).toString());
      } catch (e) {
        reject(new Error("trusted-crypto: Error export Certificate"));
      }
    });

    curl.on('data', (chunk, curlInstance) => {
      data = Buffer.concat([data, chunk]);
      return chunk.length;
    });

    curl.on("error", (error: { message: any; }) => {
      curl.close.bind(curl);
      reject(new Error(`Cannot load data by url ${url}, error: ${error.message}`));
    });

    curl.perform();
  });
}

export function postRegRequest(url: string, comment: string, description: string, email: string, keyPhrase: string, oids: any[], service: any) {
  return (dispatch) => {
    dispatch({
      type: POST_CA_REGREQUEST + START,
    });

    setTimeout(async () => {
      let data: any;
      let data2: any;

      try {
        Materialize.toast("Отправлен запрос на регистрацию в УЦ", 3000, "toast-ca_req_send");

        logger.log({
          level: "info",
          message: "",
          operation: "Отправлен запрос на регистрацию в УЦ",
          operationObject: {
            in: "login" + service.login,
            out: "Null",
          },
          userName: USER_NAME,
        });
        data = await postApi(`${url}/regrequest`, JSON.stringify({
          Comment: comment,
          Description: description,
          Email: email,
          KeyPhrase: keyPhrase,
          OidArray: oids,
        }),
          [
            "Content-Type: application/json",
            "Accept: application/json",
          ]);

        $(".toast-ca_req_send").remove();
        Materialize.toast("Пользователь зарегестирован в УЦ", 3000, "toast-ca_req_ok");

        data2 = await getApi(
          `${url}/certtemplate`,
          [
            "Accept: application/json",
            `Authorization: Basic ${Buffer.from(data.RegRequest.Token + ":" + data.RegRequest.Password).toString("base64")}`,
          ],
        );

        let RDN = {};

        oids.forEach((oidvalue) => {
          RDN = { ...RDN, ...oidvalue };
        });

        dispatch({
          payload: {
            Comment: comment,
            Description: description,
            Email: email,
            KeyPhrase: keyPhrase,
            RDN,
            id: data.RegRequest.RegRequestId,
            regRequest: data.RegRequest,
            service,
            template: data2.Template,
          },
          type: POST_CA_REGREQUEST + SUCCESS,
        });
      } catch (e) {
        $(".toast-ca_req_send").remove();

        Materialize.toast("Ошибка регистрации в УЦ", 3000, "toast-ca_req_fail");
        Materialize.toast(e, 4000, "toast-ca_error");

        dispatch({
          type: POST_CA_REGREQUEST + FAIL,
        });
      }
    }, 0);
  };
}

export function getRegRequest(url: string, Token: string, Password: string, service: any) {
  return (dispatch) => {
    dispatch({
      type: GET_CA_REGREQUEST + START,
    });

    setTimeout(async () => {
      let data: any;

      try {
        data = await getApi(
          `${url}/regrequest`,
          [
            "Content-Type: application/json",
            `Authorization: Basic ${Buffer.from(Token + ":" + Password).toString("base64")}`,
          ],
        );

        const statusRegRequest = data.RegRequest.Status;

        url = url.substr(0, url.lastIndexOf("/"));
        data = await getApi(
          `${url}/regrequest/profile?type=json`,
          [
            "Content-Type: application/json",
            `Authorization: Basic ${Buffer.from(Token + ":" + Password).toString("base64")}`,
          ],
        );

        const profile = data.Profile.reduce((obj, item) => ({ ...obj, ...item }), {});
        const regRequestId = uuid();

        $(".toast-ca_get_req_send").remove();

        dispatch({
          payload: {
            RDN: profile,
            id: regRequestId,
            regRequest: {
              Password,
              RegRequestId: regRequestId,
              Status: statusRegRequest,
              Token,
            },
            service,
          },
          type: GET_CA_REGREQUEST + SUCCESS,
        });
      } catch (e) {
        $(".toast-ca_get_req_send").remove();

        Materialize.toast(e, 4000, "toast-ca_error");

        dispatch({
          type: GET_CA_REGREQUEST + FAIL,
        });
      }
    }, 0);
  };
}

export function postCertRequest(url: string, certificateRequestCA: ICertificateRequestCA, subject: any, regrequest: IRegRequest, serviceId: string) {
  return (dispatch) => {
    dispatch({
      type: POST_CA_CERTREQUEST + START,
    });

    setTimeout(async () => {
      let data: any;

      try {
        url = url.substr(0, url.lastIndexOf("/"));

        data = await postApi(
          `${url}/certrequest`,
          certificateRequestCA.certificateReq,
          [
            "Content-Type: application/octet-stream",
            `Authorization: Basic ${Buffer.from(regrequest.Token + ":" + regrequest.Password).toString("base64")}`,
          ],
        );
        dispatch({
          payload: {
            certRequestId: data.CertRequest.CertRequestId,
            id: certificateRequestCA.id,
            serviceId,
            status: data.CertRequest.Status,
            subject,
          },
          type: POST_CA_CERTREQUEST + SUCCESS,
        });
      } catch (e) {
        Materialize.toast(e, 4000, "toast-ca_error");

        dispatch({
          type: POST_CA_CERTREQUEST + FAIL,
        });
      }
    }, 0);
  };
}

export function postCertRequestAuthCert(url: string, certificateRequestCA: ICertificateRequestCA, certificateReq: string, subject: any, regrequest: IRegRequest, serviceId: string) {
  return (dispatch) => {
    dispatch({
      type: POST_CA_CERTREQUEST + START,
    });

    setTimeout(async () => {
      let data: any;

      try {
        url = url.substr(0, url.lastIndexOf("/"));
        const a = url.split("");
        a.splice(url.indexOf("/api"), 0, "/2");
        url = a.join("");

        data = await postApiAuthCert(
          `${url}/certrequest`,
          certificateReq,
          [
            "Content-Type: application/octet-stream",
          ],
          regrequest.certThumbprint,
        );
        dispatch({
          payload: {
            certRequestId: data.CertRequest.CertRequestId,
            id: certificateRequestCA.id,
            serviceId,
            status: data.CertRequest.Status,
            subject,
          },
          type: POST_CA_CERTREQUEST + SUCCESS,
        });
      } catch (e) {
        Materialize.toast(e, 4000, "toast-ca_error");

        dispatch({
          type: POST_CA_CERTREQUEST + FAIL,
        });
      }
    }, 0);
  };
}

export function postCertRequestСonfirmation(url: string, certrequest: ICertificateRequestCA, regrequest: IRegRequest) {
  return (dispatch) => {
    dispatch({
      type: POST_CA_CERTREQUEST_СONFIRMATION + START,
    });

    setTimeout(async () => {
      let data: any;
      const dataStatus = {
        Status: "K",
      };
      try {
        url = url.substr(0, url.lastIndexOf("/"));

        data = await postApi(
          `${url}/certrequest/${certrequest.certRequestId}`,
          JSON.stringify(dataStatus),
          [
            "Content-Type: application/json",
            "Accept: */*",
            `Authorization: Basic ${Buffer.from(regrequest.Token + ":" + regrequest.Password).toString("base64")}`,
          ],
        );
        dispatch({
          payload: {
            certificate: certrequest.certificate,
            id: certrequest.id,
            serviceId: certrequest.serviceId,
            status: data.CertRequest.Status,
          },
          type: POST_CA_CERTREQUEST_СONFIRMATION + SUCCESS,
        });
      } catch (e) {
        Materialize.toast(e, 4000, "toast-ca_error");

        dispatch({
          type: POST_CA_CERTREQUEST_СONFIRMATION + FAIL,
        });
      }
    }, 0);
  };
}

export function postCertRequestСonfirmationAuthCert(url: string, certrequest: ICertificateRequestCA, regrequest: IRegRequest) {
  return (dispatch) => {
    dispatch({
      type: POST_CA_CERTREQUEST_СONFIRMATION + START,
    });

    setTimeout(async () => {
      let data: any;
      const dataStatus = {
        Status: "K",
      };
      try {
        url = url.substr(0, url.lastIndexOf("/"));
        const a = url.split("");
        a.splice(url.indexOf("/api"), 0, "/2");
        url = a.join("");

        data = await postApiAuthCert(
          `${url}/certrequest/${certrequest.certRequestId}`,
          JSON.stringify(dataStatus),
          [
            "Content-Type: application/json",
            "Accept: */*",
          ],
          regrequest.certThumbprint,
        );
        dispatch({
          payload: {
            certificate: certrequest.certificate,
            id: certrequest.id,
            serviceId: certrequest.serviceId,
            status: data.CertRequest.Status,
          },
          type: POST_CA_CERTREQUEST_СONFIRMATION + SUCCESS,
        });
      } catch (e) {
        Materialize.toast(e, 4000, "toast-ca_error");

        dispatch({
          type: POST_CA_CERTREQUEST_СONFIRMATION + FAIL,
        });
      }
    }, 0);
  };
}

export function getCertRequestStatus(url: string, certrequest: ICertificateRequestCA, regrequest: IRegRequest) {
  return (dispatch) => {
    dispatch({
      type: GET_CA_CERTREQUEST_STATUS + START,
    });

    setTimeout(async () => {
      let data: any;

      try {
        url = url.substr(0, url.lastIndexOf("/"));
        data = await getApi(
          `${url}/certrequest/${certrequest.certRequestId}`,
          [
            `Authorization: Basic ${Buffer.from(regrequest.Token + ":" + regrequest.Password).toString("base64")}`,
          ],
        );

        dispatch({
          payload: {
            id: certrequest.id,
            status: data.CertRequest.Status,
          },
          type: GET_CA_CERTREQUEST_STATUS + SUCCESS,
        });
      } catch (e) {
        Materialize.toast(e, 4000, "toast-ca_error");

        dispatch({
          type: GET_CA_CERTREQUEST_STATUS + FAIL,
        });
      }
    }, 0);
  };
}

export function getCertRequestStatusAuthCert(url: string, certrequest: ICertificateRequestCA, regrequest: IRegRequest) {
  return (dispatch) => {
    dispatch({
      type: GET_CA_CERTREQUEST_STATUS + START,
    });

    setTimeout(async () => {
      let data: any;

      try {
        url = url.substr(0, url.lastIndexOf("/"));
        const a = url.split("");
        a.splice(url.indexOf("/api"), 0, "/2");
        url = a.join("");

        data = await getApiAuthCert(
          `${url}/certrequest/${certrequest.certRequestId}`,
          [
          ],
          regrequest.certThumbprint,
        );

        dispatch({
          payload: {
            id: certrequest.id,
            status: data.CertRequest.Status,
          },
          type: GET_CA_CERTREQUEST_STATUS + SUCCESS,
        });
      } catch (e) {
        Materialize.toast(e, 4000, "toast-ca_error");

        dispatch({
          type: GET_CA_CERTREQUEST_STATUS + FAIL,
        });
      }
    }, 0);
  };
}

export function getCertRequest(url: string, certrequest: ICertificateRequestCA, regrequest: IRegRequest) {
  return (dispatch) => {
    dispatch({
      type: GET_CA_CERTREQUEST + START,
    });

    setTimeout(async () => {
      let data: any;

      try {
        url = url.substr(0, url.lastIndexOf("/"));

        data = await getCertApi(
          `${url}/certrequest/${certrequest.certRequestId}/rawcert`,
          [
            "Content-Type: application/octet-stream",
            `Authorization: Basic ${Buffer.from(regrequest.Token + ":" + regrequest.Password).toString("base64")}`,
          ],
        );

        data = data.replace(/\r\n|\n|\r/gm, "");
        dispatch({
          payload: {
            certificate: data,
            id: certrequest.id,
            serviceId: certrequest.serviceId,
          },
          type: GET_CA_CERTREQUEST + SUCCESS,
        });
      } catch (e) {
        Materialize.toast(e, 4000, "toast-ca_error");

        dispatch({
          type: GET_CA_CERTREQUEST + FAIL,
        });
      }
    }, 0);
  };
}

export function getCertRequestAuthCert(url: string, certrequest: ICertificateRequestCA, regrequest: IRegRequest) {
  return (dispatch) => {
    dispatch({
      type: GET_CA_CERTREQUEST + START,
    });

    setTimeout(async () => {
      let data: any;

      try {
        url = url.substr(0, url.lastIndexOf("/"));
        const a = url.split("");
        a.splice(url.indexOf("/api"), 0, "/2");
        url = a.join("");

        data = await getCertApiAuthCert(
          `${url}/certrequest/${certrequest.certRequestId}/rawcert`,
          [
            "Content-Type: application/octet-stream",
          ],
          regrequest.certThumbprint,
        );

        data = data.replace(/\r\n|\n|\r/gm, "");
        dispatch({
          payload: {
            certificate: data,
            id: certrequest.id,
            serviceId: certrequest.serviceId,
          },
          type: GET_CA_CERTREQUEST + SUCCESS,
        });
      } catch (e) {
        Materialize.toast(e, 4000, "toast-ca_error");

        dispatch({
          type: GET_CA_CERTREQUEST + FAIL,
        });
      }
    }, 0);
  };
}

export function deleteRequestCA(id: string) {
  return {
    payload: {
      id,
    },
    type: DELETE_CERTIFICATE_REQUEST_CA,
  };
}
