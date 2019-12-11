import * as fs from "fs";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { filePackageDelete } from "../AC";
import {
  LOCATION_ABOUT, LOCATION_CERTIFICATE_SELECTION_FOR_ENCRYPT, LOCATION_CERTIFICATE_SELECTION_FOR_SIGNATURE,
  LOCATION_CERTIFICATES,
  LOCATION_CONTAINERS, LOCATION_DOCUMENTS,
  LOCATION_EVENTS, LOCATION_LICENSE, LOCATION_SERVICES,
  LOCATION_SETTINGS, LOCATION_SETTINGS_CONFIG, LOCATION_SETTINGS_SELECT, SETTINGS_JSON, TRUSTED_CRYPTO_LOG,
} from "../constants";
import { connectedSelector, loadingRemoteFilesSelector } from "../selectors";
import { CANCELLED } from "../server/constants";
import { fileExists, mapToArr } from "../utils";
import Diagnostic from "./Diagnostic/Diagnostic";
import LocaleSelect from "./Settings/LocaleSelect";
import SideMenu from "./SideMenu";

// tslint:disable-next-line:no-var-requires
require("../server/socketManager");

const remote = window.electron.remote;
if (remote.getGlobal("sharedObject").logcrypto) {
  window.logger = trusted.common.Logger.start(TRUSTED_CRYPTO_LOG);
}

interface IMenuBarState {
  isMaximized: boolean;
}

