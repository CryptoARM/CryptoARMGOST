import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import {
  ADDRESS_BOOK, CA, CRL, MODAL_CERTIFICATE_IMPORT_DSS,
  MODAL_CERTIFICATE_REQUEST, MODAL_CERTIFICATE_REQUEST_CA, MY, REQUEST, ROOT, MODAL_ADD_SERVICE_CA, LOCATION_CONTAINERS
} from "../../constants";

interface IAddCertificateProps {
  certImport: () => void;
  crlDialog: () => void;
  handleShowModalByType: (type: string) => void;
  location: any;
  onCancel: () => void;
}

class AddCertificate extends React.Component<IAddCertificateProps, any> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: IAddCertificateProps) {
    super(props);

    this.state = {
      hoveredRowIndex: -1,
    };
  }

  componentWillUnmount() {
    this.handelCancel();
  }

  render() {
    const { localize, locale } = this.context;

    return (
      <React.Fragment>
        <div className="row halftop">
          <div className="col s12">
            <div className="content-wrapper tbody border_group">
              <div className="row certificate-list-item">
                {this.getBody()}
              </div>
            </div>
          </div>
        </div>

        <div className="row halfbottom" />

        <div className="row halfbottom">
          <div style={{ float: "right" }}>
            <div style={{ display: "inline-block", margin: "10px" }}>
              <a className="btn btn-outlined waves-effect waves-light modal-close" onClick={this.handelCancel}>{localize("Common.cancel", locale)}</a>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }

  getBody = () => {
    const { location } = this.props;
    const { store, type } = location.state;

    switch (store) {
      case MY:
        return (
          <React.Fragment>
            {this.getImportFromFile()}
            {this.getImportFromDss()}
            {this.getCreateRequest()}
            {this.getCreateRequestCA()}
            {this.getContainer()}
          </React.Fragment>
        );

      case ADDRESS_BOOK:
      case CA:
        return (
          <React.Fragment>
            {this.getImportFromFile()}
          </React.Fragment>
        );

      case ROOT:
        return (
          <React.Fragment>
            {this.getImportFromFile()}
            {this.addServiceCA()}
          </React.Fragment>
        );

      case REQUEST:
        return (
          <React.Fragment>
            {this.getCreateRequest()}
            {this.getCreateRequestCA()}
          </React.Fragment>
        );
      default:
        return (
          <React.Fragment>
            {this.getImportFromFile()}
            {this.getImportFromDss()}
            {this.getCreateRequest()}
            {this.getCreateRequestCA()}
          </React.Fragment>
        );
    }
  }

  getContainer = () => {
    const { localize, locale } = this.context;

    return (
      <div
      className="collection-item avatar certs-collection col s12 valign-wrapper"
      onMouseOver={() => this.handleOnRowMouseOver("cert_import_from_container")}>
      <div className="col" style={{ width: "40px" }}>
        <a data-position="bottom">
          <i className="material-icons certificate container" />
        </a>
      </div>
      <div className="col s11">
        <div className="collection-title">
          <Link to={LOCATION_CONTAINERS} style={{color: "#000"}}>
              {localize("Certificate.cert_import_from_container", locale)}
          </Link>
        </div>
      </div>
    </div>
    )
  }

  getImportFromFile = () => {
    const { localize, locale } = this.context;
    const { location } = this.props;

    return (
      <div
        className="collection-item avatar certs-collection col s12 valign-wrapper"
        onMouseOver={() => this.handleOnRowMouseOver("cert_import_from_file")}>
        <div className="col" style={{ width: "40px" }}>
          <a data-position="bottom">
            <i className="material-icons certificate import" />
          </a>
        </div>
        <div className="col s11">
          <div className="collection-title" onClick={() => {
            this.props.onCancel();
            setTimeout(() => {
              if (location && location.state && location.state.type === CRL) {
                this.props.crlDialog();
              } else {
                this.props.certImport();
              }
            }, 100);
          }}>
            {localize("Certificate.cert_import_from_file", locale)}
          </div>
        </div>
      </div>
    );
  }

  getImportFromDss = () => {
    const { localize, locale } = this.context;

    return (
      <div
        className="collection-item avatar certs-collection col s12 valign-wrapper"
        onMouseOver={() => this.handleOnRowMouseOver("cert_import_from_DSS")}>
        <div className="col" style={{ width: "40px" }}>
          <a data-position="bottom">
            <i className="material-icons certificate import_dss_cert" />
          </a>
        </div>
        <div className="col s11">
          <div className="collection-title" onClick={() => {
            this.props.onCancel();
            setTimeout(() => {
              this.props.handleShowModalByType(MODAL_CERTIFICATE_IMPORT_DSS);
            }, 100);
          }}>
            {localize("DSS.cert_import_from_DSS", locale)}
          </div>
        </div>
      </div>
    );
  }

  getCreateRequest = () => {
    const { localize, locale } = this.context;

    return (
      <div
        className="collection-item avatar certs-collection col s12 valign-wrapper"
        onMouseOver={() => this.handleOnRowMouseOver("create_request")}>
        <div className="col" style={{ width: "40px" }}>
          <a data-position="bottom">
            <i className="material-icons certificate add_question" />
          </a>
        </div>
        <div className="col s11">
          <div className="collection-title" onClick={() => {
            this.props.onCancel();
            setTimeout(() => {
              this.props.handleShowModalByType(MODAL_CERTIFICATE_REQUEST);
            }, 100);
          }}>
            {localize("CSR.create_request", locale)}
          </div>
        </div>
      </div>
    );
  }

  getCreateRequestCA = () => {
    const { localize, locale } = this.context;

    return (
      <div
        className="collection-item avatar certs-collection col s12 valign-wrapper"
        onMouseOver={() => this.handleOnRowMouseOver("cert_get_through_ca")}>
        <div className="col" style={{ width: "40px" }}>
          <a data-position="bottom">
            <i className="material-icons certificate cloud_question" />
          </a>
        </div>
        <div className="col s11">
          <div className="collection-title" onClick={() => {
            this.props.onCancel();
            setTimeout(() => {
              this.props.handleShowModalByType(MODAL_CERTIFICATE_REQUEST_CA);
            }, 100);
          }}>
            {localize("Certificate.cert_get_through_ca", locale)}
          </div>
        </div>
      </div>
    );
  }

  addServiceCA = () => {
    const { localize, locale } = this.context;

    return (
      <div
        className="collection-item avatar certs-collection col s12 valign-wrapper"
        onMouseOver={() => this.handleOnRowMouseOver("cert_get_through_ca")}>
        <div className="col" style={{ width: "40px" }}>
          <a data-position="bottom">
            <i className="material-icons certificate cloud_question" />
          </a>
        </div>
        <div className="col s11">
          <div className="collection-title" onClick={() => {
            this.props.onCancel();
            setTimeout(() => {
              this.props.handleShowModalByType(MODAL_ADD_SERVICE_CA);
            }, 100);
          }}>
            {localize("Services.connect_ca", locale)}
          </div>
        </div>
      </div>
    );
  }

  handleOnRowMouseOver = (recipient: any) => {
    if (this.state.hoveredRowIndex !== recipient) {
      this.setState({
        hoveredRowIndex: recipient,
      });
    }
  }

  handelCancel = () => {
    const { onCancel } = this.props;

    if (onCancel) {
      onCancel();
    }
  }
}

export default AddCertificate;
