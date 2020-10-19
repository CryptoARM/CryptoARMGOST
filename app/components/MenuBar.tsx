import { hideModalHTTPErr } from "../AC/trustedServicesActions";
import * as fs from "fs";
import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { filePackageDelete } from "../AC";
import { getServiceBaseLinkFromUrl, cancelUrlAction, removeUrlAction } from "../AC/urlActions";
import {
  LOCATION_ABOUT, LOCATION_ADDRESS_BOOK, LOCATION_CERTIFICATE_SELECTION_FOR_ENCRYPT,
  LOCATION_CERTIFICATE_SELECTION_FOR_SIGNATURE,
  LOCATION_CERTIFICATES, LOCATION_CONTAINERS,
  LOCATION_DOCUMENTS, LOCATION_EVENTS, LOCATION_LICENSE, LOCATION_RESULTS_MULTI_OPERATIONS,
  LOCATION_SERVICES, LOCATION_SETTINGS, LOCATION_SETTINGS_CONFIG, LOCATION_SETTINGS_SELECT,
  LOCATION_TRUSTED_SERVICES, SETTINGS_JSON, TRUSTED_CRYPTO_LOG,
} from "../constants";
import { CANCELLED } from "../server/constants";
import { fileExists, mapToArr } from "../utils";
import Diagnostic from "./Diagnostic/Diagnostic";
import Modal from "./Modal";
import AskSaveSetting from "./Settings/AskSaveSetting";
import LocaleSelect from "./Settings/LocaleSelect";
import SideMenu from "./SideMenu";
import AddTrustedService from "./TrustedServices/AddTrustedService";
import { removeSearchValue } from "../AC/searchActions";

const remote = window.electron.remote;
if (remote.getGlobal("sharedObject").logcrypto) {
  try {
    window.logger = trusted.common.Logger.start(TRUSTED_CRYPTO_LOG);
  } catch (e) {
    // tslint:disable-next-line: no-console
    console.error(e.message);
  }
}

