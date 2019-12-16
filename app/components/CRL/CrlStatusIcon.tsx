import React from "react";

interface ICrlStatusIconProps {
  crl: any;
}

class CrlStatusIcon extends React.Component<ICrlStatusIconProps, {}> {
  timerHandle: NodeJS.Timer | null;

  render() {
    const { crl } = this.props;

    let curStatusStyle;
    const status = this.checkCRL(crl);

    if (status) {
      curStatusStyle = "cert_status_ok";
    } else {
      curStatusStyle = "cert_status_error";
    }

    return (
      <div className={curStatusStyle} />
    );
  }

  checkCRL = (crl: any) => {
    const currentDate = new Date();

    if (((new Date(crl.nextUpdate)).getTime() >= currentDate.getTime()) &&
      ((new Date(crl.lastUpdate)).getTime() <= currentDate.getTime())) {
      return true;
    } else {
      //
    }

    return false;
  }
}

export default CrlStatusIcon;