class MenuBar extends React.Component<any, IMenuBarState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: any) {
    super(props);
    this.state = ({
      isMaximized: false,
    });
  }

  maximizeWindow() {
    const window = remote.getCurrentWindow();
    window.isMaximized() ? window.unmaximize() : window.maximize();

    this.setState({ isMaximized: !this.state.isMaximized });
  }

  minimizeWindow() {
    remote.getCurrentWindow().minimize();
  }

  closeWindow() {
    const { localize, locale } = this.context;
    const { settings, tempContentOfSignedFiles } = this.props;

    if (this.isFilesFromSocket()) {
      this.removeAllFiles();
    }

    for (const filePath of tempContentOfSignedFiles) {
      if (fileExists(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    remote.getCurrentWindow().close();
  }

  getTitle() {
    const { localize, locale } = this.context;
    const { isArchiveLog, eventsDateFrom, eventsDateTo } = this.props;
    const pathname = this.props.location.pathname;
    const storename = this.props.location.state ? this.props.location.state.head : "";

    switch (pathname) {
      case LOCATION_ABOUT:
        return `${localize("About.product_NAME", locale)} - ${localize("About.about", locale)}`;

      case LOCATION_CERTIFICATE_SELECTION_FOR_ENCRYPT:
        return `${localize("About.product_NAME", locale)} - ${localize("Certificate.certificate_selection_for_encrypt", locale)}`;

      case LOCATION_CERTIFICATE_SELECTION_FOR_SIGNATURE:
        return `${localize("About.product_NAME", locale)} - ${localize("Certificate.certificate_selection_for_signature", locale)}`;

      case LOCATION_CERTIFICATES:
        const head = storename ? storename : localize("Certificate.certs", locale);
        return `${localize("About.product_NAME", locale)} - ${storename}`;

      case LOCATION_CONTAINERS:
        return `${localize("About.product_NAME", locale)} - ${localize("Containers.containers", locale)}`;

      case LOCATION_LICENSE:
        return `${localize("About.product_NAME", locale)} - ${localize("License.license", locale)}`;

      case LOCATION_SETTINGS:
        return `${localize("About.product_NAME", locale)} - ${localize("Settings.settings", locale)}`;

      case LOCATION_SETTINGS_CONFIG:
        return `${localize("About.product_NAME", locale)} - ${localize("Settings.settings_config", locale)}`;

      case LOCATION_SETTINGS_SELECT:
        return `${localize("About.product_NAME", locale)} - ${localize("Settings.settings_select", locale)}`;

      case LOCATION_DOCUMENTS:
        return `${localize("About.product_NAME", locale)} - ${localize("Documents.documents", locale)}`;

      case LOCATION_EVENTS:
        let title = `${localize("About.product_NAME", locale)} - ${localize("Events.operations_log", locale)}`;

        if (isArchiveLog && eventsDateFrom && eventsDateTo) {
          title = localize("Events.operations_log", locale) + " [" +
            (new Date(eventsDateFrom)).toLocaleDateString(locale, {
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              month: "numeric",
              year: "numeric",
            }) + " - " +
            (new Date(eventsDateTo)).toLocaleDateString(locale, {
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              month: "numeric",
              year: "numeric",
            }) + "] - " + localize("About.product_NAME", locale);
        }
        return title;

      case LOCATION_SERVICES:
        return `${localize("About.product_NAME", locale)} - ${localize("Services.services", locale)}`;

      default:
        return `${localize("About.product_NAME", locale)} - ${localize("SignAndEncrypt.sign_and_encrypt", locale)}`;
    }
  }

  render() {
    const pathname = this.props.location.pathname;
    const disabledNavigate = this.isFilesFromSocket();

    return (
      <React.Fragment>
        <nav className="app-bar">
          <div className="col s6 m6 l6 app-bar-wrapper">
            <ul className="app-bar-items">
              <li className="headline6 app-bar-text">{this.getTitle()}</li>
              <li>
                <ul>
                  <li>
                    <LocaleSelect />
                  </li>
                  <li>
                    <a className="waves-effect waves-light" onClick={this.minimizeWindow.bind(this)}>
                      <i className="material-icons">remove</i>

                    </a>
                  </li>
                  <li>
                    <a className="waves-effect waves-light" onClick={this.maximizeWindow.bind(this)}>
                      <i className="material-icons">{this.state.isMaximized ? "filter_none" : "crop_square"}</i>
                    </a>
                  </li>
                  <li>
                    <a className="waves-effect waves-light" onClick={this.closeWindow.bind(this)}>
                      <i className="material-icons">close</i>
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
          <ul id="slide-out" className="side-nav fixed" style={{ width: "50px", left: "2px", overflow: "visible", backgroundColor: "rgba(242,245,245,0.8)" }}>
            <SideMenu pathname={pathname}/>
          </ul>

        </nav>
        {this.props.children}
        <Diagnostic />
      </React.Fragment>
    );
  }

  isFilesFromSocket = () => {
    const { files, loadingFiles } = this.props;

    if (loadingFiles.length) {
      return true;
    }

    if (files.length) {
      for (const file of files) {
        if (file.socket) {
          return true;
        }
      }
    }

    return false;
  }

  removeAllFiles = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { connections, connectedList, filePackageDelete, files } = this.props;

    const filePackage: number[] = [];

    for (const file of files) {
      filePackage.push(file.id);

      if (file.socket) {
        const connection = connections.getIn(["entities", file.socket]);

        if (connection && connection.connected && connection.socket) {
          connection.socket.emit(CANCELLED, { id: file.remoteId });
        } else if (connectedList.length) {
          const connectedSocket = connectedList[0].socket;

          connectedSocket.emit(CANCELLED, { id: file.remoteId });
          connectedSocket.broadcast.emit(CANCELLED, { id: file.remoteId });
        }
      }
    }

    filePackageDelete(filePackage);
  }
}

export default connect((state, ownProps) => {
  return {
    cloudCSPSettings: state.settings.getIn(["entities", state.settings.default]).cloudCSP,
    connectedList: connectedSelector(state, { connected: true }),
    connections: state.connections,
    encSettings: state.settings.getIn(["entities", state.settings.default]).encrypt,
    eventsDateFrom: state.events.dateFrom,
    eventsDateTo: state.events.dateTo,
    files: mapToArr(state.files.entities),
    isArchiveLog: state.events.isArchive,
    loadingFiles: loadingRemoteFilesSelector(state, { loading: true }),
    location: ownProps.location,
    saveToDocuments: state.settings.getIn(["entities", state.settings.default]).saveToDocuments,
    settingsName: state.settings.getIn(["entities", state.settings.default]).name,
    settings: state.settings,
    signSettings: state.settings.getIn(["entities", state.settings.default]).sign,
    tempContentOfSignedFiles: state.files.tempContentOfSignedFiles,
  };
}, { filePackageDelete })(MenuBar);
