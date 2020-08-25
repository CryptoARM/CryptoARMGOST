import PropTypes from "prop-types";
import React from "react";
import ReactDOM from "react-dom";

interface IEncodingTypeSelectorProps {
  EncodingValue: string;
  disabled?: boolean;
  handleChange: (encoding: string) => void;
}

class EncodingTypeSelector extends React.Component<IEncodingTypeSelectorProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  /**
   * https://github.com/facebook/react/issues/3667
   */
  componentDidMount() {
    $(document).ready(() => {
      $("select").material_select();
    });
    $(ReactDOM.findDOMNode(this.refs.encoding)).on("change", this.changeEncoding);
  }

  changeEncoding = (ev: any) => {
    this.props.handleChange(ev.target.value);
  }

  render() {
    const { localize, locale } = this.context;
    const classDisabled = this.props.disabled ? "disabled" : "";

    return (
      <div className={classDisabled}>
        <div className="input-field">
          <select className="select" id="encoding" ref="encoding" defaultValue={localize("Settings.DER", locale)}>
            <option value={localize("Settings.DER", locale)}>
              {localize("Settings.DER", locale)}
            </option>
            <option value={localize("Settings.BASE", locale)}>
              {localize("Settings.BASE", locale)}
            </option>
          </select>
          <label>
            {localize("Settings.encoding", locale)}
          </label>
        </div>
      </div>
    );
  }
}

export default EncodingTypeSelector;
