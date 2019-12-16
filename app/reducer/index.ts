import {routerReducer as router} from "react-router-redux";
import {combineReducers} from "redux";
import certificates from "./certificates";
import certificatesDSS from "./certificatesDSS";
import certrequests from "./certrequests";
import certtemplate from "./certtemplate";
import cloudCSP from "./cloudCSP";
import connections from "./connections";
import containers from "./containers";
import crls from "./crls";
import documents from "./documents";
import dssResponses from "./dssResponses";
import events from "./events";
import files from "./files";
import filters from "./filters";
import license from "./license";
import passwordDSS from "./passwordDSS";
import policyDSS from "./policyDSS";
import regrequests from "./regrequests";
import remoteFiles from "./remoteFiles";
import services from "./services";
import settings from "./settings";
import signatures from "./signatures";
import templates from "./templates";
import tokens from "./tokens";
import transactionDSS from "./transactionDSS";
import users from "./users";

export default combineReducers({
  router,
  certificates,
  cloudCSP,
  connections,
  containers,
  crls,
  documents,
  dssResponses,
  certificatesDSS,
  passwordDSS,
  policyDSS,
  transactionDSS,
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
  users,
});
