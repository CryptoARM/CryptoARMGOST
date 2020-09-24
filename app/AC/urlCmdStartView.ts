import { LOCATION_CERTIFICATES, MY } from "../constants";
import { IUrlCommandApiV4Type } from "../parse-app-url";
import { openWindow, paramsRequest, postRequest, removeWarningMessage } from "./urlCmdUtils";

export interface IStartViewParameters {
  uiView: string;
  description: string;
}

function paramsRequestDiag(id: string) {
  return JSON.stringify(paramsRequest("startView.parameters", id));
}

export function handleUrlCommandStartView(command: IUrlCommandApiV4Type) {
  postRequest(command.url, paramsRequestDiag(command.id)).then(
    (data: any) => {
      const uiView = data.result.uiView;
      if (!uiView || !uiView.length) {
        // tslint:disable-next-line: no-console
        console.log("Error! Empty operation list.");
        return;
      }

      switch (uiView) {
        case "CERTIFICATES_MY":
          openWindow(LOCATION_CERTIFICATES, MY);
          break;

        default:
          // tslint:disable-next-line: no-console
          console.error("Error! View " + uiView + " is not supported");
          break;
      }
    },
    (error) => {
      // tslint:disable-next-line: no-console
      console.log(
        "Error recieving parameters of start view command with id " +
        command.id +
        ". Error description: " +
        error,
      );
    },
  );
}
