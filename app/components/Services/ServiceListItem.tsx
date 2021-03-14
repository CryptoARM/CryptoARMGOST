import { fileExists } from "../../utils";
import PropTypes from "prop-types";
import React from "react";
import { CA_SERVICE_LOCAL, REQUEST_STATUS } from "../../constants";

const shell = window.electron.shell;

interface IServiceListItemProps {
  deleteService?: (id: any) => void;
  handleOnMouseOver: () => void;
  chooseCert: () => void;
  isOpen: boolean;
  toggleOpen: () => void;
  regRequest: any;
  service: any;
  isHoveredServiceListItem?: boolean;
}

class ServiceListItem extends React.Component<IServiceListItemProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  render() {
    const { service, isOpen, regRequest } = this.props;

    let active = "";
    let status = "ca_service_status ";

    if (regRequest) {
      switch (regRequest.Status) {
        case REQUEST_STATUS.Q:
        case REQUEST_STATUS.P:
          status = status + "unknown";
          break;
        case REQUEST_STATUS.D:
        case REQUEST_STATUS.R:
        case REQUEST_STATUS.E:
          status = status + "error";
          break;
        case REQUEST_STATUS.A:
        case REQUEST_STATUS.C:
        case REQUEST_STATUS.K:
          status = status + "ok";
          break;
        default:
          status = status + "unknown";
      }
    } else {
      if (
        service.type === CA_SERVICE_LOCAL &&
        service.settings &&
        service.settings.template_file &&
        fileExists(service.settings.template_file)
      ) {
        status = status + "ok";
      } else {
        status = status + "unknown";
      }
    }

    if (isOpen) {
      active = "active";
    }

    return (
      <div
        className="row certificate-list-item"
        onMouseOver={() => this.props.handleOnMouseOver()}
      >
        <div
          className={"collection-item avatar certs-collection " + active}
          onClick={this.handleClick}
        >
          <div className="row nobottom valign-wrapper">
            <div className="col s1">
              <div className={status} />
            </div>
            {service.type === CA_SERVICE_LOCAL &&
            this.props.isHoveredServiceListItem ? (
              <div className="col s11">
                <div className="collection-title">{service.name}</div>
                <div className="collection-info ">{service.settings.url}</div>

                <div
                  className="col"
                  style={{ width: "40px" }}
                  onClick={(event) => {
                    event.stopPropagation();
                    shell.openItem(service.settings.template_file);
                  }}
                >
                  <i className="file-setting-item waves-effect material-icons secondary-content" style={{ right: "60px" }}>
                    edit
                  </i>
                </div>

                <div
                  className="col"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (this.props.deleteService) {
                      this.props.deleteService(service.id);
                    }
                  }}
                >
                  <i
                    className="file-setting-item waves-effect material-icons secondary-content"
                    style={{ width: "40px" }}
                  >
                    delete
                  </i>
                </div>
              </div>
            ) : (
              <div className="col s11">
                <div className="collection-title">{service.name}</div>
                <div className="collection-info ">{service.settings.url}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  handleClick = () => {
    const { chooseCert, toggleOpen } = this.props;

    chooseCert();
    toggleOpen();
  };
}
export default ServiceListItem;
