import {routerReducer as router} from "react-router-redux";
import {combineReducers} from "redux";
import certificates from "./certificates";
import certrequests from "./certrequests";
import certtemplate from "./certtemplate";
import cloudCSP from "./cloudCSP";
import connections from "./connections";
import containers from "./containers";
import crls from "./crls";
import documents from "./documents";
import DSSCertificates from "./DSSCertificates";
import events from "./events";
import files from "./files";
import filters from "./filters";
import license from "./license";
import regrequests from "./regrequests";
import remoteFiles from "./remoteFiles";
import services from "./services";
import settings from "./settings";
import signatures from "./signatures";
import templates from "./templates";
import tokens from "./tokens";

export default combineReducers({
  router,
  certificates,
  cloudCSP,
  connections,
  containers,
  crls,
  documents,
  DSSCertificates,
  events,
  files,
  filters,
  license,
  remoteFiles,
  certrequests,
  certtemplate,
  settings,
  regrequests,
  services,
  signatures,
  templates,
  tokens,
});
