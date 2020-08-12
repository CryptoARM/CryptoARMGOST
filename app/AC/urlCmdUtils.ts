import * as fs from "fs";
import { ADDRESS_BOOK, CA, MY, ROOT, TMP_DIR } from "../constants";
import history from "../history";
import localize from "../i18n/localize";

interface IParamsRequest {
  jsonrpc: "2.0";
  method: string;
  id: string;
}

export async function postRequest(url: string, requestData: string|Buffer) {
  return new Promise((resolve, reject) => {
    const curl = new window.Curl();

    const headerfields = [
      "Content-Type: application/json",
      "Content-Length: " + Buffer.byteLength(requestData),
      "Accept: application/json",
    ];

    curl.setOpt("URL", url);
    curl.setOpt("FOLLOWLOCATION", true);
    curl.setOpt(window.Curl.option.HTTPHEADER, headerfields);
    curl.setOpt(window.Curl.option.POSTFIELDS, requestData.toString());

    curl.on("end", function(statusCode: number, response: any) {
      let data;

      try {
        switch (statusCode) {
          case 200:
          case 202:
          case 204:
            if (!response || (response.toString().length === 0)) {
              data = "";
            } else {
              try {
                data = JSON.parse(response.toString());
              } catch (e) {
                //
              }
            }
            break;

          case 405:
            throw new Error(localize("UrlCommand.server_error_method_not_allowed", window.locale));

          case 415:
            throw new Error(localize("UrlCommand.server_error_unsupported_media", window.locale));

          default:
            throw new Error(`Unexpected status code ${statusCode}`);
        }

        if (data && data.error) {
          if (data.error.data) {
            // tslint:disable-next-line: no-console
            console.log(`Server error data: ${JSON.stringify(data.error.data)}`);
          }
          throw new Error(`${data.error.message} (${data.error.code})`);
        }
      } catch (error) {
        reject(error.message);
        return;
      } finally {
        curl.close();
      }

      resolve(data);
    });

    curl.on("error", (error: { message: any; }) => {
      curl.close();
      reject(new Error(`Cannot load data by url ${url}, error: ${error.message}`));
    });

    curl.perform();
  });
}

export function paramsRequest(method: string, id: string): IParamsRequest {
  return {
    jsonrpc: "2.0",
    method,
    // tslint:disable-next-line: object-literal-sort-keys
    id,
  };
}

export function openWindow(location: string, certStore: string) {
  const remote = window.electron.remote;
  remote.getCurrentWindow().show();
  remote.getCurrentWindow().focus();

  let filter = "my";
  const state = {
    head: localize("Certificate.certs_my", window.locale),
    store: certStore,
  };

  if (certStore !== MY) {
    switch (certStore) {
      case ADDRESS_BOOK:
        filter = ADDRESS_BOOK;
        state.head = localize("AddressBook.address_book", window.locale);
        state.store = ADDRESS_BOOK;
        break;

      case CA:
        filter = "intermediate";
        state.head = localize("Certificate.certs_intermediate", window.locale);
        state.store = CA;
        break;

      case ROOT:
        filter = "root";
        state.head = localize("Certificate.certs_root", window.locale);
        state.store = ROOT;
        break;

      default:
        state.head = localize("UrlCommand.certificate_info_header", window.locale);
        break;
    }
  }

  history.push({
    pathname: location,
    search: filter,
    state,
  });
}

export function writeCertToTmpFile(certBase64: string): string {
  const resultUri = TMP_DIR + "/cert-tmp-" + ((new Date()).getTime()) + ".cer";
  fs.writeFileSync(resultUri, certBase64);

  return resultUri;
}
