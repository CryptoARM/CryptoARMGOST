import React from "react";
import { connect } from "react-redux";
import { verifyCertificate } from "../AC";
import { CRYPTOPRO_DSS } from "../constants";

const rectangleValidStyle = {
  background: "#4caf50",
};

const rectangleUnvalidStyle = {
  background: "#bf3817",
};

interface IRecipientsListProps {
  disabled: boolean;
  recipients: any[];
  onActive?: (recipient: any) => void;
  handleRemoveRecipient: (recipient: any) => void;
}

class RecipientsList extends React.Component<IRecipientsListProps, any> {
  constructor(props: IRecipientsListProps) {
    super(props);

    this.state = {
      hoveredRowIndex: -1,
    };
  }

  render() {
    const { disabled, recipients, verifyCertificate } = this.props;

    if (!recipients || !recipients.length) {
      return null;
    }

    const disabledCN = disabled ? "disabled" : "";

    return (
      <div className={"choose-certs-view " + disabledCN}>
        <div className={"add-cert-collection collection "}>
          {recipients.map((recipient) => {
            let curStatusStyle;
            let curKeyStyle;
            let rectangleStyle;

            if (recipient && !recipient.verified) {
              verifyCertificate(recipient.id);
            }

            if (recipient.status) {
              curStatusStyle = recipient.dssUserID ? "cloud_cert_status_ok" : "cert_status_ok";
              rectangleStyle = rectangleValidStyle;
            } else {
              curStatusStyle = recipient.dssUserID  ? "cloud_cert_status_error" : "cert_status_error";
              rectangleStyle = rectangleUnvalidStyle;
            }

            if (recipient.key.length > 0) {
              curKeyStyle = "key ";

              if (curKeyStyle) {
                if (recipient.dssUserID) {
                  curKeyStyle += "dsskey";
                } else {
                  curKeyStyle += "localkey";
                }
              }
            } else {
              curKeyStyle = "";
            }

            return <div key={recipient.id} className="row certificate-list-item" id={recipient.id}
              onMouseOver={() => this.handleOnRowMouseOver(recipient)}>
              <div className="collection-item avatar certs-collection "
                onClick={() => this.handleClick(recipient)}>
                <React.Fragment>
                  <div className="col s12">
                    <div className="col s2">
                      <div className={curStatusStyle} />
                    </div>
                    {
                      this.state.hoveredRowIndex === recipient.id ?
                        <div className="col s8">
                          <div className="collection-title">{recipient.subjectFriendlyName}</div>
                          <div className="collection-info">{recipient.issuerFriendlyName}</div>

                          <div className="col" style={{ width: "40px" }} onClick={(event) => {
                            event.stopPropagation();
                            this.removeRecipient(recipient);
                          }}>
                            <i className="file-setting-item waves-effect material-icons secondary-content">delete</i>
                          </div>
                        </div> :
                        <div className="col s10">
                          <div className="collection-title">{recipient.subjectFriendlyName}</div>
                          <div className="collection-info">{recipient.issuerFriendlyName}</div>
                        </div>
                    }
                  </div>
                </React.Fragment>
              </div>
            </div>;
          })}
        </div>
      </div>
    );
  }

  handleClick = (element: any) => {
    const { onActive } = this.props;

    if (onActive) {
      onActive(element);
    }
  }

  removeRecipient = (recipient: any) => {
    const { handleRemoveRecipient } = this.props;

    handleRemoveRecipient(recipient);
  }

  handleOnRowMouseOver = (recipient: any) => {
    if (this.state.hoveredRowIndex !== recipient.id) {
      this.setState({
        hoveredRowIndex: recipient.id,
      });
    }
  }
}

export default connect((state) => {
  return {};
}, { verifyCertificate })(RecipientsList);
