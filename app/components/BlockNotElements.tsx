import React from "react";

interface IBlockNotElementsProps {
  name: string;
  title: string;
}

class BlockNotElements extends React.Component<IBlockNotElementsProps, {}> {
  render() {
    const { name, title } = this.props;
    return (
      <div className={"cert-item " + name}>
        <div className="headline6 add-file-item-text center-align">{title}</div>
        <i className="material-icons large fullscreen">block</i>
      </div>
    );
  }
}

export default BlockNotElements;
