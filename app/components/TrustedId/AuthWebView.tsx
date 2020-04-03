import PropTypes from "prop-types";
import React from "react";
import ProgressBars from "../ProgressBars";

interface IAuthWebViewProps {
  auth: string;
  onCancel: () => void;
  onTokenGet: (token: string) => void;
}

interface IAuthWebViewState {
  isLoading: boolean;
  url: string;
}

const str2ab = (str: string): ArrayBuffer => {
  const encoder = new TextEncoder();
  return encoder.encode(str);
};

const sha256 = async (str: string) => {
  const data = str2ab(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return hashBuffer;
};

const btoaRFC7636 = (buf: ArrayBuffer): string => {
  let binary = "";
  const bytes = new Uint8Array(buf);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

export const getCrypto = (): Crypto => {
  return window.crypto || window.msCrypto;
};

const randomString = (): string => {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let str = "";
  const randomValues = Array.from(
    getCrypto().getRandomValues(new Uint8Array(43)),
  );
  randomValues.forEach(v => (str += charset[v % charset.length]));
  return str;
};

const setCodeVerifier = (): string => {
  const codeVerifier = randomString();
  window.localStorage.setItem("codeVerifier", codeVerifier);
  return codeVerifier;
};

const getCode = (title: string) => {
  try {
    const url = new URL(title);
    return url.searchParams.get("code");
  } catch (error) {
    return null;
  }
};

const HOST = "https://cryptoarm";
const CLIENT_ID = "d8365da4fcde8132b7af5064e0668137";
export const SERVICE_URL = "https://id.trusted.plus";

class AuthWebView extends React.PureComponent<IAuthWebViewProps, IAuthWebViewState> {
  constructor(props: IAuthWebViewProps) {
    super(props);
    this.state = {
      isLoading: false,
      url: "",
    };
  }

  async componentWillMount() {
    const codeVerifier = setCodeVerifier();
    const codeVerifierBase64 = btoaRFC7636(str2ab(codeVerifier));
    const codeChallenge = btoaRFC7636(await sha256(codeVerifierBase64));

    this.setState({
      isLoading: false,
      // tslint:disable-next-line:max-line-length
      url:
        SERVICE_URL +
        "/idp/sso/oauth" +
        "?client_id=" +
        CLIENT_ID +
        "&redirect_uri=" +
        encodeURIComponent(HOST + "/code") +
        "&scope=" +
        "userprofile" +
        "&code_challenge=" +
        codeChallenge +
        "&code_challenge_method=" +
        "S256",
    });
  }

  componentDidMount() {
    const webview = document.getElementById("webview");

    if (webview) {
      webview.addEventListener("did-start-loading", this.loadStart);
      webview.addEventListener("did-stop-loading", this.loadStop);
      webview.addEventListener("did-get-redirect-request", (details) => this.redirect(details));
    }
  }

  render() {
    const { isLoading, url } = this.state;

    return (
      <React.Fragment>
        {
          isLoading ? <ProgressBars /> : null
        }
        <webview id="webview" src={this.state.url} style={{ height: "400px" }}></webview>

      </React.Fragment>
    );
  }

  loadStart = () => {
    this.setState({ isLoading: true });
  }

  loadStop = () => {
    const webview = document.getElementById("webview");

    if (webview) {
      const code = getCode(webview.getTitle());
    }

    this.setState({ isLoading: false });
  }

  redirect = (details) => {
    const regex = /urn:ietf:wg:oauth:2\.0:oob:auto\?access_token=([^&]*)/;
    const mathes = regex.exec(details.newURL);
    if (mathes) {
      const token = mathes[1];

      if (token && token.length) {
        this.props.onTokenGet(token);
      }

      this.props.onCancel();
    }
  }
}

export default AuthWebView;
