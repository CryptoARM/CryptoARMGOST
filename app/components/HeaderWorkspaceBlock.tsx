import React from "react";

interface IHeaderWorkspaceBlockProps {
  text: string;
  second_text?: string;
  onСlickBtn?: () => void;
  icon?: string;
  new_class?: string;
}

class HeaderWorkspaceBlock extends React.Component<IHeaderWorkspaceBlockProps, any> {
  getButtons() {
    const { icon, onСlickBtn } = this.props;

    if (icon && onСlickBtn) {
      return (<li className="right">
        <a onClick={onСlickBtn.bind(this)} style={{padding: "0px"}}>
          <i className="file-setting-item waves-effect material-icons secondary-content pulse active" style={{color: "white"}}>{icon}</i>
        </a>
      </li>);
    } else {
      return null;
    }
  }

  render() {
    const { text, second_text, new_class } = this.props;
    const name = new_class ? new_class : "";

    let element: any;
    if (second_text) {
      element = <div className="cert-title-main">
        <div className="collection-title cert-title">{text}</div>
        <div className="collection-info cert-title">{second_text}</div>
      </div>;
    } else {
      element = <span className="headline6">{text}</span>;
    }

    return (
      <nav className={"app-bar-content " + name}>
        <ul className="app-bar-items">
          <li className="app-bar-item">
            {element}
          </li>
          {this.getButtons()}
        </ul>
      </nav>
    );
  }
}

export default HeaderWorkspaceBlock;
