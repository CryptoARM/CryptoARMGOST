import PropTypes from "prop-types";
import React from "react";
import { USER_NAME } from "../../constants";
import logger from "../../winstonLogger";

interface ICRLDeleteProps {
  crl: any;
  onCancel?: () => void;
  reloadCertificates: () => void;
}

class CRLDelete extends React.Component<ICRLDeleteProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

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
              <div className="col s12">
                <span className="card-infos sub">
                  {localize("CRL.realy_delete_crl", locale)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="row halfbottom" />

        <div className="row halfbottom">
          <div style={{ float: "right" }}>
            <div style={{ display: "inline-block", margin: "10px" }}>
              <a className="btn btn-text waves-effect waves-light modal-close" onClick={this.handelCancel}>{localize("Common.cancel", locale)}</a>
            </div>
            <div style={{ display: "inline-block", margin: "10px" }}>
              <a className="btn btn-outlined waves-effect waves-light modal-close" onClick={this.handleDeleteCrl}>{localize("Common.delete", locale)}</a>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }

  handelCancel = () => {
    const { onCancel } = this.props;

    if (onCancel) {
      onCancel();
    }
  }

  handleDeleteCrl = () => {
    const { crl, reloadCertificates } = this.props;
    const { localize, locale } = this.context;

    if (!crl) {
      return;
    }

    if (!window.PKISTORE.deleteCrl(crl)) {
      $(".toast-crl_delete_failed").remove();
      Materialize.toast(localize("CRL.crl_delete_failed", locale), 2000, "toast-crl_delete_failed");
      this.handelCancel();
      return;
    }

    reloadCertificates();

    $(".toast-crl_delete_ok").remove();
    Materialize.toast(localize("CRL.crl_delete_ok", locale), 2000, "toast-crl_delete_ok");
  }
}

export default CRLDelete;
