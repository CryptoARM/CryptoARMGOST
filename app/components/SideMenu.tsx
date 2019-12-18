import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import {
  ADDRESS_BOOK, CA, LOCATION_ABOUT,
  LOCATION_ADDRESS_BOOK, LOCATION_CERTIFICATES, LOCATION_CONTAINERS,
  LOCATION_DOCUMENTS, LOCATION_EVENTS, LOCATION_MAIN,
  LOCATION_SERVICES, MY, REQUEST, ROOT,
} from "../constants";
import { mapToArr } from "../utils";

const remote = window.electron.remote;

interface ISideMenuProps {
  certificates: any;
  certrequests: any;
  crls: any;
  pathname: string;
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
    $("#document_stores").dropdown();
    $("#dropdown-about").dropdown();
  }

  render() {
    const { localize, locale } = this.context;
    const { pathname } = this.props;

    return (
      <React.Fragment>
        <div className="menu-logo center-align" style={{ height: "37px" }}>
          <Link to="/" href="/" style={{ height: "37px" }}>
            <i className="material-icons left logo-trusted" />
          </Link>
        </div>

        <div className="row">
          <div className="row nobottom">
            {LOCATION_MAIN === pathname || LOCATION_DOCUMENTS === pathname ? < div className="side-nav-rectangle" /> : null}
            <Link id="document_stores" to={LOCATION_MAIN} data-activates="dropdown-documents-stores" data-hover="hover" style={{ padding: "0 10px" }}>
              <i className="material-icons sidevan document"></i>
            </Link>
          </div>

          <div className="row nobottom">
            {LOCATION_CERTIFICATES === pathname || LOCATION_CONTAINERS === pathname ? < div className="side-nav-rectangle" /> : null}
            <Link
              id="certs"
              to={{ pathname: LOCATION_CERTIFICATES, search: "my", state: { head: localize("Certificate.certs_my", locale), MY } }}
              data-activates="dropdown-certificate-stores"
              data-hover="hover"
              style={{ padding: "0 10px" }}
            >
              <i className="material-icons sidevan cert"></i>
            </Link>
          </div>

          <div className="row nobottom">
            {LOCATION_ADDRESS_BOOK === pathname ? < div className="side-nav-rectangle" /> : null}
            <Link to={LOCATION_ADDRESS_BOOK} style={{ padding: "0 10px" }}>
              <i className="material-icons sidevan address_book"></i>
            </Link>
          </div>

          <div className="row nobottom">
            {LOCATION_SERVICES === pathname ? < div className="side-nav-rectangle" /> : null}
            <Link to={LOCATION_SERVICES} style={{ padding: "0 10px" }}>
              <i className="material-icons sidevan dss"></i>
            </Link>
          </div>
        </div>
        <div className="row">
          <div className="menu-elements">
            <div className="row nobottom">
              <div className="row nobottom">
                {LOCATION_ABOUT === pathname || LOCATION_EVENTS === pathname ? < div className="side-nav-rectangle" /> : null}
                <Link id="dropdown-about" to={LOCATION_ABOUT} data-activates="dropdown-about-pages" data-hover="hover" style={{ padding: "0 10px" }}>
                  <i className="material-icons sidevan about" style={{ padding: "0 10px" }}>about</i>
                </Link>
              </div>
              <Link to="/" onClick={() => {
                remote.getGlobal("sharedObject").isQuiting = true;
                remote.getCurrentWindow().close();
              }} style={{ padding: "0 10px" }}>

                <i className="material-icons sidevan exit">exit_to_app</i>
              </Link>
            </div>
          </div>
        </div>
        {this.getCertStoresMenu()}
        {this.getDocumentsStoresMenu()}
        {this.getAboutMenu()}
      </React.Fragment>
    );
  }

  getCertStoresMenu = () => {
    const { certificates, crls, certrequests } = this.props;
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
      <div>
        <ul id="dropdown-certificate-stores" className="dropdown-content" style={{ minHeight: "85px" }}>
          <li>
            <div className="center-align">
              <a style={{ fontWeight: "bold", color: "#bf3817" }}>СЕРТИФИКАТЫ</a>
            </div>
          </li>
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

  getDocumentsStoresMenu = () => {
    const { localize, locale } = this.context;

    return (
      <div>
        <ul id="dropdown-documents-stores" className="dropdown-content" style={{ minHeight: "120px" }}>
          <li>
            <div className="center-align">
              <a style={{ fontWeight: "bold", color: "#bf3817" }}>ДОКУМЕНТЫ</a>
            </div>
          </li>
          <li onClick={() => $("#document_stores").dropdown("close")}>
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
          <li onClick={() => $("#document_stores").dropdown("close")}>
            <Link to={LOCATION_DOCUMENTS} style={{ height: "33px", padding: "0px" }}>
              <div className="row nobottom valign-wrapper">
                <div className="col" style={{ width: "36px" }}>
                  <i className="material-icons left folder" />
                </div>
                <div className="col">
                  {localize("Documents.documents", locale)}
                </div>
              </div>
            </Link>
          </li>
        </ul>
      </div>
    );
  }

  getAboutMenu = () => {
    const { localize, locale } = this.context;

    return (
      <div>
        <ul id="dropdown-about-pages" className="dropdown-content" style={{ minHeight: "150px", height: "150px" }}>
          <li>
            <div className="center-align">
              <a style={{ fontWeight: "bold", color: "#bf3817" }}>О ПРОГРАММЕ</a>
            </div>
          </li>

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
          <li onClick={() => $("#dropdown-about").dropdown("close")}>
            <a style={{ height: "33px", padding: "0px" }} onClick={() => window.electron.shell.openExternal(localize("Help.link_user_guide", locale))}>
              <div className="row nobottom valign-wrapper">
                <div className="col" style={{ width: "36px" }}>
                  <i className="material-icons left help" />
                </div>
                <div className="col">
                  Справка
                </div>
              </div>
            </a>
          </li>
        </ul>
      </div>
    );
  }
}

export default connect((state) => {
  return {
    certificates: state.certificates.entities,
    certrequests: state.certrequests.entities,
    crls: mapToArr(state.crls.entities),
  };
})(SideMenu);
