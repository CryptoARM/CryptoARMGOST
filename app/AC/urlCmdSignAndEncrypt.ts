import { IUrlCommandApiV4Type } from "../parse-app-url";
import store from "../store";
import { dispatchURLAction, finishCurrentUrlCmd } from "./urlActions";
import { displayWarningMessage, paramsRequest, postRequest, removeWarningMessage } from "./urlCmdUtils";

interface ICertResp {
  jsonrpc: string;
  result: ICertificateParameters;
  id: string;
}

interface ICertificateParameters {
  operation: "import"|"export"|"information";
  props: ICertificateOperationProps;
}

interface ICertificateOperationProps {
  headerText?: string;
  descriptionText?: string;
  store?: string[];
  multy?: boolean;
  certificateBase64?: string;
}

interface ICertToExport {
  certificateBase64: string;
  friendlyName: string;
}

function paramsRequestSignAndEncrypt(id: string) {
  return JSON.stringify(paramsRequest("signAndEncrypt.parameters", id));
}

export function handleUrlCommandSignAmdEncrypt( command: IUrlCommandApiV4Type ) {
  postRequest(command.url, paramsRequestSignAndEncrypt(command.id)).then(
    (data: any) => {
      const operation = data.result.operation;
      const props = data.result.props;

      displayWarningMessage(command.command, command.url);

      if (operation && operation.includes("SIGN")) {
        return dispatchURLAction({
          name: "sign-documents-from-url",
          url: command.url,
          // tslint:disable-next-line: object-literal-sort-keys
          id: command.id,
          props,
        });
      } else {
        return dispatchURLAction({
          name: "verify-documents-from-url",
          url: command.url,
          // tslint:disable-next-line: object-literal-sort-keys
          id: command.id,
          props,
        });
      }
    },
    (error) => {
      store.dispatch(finishCurrentUrlCmd(false));
      removeWarningMessage();
      $(".toast-url-cmd-cert-params-fail-err-descr").remove();
      Materialize.toast(error, 3000, "toast-url-cmd-cert-params-fail-err-descr");

      // tslint:disable-next-line: no-console
      console.log("Error recieving parameters of certificate command with id " + command.id
        + ". Error description: " + error);
    },
  );
}
