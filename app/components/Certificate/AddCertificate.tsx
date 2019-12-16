import PropTypes from "prop-types";
import React from "react";
import { MODAL_CERTIFICATE_IMPORT_DSS, MODAL_CERTIFICATE_REQUEST, MODAL_CERTIFICATE_REQUEST_CA } from "../../constants";

interface IAddCertificateProps {
  certImport: () => void;
  handleShowModalByType: (type: string) => void;
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
                        this.props.certImport();
                      }, 100);
                    }}>
                      {localize("Certificate.cert_import_from_file", locale)}
                    </div>
                  </div>
                </div>

                <div
                  className="collection-item avatar certs-collection col s12 valign-wrapper"
                  onMouseOver={() => this.handleOnRowMouseOver("cert_import_from_DSS")}>
                  <div className="col" style={{ width: "40px" }}>
                    <a data-position="bottom">
                      <i className="material-icons certificate import" />
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

                <div
                  className="collection-item avatar certs-collection col s12 valign-wrapper"
                  onMouseOver={() => this.handleOnRowMouseOver("create_request")}>
                  <div className="col" style={{ width: "40px" }}>
                    <a data-position="bottom">
                      <i className="material-icons certificate import" />
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

                <div
                  className="collection-item avatar certs-collection col s12 valign-wrapper"
                  onMouseOver={() => this.handleOnRowMouseOver("cert_get_through_ca")}>
                  <div className="col" style={{ width: "40px" }}>
                    <a data-position="bottom">
                      <i className="material-icons certificate import" />
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
