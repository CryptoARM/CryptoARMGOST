import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { cancelUrlAction, removeUrlAction } from "../AC/urlActions";
import {
  ADDRESS_BOOK, CA, LOCATION_ABOUT,
  LOCATION_ADDRESS_BOOK, LOCATION_CERTIFICATES, LOCATION_CONTAINERS,
  LOCATION_DOCUMENTS, LOCATION_EVENTS, LOCATION_MAIN, LOCATION_RESULTS_MULTI_OPERATIONS,
  LOCATION_TRUSTED_SERVICES, MY, REQUEST, ROOT,
} from "../constants";
import { mapToArr } from "../utils";
import history from "../history";

const remote = window.electron.remote;

interface ISideMenuProps {
  certificates: any;
  certrequests: any;
  crls: any;
  pathname: string;
  setting: any;
  removeAllFiles: () => void;
}

class SideMenu extends React.Component<ISideMenuProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: ISideMenuProps) {
    super(props);
  }

  componentDidMount() {
    $("#certs").dropdown();
    $("#sign_encrypt").dropdown();
    $("#document_stores").dropdown();
    $("#dropdown-about").dropdown();
    $("#address-book").dropdown();
    $("#dropdown-exit").dropdown();
    $("#trusted_services").dropdown();
  }

  render() {
    const { operationIsRemote } = this.props;
    const disabledNavigate = operationIsRemote;
    const { localize, locale } = this.context;
    const { pathname } = this.props;

    return (
      <React.Fragment>
        <div className="menu-logo center-align " style={{ height: "37px" }}>
          <Link to="/" href="/" style={{ height: "37px" }}>
            <i className="material-icons left logo-trusted" />
          </Link>
        </div>

        <div className="row">
          <div className={`row nobottom ${disabledNavigate ? "disabled" : ""}`}>
            {LOCATION_MAIN === pathname ? < div className="side-nav-rectangle" /> : null}
            <Link id="sign_encrypt" to={LOCATION_MAIN} data-activates="dropdown-sign_and_encrypt" data-hover="hover" style={{ padding: "0 10px" }}>
              <i className={`material-icons sidevan sign_and_encrypt ${disabledNavigate ? "disabledIcon" : ""}`}></i>
            </Link>
          </div>

          <div className={`row nobottom ${disabledNavigate ? "disabled" : ""}`}>
            {LOCATION_DOCUMENTS === pathname ? < div className="side-nav-rectangle" /> : null}
            <Link id="document_stores" to={LOCATION_DOCUMENTS} data-activates="dropdown-documents-stores" data-hover="hover" style={{ padding: "0 10px" }}>
              <i className={`material-icons sidevan document ${disabledNavigate ? "disabledIcon" : ""}`}></i>
            </Link>
          </div>

          <div className={`row nobottom ${disabledNavigate ? "disabled" : ""}`}>
            {LOCATION_CERTIFICATES === pathname || LOCATION_CONTAINERS === pathname ? < div className="side-nav-rectangle" /> : null}
            <Link
              id="certs"
              to={{ pathname: LOCATION_CERTIFICATES, search: "my", state: { head: localize("Certificate.certs_my", locale), store: MY } }}
              data-activates="dropdown-certificate-stores"
              data-hover="hover"
              style={{ padding: "0 10px" }}
            >
              <i className={`material-icons sidevan cert ${disabledNavigate ? "disabledIcon" : ""}`}></i>
            </Link>
          </div>

          <div className={`row nobottom ${disabledNavigate ? "disabled" : ""}`}>
            {LOCATION_ADDRESS_BOOK === pathname ? < div className="side-nav-rectangle" /> : null}
            <Link
              id="address-book"
              to={{ pathname: LOCATION_ADDRESS_BOOK, search: ADDRESS_BOOK, state: { head: localize("AddressBook.address_book", locale), store: ADDRESS_BOOK } }}
              data-activates="dropdown-address-book"
              data-hover="hover"
              style={{ padding: "0 10px" }}>
              <i className={`material-icons sidevan address_book  ${disabledNavigate ? "disabledIcon" : ""}`}></i>
            </Link>
          </div>
        </div>
        <div className="row">
          <div className="menu-elements">
            <div className="row nobottom">
              <div className={`row nobottom ${disabledNavigate ? "disabled" : ""}`}>
                {LOCATION_TRUSTED_SERVICES === pathname ? < div className="side-nav-rectangle" /> : null}
                <Link id="trusted_services" to={LOCATION_TRUSTED_SERVICES} data-activates="dropdown-trusted-services" data-hover="hover" style={{ padding: "0 10px" }}>
                  <i className={`material-icons sidevan services ${disabledNavigate ? "disabledIcon" : ""}`} style={{ padding: "0 10px" }}>about</i>
                </Link>
              </div>
              <div className={`row nobottom ${disabledNavigate ? "disabled" : ""}`}>
                {LOCATION_ABOUT === pathname || LOCATION_EVENTS === pathname ? < div className="side-nav-rectangle" /> : null}
                <Link id="dropdown-about" to={LOCATION_ABOUT} data-activates="dropdown-about-pages" data-hover="hover" style={{ padding: "0 10px" }}>
                  <i className={`material-icons sidevan about ${disabledNavigate ? "disabledIcon" : ""}`} style={{ padding: "0 10px" }}>about</i>
                </Link>
              </div>
              <Link
                id="dropdown-exit"
                to="/"
                data-activates="dropdown-menu-exit"
                data-hover="hover"
                onClick={this.onExit}
                style={{ padding: "0 10px" }}>

                <i className="material-icons sidevan exit">exit_to_app</i>
              </Link>
            </div>
          </div>
        </div>
        {this.getSignAndEncryptMenu()}
        {this.getDocumentsMenu()}
        {this.getCertStoresMenu()}
        {this.getAddressBookMenu()}
        {this.getAboutMenu()}
        {this.getExitMenu()}
        {this.getTrustedServicesMenu()}
      </React.Fragment>
    );
  }
  getSignAndEncryptMenu = () => {
    const { localize, locale } = this.context;

    return (
      <div style={{ display: "none", pointerEvents: "none", cursor: "default" }}>
        <Link to={LOCATION_MAIN}>
          <ul id="dropdown-sign_and_encrypt" className="dropdown-content" style={{ display: "none" }}>
            <li>
              <div className="center-align">
                <a style={{ fontWeight: "bold", color: "#bf3817" }}>{localize("SignAndEncrypt.SignAndEncrypt", locale)}</a>
              </div>
            </li>
            <li onClick={() => $("#sign_encrypt").dropdown("close")}>
              <Link to={LOCATION_MAIN} style={{ height: "33px", padding: "0px" }}>
                <div className="row nobottom valign-wrapper">
                  <div className="col" style={{ width: "36px" }}>
                    <i className="material-icons left sign_operation" />
                  </div>
                  <div className="col">
                    {localize("SignAndEncrypt.sign_and_encrypt", locale)}
                  </div>
                </div>
              </Link>
            </li>
            <li onClick={() => $("#sign_encrypt").dropdown("close")}>
              <Link to={LOCATION_RESULTS_MULTI_OPERATIONS} style={{ height: "33px", padding: "0px" }}>
                <div className="row nobottom valign-wrapper">
                  <div className="col" style={{ width: "36px" }}>
                    <i className="material-icons left journal" />
                  </div>
                  <div className="col">
                    {localize("Operations.last_operation_result", locale)}
                  </div>
                </div>
              </Link>
            </li>
          </ul>
        </Link>
      </div>
    );
  }

  getDocumentsMenu = () => {
    return (
      <div style={{ display: "none", pointerEvents: "none", cursor: "default" }}>
        <Link to={LOCATION_DOCUMENTS}>
          <ul id="dropdown-documents-stores" className="dropdown-content" style={{ display: "none" }}>
            <li>
              <div className="center-align">
                <a style={{ fontWeight: "bold", color: "#bf3817" }}>ДОКУМЕНТЫ</a>
              </div>
            </li>
          </ul>
        </Link>
      </div>
    );
  }

  getTrustedServicesMenu = () => {
    return (
      <div style={{ display: "none", pointerEvents: "none", cursor: "default" }}>
        <Link to={LOCATION_TRUSTED_SERVICES}>
          <ul id="dropdown-trusted-services" className="dropdown-content" style={{ display: "none" }}>
            <li>
              <div className="center-align">
                <a style={{ fontWeight: "bold", color: "#bf3817" }}>СЕРВИСЫ</a>
              </div>
            </li>
          </ul>
        </Link>
      </div>
    );
  }

  getAddressBookMenu = () => {
    const { localize, locale } = this.context;

    return (
      <div style={{ display: "none", pointerEvents: "none", cursor: "default" }}>
        <Link
          to={{ pathname: LOCATION_ADDRESS_BOOK, search: ADDRESS_BOOK, state: { head: localize("AddressBook.address_book", locale), store: ADDRESS_BOOK } }}>
          <ul id="dropdown-address-book" className="dropdown-content" style={{ display: "none" }}>
            <li>
              <div className="center-align">
                <a style={{ fontWeight: "bold", color: "#bf3817" }}>КОНТАКТЫ</a>
              </div>
            </li>
          </ul>
        </Link>
      </div>
    );
  }

  getCertStoresMenu = () => {
    const { certificates, crls, certrequests, servicesMap } = this.props;
    const { localize, locale } = this.context;

    const my: object[] = [];
    const root: object[] = [];
    const intermediate: object[] = [];
    const token: object[] = [];
    const request: object[] = [];

    certificates.forEach((cert: any) => {
      switch (cert.category) {
        case MY:
          return my.push(cert);
        case ROOT:
          return root.push(cert);
        case CA:
          return intermediate.push(cert);
        case REQUEST:
          return request.push(cert);
      }
    });

    certrequests.forEach((csr: any) => {
      return request.push(csr);
    });

    return (
      <div style={{ display: "none", pointerEvents: "none", cursor: "default" }}>
        <ul id="dropdown-certificate-stores" className="dropdown-content" style={{ minHeight: "85px", display: "none" }}>
          <Link
            to={{ pathname: LOCATION_CERTIFICATES, search: "my", state: { head: localize("Certificate.certs_my", locale), store: MY } }}
            style={{ padding: "0px" }}
          >
            <li>
              <div className="center-align">
                <a style={{ fontWeight: "bold", color: "#bf3817" }}>СЕРТИФИКАТЫ</a>
              </div>
            </li>
          </Link>

          {
            servicesMap && servicesMap.size ?
              <Link
                to={{ pathname: LOCATION_CERTIFICATES, search: "my", state: { head: localize("Certificate.certs_my", locale), store: MY } }}
                style={{ padding: "0px" }}
              >
                <li onClick={() => history.replace({
                  pathname: LOCATION_CERTIFICATES, search: "my", state: { head: localize("Certificate.certs_my", locale), store: MY, showModalCertificateRequestCAResolve: true },
                })}>
                  <div className="center-align">
                    <a style={{ fontWeight: "bold", color: "#bf3817" }}>СЕРВИСЫ УЦ</a>
                  </div>
                </li>
              </Link>
              : null
          }


          {this.getCertStoreMenuElement(localize("Certificate.sidesubmenu_my", locale), localize("Certificate.certs_my", locale), "my", MY, my)}
          {this.getCertStoreMenuElement(localize("Certificate.sidesubmenu_intermediate", locale), localize("Certificate.certs_intermediate", locale), "intermediate", CA, intermediate)}
          {this.getCertStoreMenuElement(localize("Certificate.sidesubmenu_root", locale), localize("Certificate.certs_root", locale), "root", ROOT, root)}
          {this.getCertStoreMenuElement(localize("Certificate.sidesubmenu_request", locale), localize("Certificate.certs_request", locale), "request", REQUEST, request, "REQUEST")}
          {this.getCertStoreMenuElement(localize("Certificate.sidesubmenu_crls", locale), localize("Certificate.crls", locale), "crl", CA, crls, "CRL")}
          <li onClick={() => $("#certs").dropdown("close")}>
            <Link to={LOCATION_CONTAINERS} style={{ height: "33px", padding: "0px" }}>
              <div className="row nobottom valign-wrapper">
                <div className="col" style={{ width: "36px" }}>
                  <i className="material-icons left container" />
                </div>
                <div className="col">
                  {localize("Certificate.sidesubmenu_keys", locale)}
                </div>
              </div>
            </Link>
          </li>
        </ul>
      </div>
    );
  }

  getCertStoreMenuElement = (head: string, menuBarHead: string, name: string, store: string, elements: object[], type = "CERTIFICATE") => {
    if (elements && elements.length) {
      return (
        <li onClick={() => $("#certs").dropdown("close")}>
          <Link to={{ pathname: LOCATION_CERTIFICATES, search: name, state: { head: menuBarHead, store, type } }} style={{ height: "33px", padding: "0px" }}>
            <div className="row nobottom valign-wrapper">
              <div className="col" style={{ width: "36px" }}>
                <i className={`material-icons left ${name}`} />
              </div>
              <div className="col ">
                {head}
              </div>
            </div>
          </Link>
        </li >
      );
    } else {
      return null;
    }
  }

  getAboutMenu = () => {
    const { localize, locale } = this.context;

    return (
      <div style={{ display: "none", pointerEvents: "none", cursor: "default" }}>
        <ul id="dropdown-about-pages" className="dropdown-content" style={{ display: "none", minHeight: "150px", height: "150px" }}>
          <Link
            to={LOCATION_ABOUT}
            style={{ padding: "0px" }}
          >
            <li>
              <div className="center-align">
                <a style={{ fontWeight: "bold", color: "#bf3817" }}>О ПРОГРАММЕ</a>
              </div>
            </li>
          </Link>

          <li onClick={() => $("#dropdown-about").dropdown("close")}>
            <Link to={LOCATION_ABOUT} style={{ height: "33px", padding: "0px" }}>
              <div className="row nobottom valign-wrapper">
                <div className="col" style={{ width: "36px" }}>
                  <i className="material-icons left application" />
                </div>
                <div className="col">
                  {localize("About.about", locale)}
                </div>
              </div>
            </Link>
          </li>

          <li onClick={() => $("#dropdown-about").dropdown("close")}>
            <Link to={LOCATION_EVENTS} style={{ height: "33px", padding: "0px" }}>
              <div className="row nobottom valign-wrapper">
                <div className="col" style={{ width: "36px" }}>
                  <i className="material-icons left journal" />
                </div>
                <div className="col">
                  {localize("Events.operations_log", locale)}
                </div>
              </div>
            </Link>
          </li>
          <li onClick={() => $("#dropdown-about").dropdown("close")} >
            <a style={{ height: "33px", padding: "0px" }} onClick={() => window.electron.shell.openExternal("https://cryptoarm.ru/documentation/5-razdel-3")}>
              <div className="row nobottom valign-wrapper">
                <div className="col" style={{ width: "36px" }}>
                  <i className="material-icons left help" />
                </div>
                <div className="col">
                  {localize("Help.help", locale)}
                </div>
              </div>
            </a>
          </li>
        </ul>
      </div>
    );
  }

  getExitMenu = () => {
    return (
      <div style={{ display: "none", pointerEvents: "none", cursor: "default" }}>
        <Link to="/" onClick={this.onExit} style={{ padding: "0 10px" }}>

          <ul id="dropdown-menu-exit" className="dropdown-content" style={{ top: "34px !impotant", display: "none" }}>
            <li>
              <div className="center-align">
                <a style={{ fontWeight: "bold", color: "#bf3817" }}>ВЫХОД</a>
              </div>
            </li>
          </ul>
        </Link>
      </div>
    );
  }

  onExit = async () => {
    const { operationRemoteAction, setting } = this.props;

    if (operationRemoteAction) {
      await cancelUrlAction("signAndEncrypt.outDirectResults", operationRemoteAction.url, operationRemoteAction.id);
    }
    this.props.removeAllFiles();
    removeUrlAction();

    if (setting && setting.changed) {
      this.props.showModalAskSaveSetting();
    } else {
      remote.getGlobal("sharedObject").isQuiting = true;
      remote.getCurrentWindow().close();

    }
  }
}

export default connect((state) => {
  return {
    operationRemoteAction: state.urlActions.action,
    operationIsRemote: state.urlActions.performed || state.urlActions.performing
      || state.globalLocks.lockNavigation,
    certificates: state.certificates.entities,
    certrequests: state.certrequests.entities,
    crls: mapToArr(state.crls.entities),
    setting: state.settings.getIn(["entities", state.settings.active]),
    servicesMap: state.services.entities,
  };
})(SideMenu);
