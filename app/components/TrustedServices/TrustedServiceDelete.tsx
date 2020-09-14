import PropTypes from "prop-types";
import React from "react";

interface ITrustedServiceDeleteProps {
  deleteTrustedService: (url: string) => void;
  service: any;
  onCancel?: () => void;
}

class TrustedServiceDelete extends React.Component<ITrustedServiceDeleteProps, {}> {
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
                  Вы действительно хотите удалить сервис из списка доверенных?
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
              <a className="btn btn-outlined waves-effect waves-light modal-close" onClick={this.handleDeleteService}>{localize("Common.delete", locale)}</a>
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

  handleDeleteService = () => {
    const { service, deleteTrustedService } = this.props;
    const { localize, locale } = this.context;

    if (!service) {
      return;
    }

    deleteTrustedService(service.url);

    this.handelCancel();

    $(".toast-service_delete_ok").remove();
    Materialize.toast("Сервис удалён из списка", 2000, "toast-service_delete_ok");
  }
}

export default TrustedServiceDelete;
