import { showModalHTTPErr } from "../AC/trustedServicesActions";
import { ipcRenderer, remote } from "electron";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { Route } from "react-router-dom";
import { ConnectedRouter as Router, push } from "react-router-redux";
import { checkTrustedServiceForCommand, dispatchURLAction } from "../AC/urlActions";
import {
  LOCATION_ABOUT, LOCATION_ADDRESS_BOOK, LOCATION_CERTIFICATE_SELECTION_FOR_ENCRYPT,
  LOCATION_CERTIFICATE_SELECTION_FOR_SIGNATURE, LOCATION_CERTIFICATES,
  LOCATION_CONTAINERS, LOCATION_DOCUMENTS, LOCATION_EVENTS,
  LOCATION_RESULTS_MULTI_OPERATIONS, LOCATION_SERVICES, LOCATION_SETTINGS,
  LOCATION_SETTINGS_CONFIG, LOCATION_SETTINGS_SELECT, LOCATION_TRUSTED_SERVICES, RU,
} from "../constants";
import history from "../history";
import localize from "../i18n/localize";
import store from "../store/index";
import AboutWindow from "./About/AboutWindow";
import AddressBookWindow from "./AddressBook/AddressBookWindow";
import CertificateSelectionForEncrypt from "./Certificate/CertificateSelectionForEncrypt";
import CertificateSelectionForSignature from "./Certificate/CertificateSelectionForSignature";
import CertificateWindow from "./Certificate/CertificateWindow";
import ContainersWindow from "./Containers/ContainersWindow";
import DocumentsWindow from "./Documents/DocumentsWindow";
import EventsWindow from "./Events/EventsWindow";
import * as fileManager from "./Files/fileManager";
import MenuBar from "./MenuBar";
import ResultsWindow from "./MultiOperations/ResultsWindow";
import ServiceWindow from "./Services/ServiceWindow";
import SignAndEncryptWindow from "./SignatureAndEncrypt/SignatureAndEncryptWindow";
import TrustedServicesWindow from "./TrustedServices/TrustedServicesWindow";

interface IAppProps {
  locale: string;
}

ipcRenderer.on(
  "url-action",
  (event: Electron.IpcRendererEvent, { action }: { action: any }) => {
    console.log("url-action", action);

    dispatchURLAction(action);
  },
);

ipcRenderer.on(
  "url-command",
  (event: Electron.IpcRendererEvent, { command }: { command: any }) => {
    console.log("url-command", command.command);

    checkTrustedServiceForCommand(command);
  },
);

ipcRenderer.on(
  "url-http",
  (event: Electron.IpcRendererEvent, { command }: { command: any }) => {
    console.log("url-http", command.command);

    showModalHTTPErr();
  },
);

class App extends React.Component<IAppProps, {}> {
  static childContextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  getChildContext() {
    const { locale } = this.props;
    return {
      locale,
      localize,
    };
  }

  componentDidMount() {
    window.locale = this.props.locale;
  }

  render() {
    return (
      <Router history={history}>
        <React.Fragment>
          <Route path="/" component={MenuBar} />
          <Route exact path="/" component={SignAndEncryptWindow} />
          <Route path={LOCATION_CERTIFICATE_SELECTION_FOR_ENCRYPT} component={CertificateSelectionForEncrypt} />
          <Route path={LOCATION_CERTIFICATE_SELECTION_FOR_SIGNATURE} component={CertificateSelectionForSignature} />
          <Route path={LOCATION_CERTIFICATES} component={CertificateWindow} />
          <Route path={LOCATION_CONTAINERS} component={ContainersWindow} />
          <Route path={LOCATION_ADDRESS_BOOK} component={AddressBookWindow} />
          <Route path={LOCATION_ABOUT} component={AboutWindow} />
          <Route path={LOCATION_DOCUMENTS} component={DocumentsWindow} />
          <Route path={LOCATION_EVENTS} component={EventsWindow} />
          <Route path={LOCATION_SERVICES} component={ServiceWindow} />
          <Route path={LOCATION_RESULTS_MULTI_OPERATIONS} component={ResultsWindow} />
          <Route path={LOCATION_TRUSTED_SERVICES} component={TrustedServicesWindow} />
        </React.Fragment>
      </Router>
    );
  }
}

export default connect((state) => {
  return {
    locale: RU,
  };
})(App);
