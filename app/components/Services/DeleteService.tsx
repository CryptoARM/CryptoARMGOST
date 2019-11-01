import PropTypes from "prop-types";
import React from "react";
import { USER_NAME } from "../../constants";
import logger from "../../winstonLogger";

interface IDeleteServiceProps {
  deleteService: (id: string) => void;
  service: any;
  onCancel?: () => void;
}

class DeleteService extends React.Component<IDeleteServiceProps, {}> {
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
                  {localize("Services.realy_delete_service", locale)}
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
              <a className="btn btn-outlined waves-effect waves-light modal-close" onClick={this.handleDelete}>{localize("Common.delete", locale)}</a>
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

  handleDelete = () => {
    const { deleteService, service } = this.props;
    const { localize, locale } = this.context;

    if (!service) {
      return;
    }

    deleteService(service.id);
    logger.log({
      level: "info",
      message: "",
      operation: "Сервис успешно удален",
      operationObject: {
        in: "service id =" + service.id,
        out: "Null",
      },
      userName: USER_NAME,
    });
    $(".toast-delete_service_ok").remove();
    Materialize.toast(localize("Services.delete_service_ok", locale), 2000, "toast-delete_service_ok");

    this.handelCancel();
  }
}

export default DeleteService;