interface IMenuBarState {
  isMaximized: boolean;
  showModalAskSaveSetting: boolean;
  showModalAddTrustedService: boolean;
  showModalHTTPErr: boolean;
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
      showModalAddTrustedService: false,
      showModalAskSaveSetting: false,
      showModalHTTPErr: false,
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.trustedServices.showModal === false
      && this.props.trustedServices.showModal === true) {
      this.handleShowModalAddTrustedService();
    }

    if (prevProps.trustedServices.showModal === true
      && this.props.trustedServices.showModal === false) {
      this.handleCloseModalAddTrustedService();
    }

    if (prevProps.trustedServices.showErrModal === false
      && this.props.trustedServices.showErrModal === true) {
      this.handleShowModalHTTPErr();
    }

    if (prevProps.trustedServices.showErrModal === true
      && this.props.trustedServices.showErrModal === false) {
      this.handleCloseModalHTTPErr();
    }

    if (this.props.location.pathname !== prevProps.location.pathname && this.props.searchValue){
        removeSearchValue();
    }
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
    const { settings, tempContentOfSignedFiles, operationRemoteAction } = this.props;

    if (operationRemoteAction) {
      this.removeAllFiles();
      console.log("operationRemoteAction", operationRemoteAction);
      cancelUrlAction("signAndEncrypt.outDirectResults", operationRemoteAction.url, operationRemoteAction.id);
      removeUrlAction();
    };

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
    const { isArchiveLog, eventsDateFrom, eventsDateTo, urlCmds } = this.props;
    const pathname = this.props.location.pathname;
    const storename = this.props.location.state ? this.props.location.state.head : "";
    const nameVersion = localize("About.product_NAME", locale) + " " + localize("About.version", locale);

    if (urlCmds && urlCmds.command && urlCmds.command.length) {
      const serviceBaseUrl = getServiceBaseLinkFromUrl(urlCmds.url);
      switch (urlCmds.command) {
        case "signandencrypt":
          return `${localize("SignAndEncrypt.sign_and_encrypt", locale)} - ${serviceBaseUrl}`;

        case "certificates":
          return `${localize("Certificate.certs", locale)} - ${serviceBaseUrl}`;
      }
    }

    switch (pathname) {
      case LOCATION_ABOUT:
        return `${nameVersion} - ${localize("About.about", locale)}`;

      case LOCATION_ADDRESS_BOOK:
        return `${nameVersion} - ${localize("AddressBook.address_book", locale)}`;

      case LOCATION_CERTIFICATE_SELECTION_FOR_ENCRYPT:
        return `${nameVersion} - ${localize("Certificate.certificate_selection_for_encrypt", locale)}`;

      case LOCATION_CERTIFICATE_SELECTION_FOR_SIGNATURE:
        return `${nameVersion} - ${localize("Certificate.certificate_selection_for_signature", locale)}`;

      case LOCATION_CERTIFICATES:
        const head = storename ? storename : localize("Certificate.certs", locale);
        return `${nameVersion} - ${head}`;

      case LOCATION_CONTAINERS:
        return `${nameVersion} - ${localize("Certificate.sidesubmenu_keys", locale)}`;

      case LOCATION_TRUSTED_SERVICES:
        return `${nameVersion} - ${localize("TrustedServices.trusted_services", locale)}`;

      case LOCATION_LICENSE:
        return `${nameVersion} - ${localize("License.license", locale)}`;

      case LOCATION_SETTINGS:
        return `${nameVersion} - ${localize("Settings.settings", locale)}`;

      case LOCATION_SETTINGS_CONFIG:
        return `${nameVersion} - ${localize("Settings.settings_config", locale)}`;

      case LOCATION_SETTINGS_SELECT:
        return `${nameVersion} - ${localize("Settings.settings_select", locale)}`;

      case LOCATION_DOCUMENTS:
        return `${nameVersion} - ${localize("Documents.documents", locale)}`;

      case LOCATION_RESULTS_MULTI_OPERATIONS:
        return `${nameVersion} - ${localize("Operations.results", locale)}`;

      case LOCATION_EVENTS:
        let title = `${nameVersion} - ${localize("Events.operations_log", locale)}`;

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
            }) + "] - " + nameVersion;
        }
        return title;

      case LOCATION_SERVICES:
        return `${nameVersion} - ${localize("Services.services", locale)}`;

      default:
        return `${nameVersion} - ${localize("SignAndEncrypt.sign_and_encrypt", locale)}`;
    }
  }

  render() {
    const pathname = this.props.location.pathname;

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
          <ul id="slide-out" className={`side-nav fixed`} style={{ width: "50px", left: "2px", overflow: "visible", backgroundColor: "rgba(242,245,245,0.8)" }}>
            <SideMenu removeAllFiles={this.removeAllFiles} pathname={pathname} showModalAskSaveSetting={this.handleShowModalAskSaveSetting} />
          </ul>

        </nav>
        {this.props.children}
        <Diagnostic />
        {this.showModalHTTPErr()}
        {this.showModalAddTrustedService()}
        {this.showModalAskSaveSetting()}
      </React.Fragment>
    );
  }

  isFilesFromSocket = () => {
    const { operationIsRemote } = this.props;

    if (operationIsRemote) {
      return true;
    }

    return false;
  }

  removeAllFiles = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { connections, filePackageDelete, files } = this.props;

    const filePackage: number[] = [];

    for (const file of files) {
      filePackage.push(file.id);
    }

    filePackageDelete(filePackage);
  }

  showModalAskSaveSetting = () => {
    const { localize, locale } = this.context;
    const { showModalAskSaveSetting } = this.state;

    if (!showModalAskSaveSetting) {
      return;
    }

    return (
      <Modal
        isOpen={showModalAskSaveSetting}
        key="ShowModalAskSaveSetting"
        header={localize("Settings.save", locale)}
        onClose={this.handleCloseModalAskSaveSetting}
        style={{ width: "500px" }}>

        <AskSaveSetting
          isOnExit={true}
          onCancel={this.handleCloseModalAskSaveSetting}
        />
      </Modal>
    );
  }

  handleShowModalAskSaveSetting = () => {
    this.setState({ showModalAskSaveSetting: true });
  }

  handleCloseModalAskSaveSetting = () => {
    this.setState({ showModalAskSaveSetting: false });
  }

  showModalAddTrustedService = () => {
    const { localize, locale } = this.context;
    const { showModalAddTrustedService } = this.state;

    if (!showModalAddTrustedService) {
      return;
    }

    return (
      <Modal
        isOpen={showModalAddTrustedService}
        key="showModalAddTrustedService"
        header={localize("TrustedServices.external_resource_request", locale)}
        onClose={this.handleCloseModalAddTrustedService}
        style={{ width: "440px" }}>

        <AddTrustedService
          onCancel={this.handleCloseModalAddTrustedService}
        />
      </Modal>
    );
  }

  handleShowModalAddTrustedService = () => {
    this.setState({ showModalAddTrustedService: true });
  }

  handleCloseModalAddTrustedService = () => {
    this.setState({ showModalAddTrustedService: false });
    remote.getCurrentWindow().minimize();
  }

  showModalHTTPErr = () => {
    const { localize, locale } = this.context;
    const { showModalHTTPErr } = this.state;

    if (!showModalHTTPErr) {
      return;
    }

    return (
      <Modal
        isOpen={showModalHTTPErr}
        onClose={hideModalHTTPErr}
        header={localize("Settings.warning", locale)}
        style={{ width: "380px" }}>
          <div className="row halftop">
            <div className="dialog-text">
            Сервис использует незащищённое соединение.<br/>
            В целях безопасности команда не будет выполнена.
            </div>
          </div>
          <div className="row halfbottom" style={{ marginBottom: "0px" }}>
            <div style={{ float: "right" }}>
              <div style={{ display: "inline-block", margin: "4px"}}>
              <a
                className="btn btn-text waves-effect waves-light modal-close"
                onClick={hideModalHTTPErr}
                >
                  {localize("Common.cancel", locale)}
              </a>
              </div>
            </div>
          </div>
      </Modal>
    )
  }

  handleShowModalHTTPErr = () => {
    this.setState({ showModalHTTPErr: true });
  }

  handleCloseModalHTTPErr = () => {
    this.setState({ showModalHTTPErr: false });
  }

}

export default connect((state, ownProps) => {
  return {
    cloudCSPSettings: state.settings.getIn(["entities", state.settings.default]).cloudCSP,
    connections: state.connections,
    encSettings: state.settings.getIn(["entities", state.settings.default]).encrypt,
    eventsDateFrom: state.events.dateFrom,
    eventsDateTo: state.events.dateTo,
    files: mapToArr(state.files.entities),
    isArchiveLog: state.events.isArchive,
    location: ownProps.location,
    settingsName: state.settings.getIn(["entities", state.settings.default]).name,
    settings: state.settings,
    signSettings: state.settings.getIn(["entities", state.settings.default]).sign,
    tempContentOfSignedFiles: state.files.tempContentOfSignedFiles,
    trustedServices: state.trustedServices,
    operationIsRemote: state.urlActions.performed || state.urlActions.performing,
    urlCmds: state.urlCmds,
    operationRemoteAction: state.urlActions.action,
    searchValue: state.filters.searchValue,
  };
}, { filePackageDelete })(MenuBar);
