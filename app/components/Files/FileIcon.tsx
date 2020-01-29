import React from "react";
import { connect } from "react-redux";
import { verifySignature } from "../../AC";
import { mapToArr } from "../../utils";

interface IFileRedux {
  active: boolean;
  extension: string;
  filename: string;
  fullpath: string;
  id: number;
  mtime: Date;
  socket: string;
}

interface IFileIconProps {
  file: IFileRedux;
  verifySignature: (id: number, showOpenDialogForDetached?: boolean) => void;
}

class FileIcon extends React.Component<IFileIconProps, {}> {
  timerHandle: NodeJS.Timer | null;

  componentDidMount() {
    const { file } = this.props;

    this.timerHandle = setTimeout(() => {
      if (file.extension === "sig") {
        const signs = this.props.signatures.getIn(["entities", file.id]);

        if (!signs) {
          this.props.verifySignature(file.id, false);
        }
      }

      this.timerHandle = null;
    }, 2000);
  }

  componentDidUpdate() {
    const { file } = this.props;

    if (this.timerHandle) {
      return;
    }

    this.timerHandle = setTimeout(() => {
      if (file.extension === "sig") {
        const signs = this.props.signatures.getIn(["entities", file.id]);

        if (!signs) {
          this.props.verifySignature(file.id, false);
        }
      }

      this.timerHandle = null;
    }, 2000);
  }

  componentWillUnmount() {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
  }

  render() {
    const { file } = this.props;

    return (
      <div>
        <i className={this.getFileIconByExtname(file.extension, file.id) + " icon_file_type"} style={this.props.style} />
      </div>
    );
  }

  getFileIconByExtname = (extension: string, id: any) => {
    if (extension === "sig") {
      let res = true;

      const signs = this.props.signatures.getIn(["entities", id]);

      if (signs) {
        const arrSigns = mapToArr(signs);

        for (const element of arrSigns) {
          if (!element.status_verify) {
            res = false;
            break;
          }
        }

        return res ? "type_icon sig ok" : "type_icon sig error";
      } else {
        return "type_icon sig any";
      }
    } else {
      return `type_icon ${extension}`;
    }
  }
}

export default connect((state) => {
  return {
    signatures: state.signatures,
  };
}, { verifySignature })(FileIcon);
