import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { Route } from "react-router-dom";
import { ConnectedRouter as Router, push } from "react-router-redux";
import {
  LOCATION_ABOUT, LOCATION_ADDRESS_BOOK, LOCATION_CERTIFICATE_SELECTION_FOR_ENCRYPT,
  LOCATION_CERTIFICATE_SELECTION_FOR_SIGNATURE, LOCATION_CERTIFICATES,
  LOCATION_CONTAINERS, LOCATION_DOCUMENTS, LOCATION_EVENTS,
  LOCATION_SERVICES, LOCATION_SETTINGS, LOCATION_SETTINGS_CONFIG,
  LOCATION_SETTINGS_SELECT,
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
import SettingsConfig from "./Settings/SettingsConfig";
import SettingsSelect from "./Settings/SettingsSelect";
import SettingsWindow from "./Settings/SettingsWindow";
import SignAndEncryptWindow from "./SignatureAndEncrypt/SignatureAndEncryptWindow";

interface IAppProps {
  locale: string;
}

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
          <Route path={LOCATION_SETTINGS} component={SettingsWindow} />
          <Route path={LOCATION_SETTINGS_SELECT} component={SettingsSelect} />
          <Route path={LOCATION_SETTINGS_CONFIG} component={SettingsConfig} />
        </React.Fragment>
      </Router>
    );
  }
}

export default connect((state) => ({
  locale: state.settings.getIn(["entities", state.settings.default]).locale,
}))(App);
