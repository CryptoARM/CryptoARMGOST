import React from "react";

interface ICheckBoxWithLabelProps {
  disabled?: boolean;
  onClickCheckBox: (event: any) => void;
  isChecked: boolean;
  elementId: string;
  title: string;
}

class CheckBoxWithLabel extends React.Component<ICheckBoxWithLabelProps, any> {
  render() {
    const { disabled, isChecked, onClickCheckBox, elementId, title } = this.props;

    const classDisabled = disabled ? "disabled" : "";

    return <div className={`${classDisabled}`} >
      <input
        type="checkbox"
        id={elementId}
        className="filled-in"
        onChange={onClickCheckBox}
        disabled={disabled}
        defaultChecked={isChecked}
        checked={isChecked} />

      <label htmlFor={elementId}>{title}</label>
    </div>;
  }
}

export default CheckBoxWithLabel;
