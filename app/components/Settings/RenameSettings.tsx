import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import {
  changeSettingsName,
} from "../../AC/settingsActions";

interface ICertificateDeleteState {
  name: string;
}

interface IRenameSettingsProps {
  changeSettingsName: (name: string) => void;
  onCancel?: () => void;
  currentName: string;
}

class RenameSettings extends React.Component<IRenameSettingsProps, ICertificateDeleteState> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  constructor(props: IRenameSettingsProps) {
    super(props);

    this.state = ({
      name: props.currentName,
    });
  }

  componentDidMount() {
    $(document).on("ready", function() {
      Materialize.updateTextFields();
    });

    try {
      Materialize.updateTextFields();
    } catch (e) {
      //
    }
  }

  componentWillUnmount() {
    this.handelCancel();
  }
  handleFocus = (event: any) => event.target.select();
  render() {
    const { localize, locale } = this.context;
    const { name } = this.state;

    let disabled = "";

    if (!name) {
      disabled = "disabled";
    }

    return (
      <React.Fragment>
        <div className="row">
          <div className="row halfbottom" />
          <div className="input-field col s12">
            <input
              id="name"
              type="text"
              onFocus={this.handleFocus}
              autofocus="true"
              className="validate"
              maxLength={100}
              name="name"
              value={name}
              placeholder={localize("Settings.save_placeholder", locale)}
              onChange={this.handleNameChange}
            />
            <label htmlFor="name">
              {localize("Settings.settings_name", locale)}
            </label>
          </div>
        </div>

        <div className="row halfbottom">
          <div style={{ float: "right" }}>
            <div style={{ display: "inline-block", margin: "10px" }}>
              <a className="btn btn-text waves-effect waves-light modal-close" onClick={this.handelCancel}>{localize("Common.cancel", locale)}</a>
            </div>
            <div style={{ display: "inline-block", margin: "10px" }}>
              <a className={`btn btn-outlined waves-effect waves-light ${disabled}`} onClick={this.handelSave}>{localize("Common.save", locale)}</a>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }

  handleNameChange = (ev: any) => {
    this.setState({ name: ev.target.value });
  }

  handelCancel = () => {
    const { onCancel } = this.props;

    if (onCancel) {
      onCancel();
    }
  }

  handelSave = () => {
    // tslint:disable-next-line: no-shadowed-variable
    const { changeSettingsName } = this.props;
    const { name } = this.state;

    changeSettingsName(name);

    this.handelCancel();
  }
}

export default connect((state) => {
  return {
  };
}, { changeSettingsName })(RenameSettings);
