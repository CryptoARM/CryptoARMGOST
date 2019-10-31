import PropTypes from "prop-types";
import React from "react";

interface IFileRemote {
  extra: any;
  id: number;
  loaded: boolean;
  loading: boolean;
  name: string;
  socketId: string;
  totalSize: number;
  url: string;
}

interface IRemoteFileListItemProps {
  file: IFileRedux;
  operation: string;
  onClickBtn: (event: any) => void;
  removeFiles: (event: any) => void;
  index: string;
}

class RemoteFileListItem extends React.Component<IRemoteFileListItemProps, {}> {
  static contextTypes = {
    locale: PropTypes.string,
    localize: PropTypes.func,
  };

  componentDidMount() {
    $(".file-setting-item").dropdown({
      inDuration: 300,
      outDuration: 225,
      constrain_width: false,
      gutter: 0,
      belowOrigin: false,
      alignment: "left",
    },
    );
  }

  shouldComponentUpdate(nextProps: IRemoteFileListItemProps) {
    return nextProps.file.active !== this.props.file.active || nextProps.file.id !== this.props.file.id;
  }

  stopEvent(event: any) {
    event.stopPropagation();
  }

  render() {
    const { file, style } = this.props;

    if ( !file.loading ) {
      return null;
    }

    return (
      <div style={style}>
        <div className={"collection-item files-collection active"} id={"file-" + this.props.index} onClick={this.props.onClickBtn}>
          <div className="row nobottom">
            <div className="col s2">
              <div className="preloader-wrapper small active">
                <div className="spinner-layer spinner-blue-only">
                  <div className="circle-clipper left">
                    <div className="circle"></div>
                  </div>
                  <div className="gap-patch">
                    <div className="circle" />
                  </div>
                  <div className="circle-clipper right">
                    <div className="circle" />
                  </div>
                </div>
              </div>
            </div>
            <div className="collection-title">{file.name}</div>
            <div className="collection-info">{file.totalSize + " байт"}</div>
          </div>
        </div>
      </div>
    );
  }
}

export default RemoteFileListItem;
