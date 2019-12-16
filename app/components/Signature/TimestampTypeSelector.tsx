import PropTypes from "prop-types";
import React from "react";
import ReactDOM from "react-dom";

interface ITimestampTypeSelectorProps {
  handleChange: (value: string) => void;
}

const StampType = {
  stContent: 1,
  stSignature: 2,
  // tslint:disable-next-line: object-literal-sort-keys
  stEscStamp: 4,
};

class TimestampTypeSelector extends React.Component<ITimestampTypeSelectorProps, {}> {
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
    $(ReactDOM.findDOMNode(this.refs.type_of_signature)).on("change", this.changeStampType);
  }

  changeStampType = (ev: any) => {
    this.props.handleChange(ev.target.value);
  }

  render() {
    const { localize, locale } = this.context;

    return (
      <div className="row nobottom col s12">
        <div className="input-field">
          <select
            className="select"
            id="type_of_signature"
            ref="type_of_signature"
            defaultValue={StampType.stContent.toString()}>
            <option value={StampType.stContent.toString()}>
              {localize("Cades.timestamp_on_data", locale)}
            </option>
            <option value={StampType.stSignature.toString()}>
              {localize("Cades.timestamp_on_sign", locale)}
            </option>
            <option value={StampType.stEscStamp.toString()}>
              {localize("Cades.timestamp_on_cades", locale)}
            </option>
          </select>
          <label>
            {localize("Cades.timestamp_type", locale)}
          </label>
        </div>
      </div>
    );
  }
}

export default TimestampTypeSelector;
