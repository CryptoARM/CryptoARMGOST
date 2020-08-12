import { execSync } from "child_process";
import { app } from "electron";
import * as URL from "url";

export interface ISignDocumentsFromURLAction {
  name: "sign-documents-from-url";
  url: string;
  command?: string;
  id?: string;
}

export interface IVerifyDocumentsFromURLAction {
  name: "verify-documents-from-url";
  url: string;
  command?: string;
  id?: string;
}

export interface IUnknownAction {
  name: "unknown";
  url: string;
  command?: string;
  id?: string;
}

export type URLActionType =
  | ISignDocumentsFromURLAction
  | IVerifyDocumentsFromURLAction
  | IUnknownAction;

export interface IUrlCommandApiV4Type {
  command: string;
  url: string;
  id: string;
}

const __WIN32__ = process.platform === "win32";
const protocolLauncherArg = "--protocol-launcher";

function getQueryStringValue(query: any, key: any) {
  const value = query[key];
  if (value == null) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function handlePossibleProtocolLauncherArgs(args: string[], possibleProtocols: Set<string>): string {
  // tslint:disable-next-line: no-console
  console.log(`Received possible protocol arguments: ${args.length}`);

  if (__WIN32__) {
    const matchingUrls = args.filter((arg) => {
      // sometimes `URL.parse` throws an error
      try {
        const url = URL.parse(arg);
        // i think this `slice` is just removing a trailing `:`
        return url.protocol && possibleProtocols.has(url.protocol.slice(0, -1));
      } catch (e) {
        // tslint:disable-next-line: no-console
        console.log(`Unable to parse argument as URL: ${arg}`);
        return false;
      }
    });

    if (args.includes(protocolLauncherArg) && matchingUrls.length === 1) {
      return matchingUrls[0];
    } else {
      // tslint:disable-next-line: no-console
      console.log(`Malformed launch arguments received: ${args}`);
    }
  } else if (args.length > 1) {
    return args[1];
  }

  return "";
}

function registerForURLSchemeLinux(scheme: string) {
  execSync(`xdg-mime default CryptoARM_GOST.desktop x-scheme-handler/${scheme}`);
}

/**
 * Wrapper around app.setAsDefaultProtocolClient that adds our
 * custom prefix command line switches on Windows.
 */
export function setAsDefaultProtocolClient(protocol: string) {
  if (__WIN32__) {
    app.setAsDefaultProtocolClient(protocol, process.execPath, [
      protocolLauncherArg,
    ]);
  } else {
    if (process.platform === "linux") {
      registerForURLSchemeLinux(protocol);
    } else {
      app.setAsDefaultProtocolClient(protocol);
    }
  }
}

export function parseUrlCommandApiV7(urlWithCommand: string): IUrlCommandApiV4Type {
  const result: IUrlCommandApiV4Type = {
    command: "not supported",
    id: "",
    url: "",
  };

  const parsedURL = URL.parse(urlWithCommand, true);
  if (parsedURL.protocol !== "cryptoarm:") {
    return result;
  }

  const query = parsedURL.query;
  const hostname = parsedURL.hostname;
  if (!hostname) {
    return result;
  }
  const recievedCommand = hostname;

  switch (recievedCommand.toLowerCase()) {
    case "certificates":
    case "diagnostics":
    case "signandencrypt":
      break;
    default:
      // tslint:disable-next-line: no-console
      console.log("Warning! Command \"" + recievedCommand + "\" is not supported");
      return result;
  }

  // we require something resembling a URL first
  // - bail out if it's not defined
  // - bail out if you only have `/`
  const pathName = parsedURL.pathname;
  if (!pathName || pathName.length <= 1) {
    return result;
  }

  // Trim the trailing / from the URL
  const parsedPath = pathName.substr(1);

  // // enable only https
  // if (URL.parse(parsedPath, true).protocol !== "https:") {
  //   return result;
  // }

  result.command = recievedCommand;
  result.id = getQueryStringValue(query, "id");
  const path = parsedURL.pathname;
  if (path) {
    const urlIndex = urlWithCommand.indexOf(path) + 1;
    result.url = urlWithCommand.substring(urlIndex);
  }

  return result;
}
