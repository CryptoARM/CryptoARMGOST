import React from "react";

interface IBlockWithReferenceProps {
  name: string;
  title: string;
  icon: string;
  reference: string;
  titleRef: string;
  onBtnClick: () => void;
}

class BlockWithReference extends React.Component<IBlockWithReferenceProps, {}> {
  render() {
    const { name, title, icon, onBtnClick, reference, titleRef } = this.props;

    return (
      <div className={"cert-item " + name}>
        <i className="material-icons large fullscreen">{icon}</i>
        <div className="headline6 add-file-item-text center-align">{title}</div>
        <a className="add-file-item-text btn btn-outlined waves-effect waves-light" onClick={onBtnClick}>{titleRef}</a>
      </div>
    );
  }
}

export default BlockWithReference;
