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
import globalLocks from "./globalLocks";
import license from "./license";
import multiOperations from "./multiOperations";
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
import trustedId from "./trustedId";
import trustedServices from "./trustedServices";
import urlActions from "./urlActions";
import urlCmdCertificates from "./urlCmdCertificates";
import urlCmdCertInfo from "./urlCmdCertInfo";
import urlCmds from "./urlCmds";
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
  multiOperations,
  remoteFiles,
  certrequests,
  certtemplate,
  settings,
  regrequests,
  services,
  signatures,
  templates,
  tokens,
  trustedId,
  trustedServices,
  urlActions,
  users,
  urlCmdCertificates,
  urlCmds,
  globalLocks,
  urlCmdCertInfo,
});
