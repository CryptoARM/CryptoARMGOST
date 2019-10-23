import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { USER_NAME } from "../../constants";
import logger from "../../winstonLogger";

interface ICertificateDeleteState {
  certificate: string;
  deleteCertificate: boolean;
}

interface IContainerDeleteProps {
  container: any;
  certificates: any[];
  onCancel?: () => void;
  reloadCertificates: () => void;
  reloadContainers: () => void;

}

class ContainerDelete extends React.Component<IContainerDeleteProps, ICertificateDeleteState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: IContainerDeleteProps) {
    super(props);

    this.state = ({
      certificate: "",
      deleteCertificate: false,
    });
  }

  componentDidMount() {
    const { container } = this.props;
    const { certificate } = this.state;

    this.setState({ certificate: container.certificateItem });
  }

  componentWillUnmount() {
    this.handelCancel();
  }

  render() {
    const { deleteCertificate } = this.state;
    const { localize, locale } = this.context;
    const { container, reloadContainers, certificates } = this.props;
    let body: any = " ";
    if (container.certificateItem !== null) {
      body = certificates.get(`CRYPTOPRO_MY_${container.certificateItem.hash}`) ?
        (
          <div className="input-field col s12">
            <input
              name="groupDelCont"
              type="checkbox"
              id="delCont"
              className="checkbox-red"
              checked={deleteCertificate}
              onClick={this.toggleDeleteCertificate}
            />
            <label htmlFor="delCont">{localize("Certificate.delete_certificate_and_container", locale)}</label>
          </div>
        ) :
        (
          <div className="input-field col s12"></div>
        );
    }

    return (
      <React.Fragment>
        <div className="row halftop">
          <div className="col s12">
            <div className="content-wrapper tbody border_group">
              <div className="col s12">
                <span className="card-infos sub">
                  {localize("Containers.realy_delete_container", locale)}
                </span>
              </div>
              {body}
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
              <a className="btn btn-outlined waves-effect waves-light modal-close" onClick={this.handleRemove}>{localize("Common.delete", locale)}</a>
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

  toggleDeleteCertificate = () => {
    this.setState({ deleteCertificate: !this.state.deleteCertificate });
  }

  handleRemove = () => {
    // tslint:disable-next-line:no-shadowed-variable
    const { container, reloadContainers, reloadCertificates, certificates } = this.props;
    const { localize, locale } = this.context;
    const { deleteCertificate } = this.state;

    if (!container) {
      return;
    }
    try {
      trusted.utils.Csp.deleteContainer(container.name, 75);

      $(".toast-container_delete_ok").remove();
      Materialize.toast(localize("Containers.container_delete_ok", locale), 2000, "toast-container_delete_ok");

      logger.log({
        certificate: "",
        level: "info",
        message: "",
        operation: "Удаление контейнера",
        operationObject: {
          in: container.name,
          out: "Null",
        },
        userName: USER_NAME,
      });

      reloadContainers();
    } catch (err) {
      $(".toast-container_delete_failed").remove();
      Materialize.toast(localize("Containers.container_delete_failed", locale), 2000, "toast-container_delete_failed");

      logger.log({
        certificate: "",
        level: "error",
        message: err.message ? err.message : err,
        operation: "Удаление контейнера",
        operationObject: {
          in: container,
          out: "Null",
        },
        userName: USER_NAME,
      });
    }
    if (deleteCertificate == true) {
      const certificate = certificates.get(`CRYPTOPRO_MY_${container.certificateItem.hash}`);
      if (!window.PKISTORE.deleteCertificate(certificate)) {
        $(".toast-cert_delete_failed").remove();
        Materialize.toast(localize("Certificate.cert_delete_failed", locale), 2000, "toast-cert_delete_failed");

        return;
      }
    }
  }
}

export default connect((state) => ({
  certificates: state.certificates.entities,
}))(ContainerDelete)
