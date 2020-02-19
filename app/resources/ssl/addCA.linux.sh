#!/bin/sh
#Add directory for license
mkdir "/etc/opt/Trusted"
mkdir "/etc/opt/Trusted/CryptoARM ViPNet"
chmod 777 "/etc/opt/Trusted/CryptoARM ViPNet"

CUR_DIR=`dirname $0`
certPath=${CUR_DIR}/root.pem
certificateName="CryptoARM Local CA"

echo -e "certificateName: ${certificateName}"
echo -e "certPath: ${certPath}"

# Firefox
PROGRAM_NAME=firefox
PROGRAM_PATH=$(which "$PROGRAM_NAME")

BROWSER_PATH=""

while true; do
	if [ -L "$PROGRAM_PATH" ] ;then
		PROGRAM_PATH=$(readlink -f "$PROGRAM_PATH")
	else
		if [ -d "$PROGRAM_PATH" ] ;then
			BROWSER_PATH="$PROGRAM_PATH"
			break
		else
			BROWSER_PATH=$(dirname "$PROGRAM_PATH")
			break
		fi
	fi
done

if [ -n "$BROWSER_PATH" ] ;then
	if [ -d "$BROWSER_PATH/browser" ] ;then
		echo "$BROWSER_PATH"
	else
		BROWSER_PATH=""
	fi
fi

if [ -z "$BROWSER_PATH" ] ;then
	if [ -d "/usr/lib/$PROGRAM_NAME/browser" ] ;then
		BROWSER_PATH="/usr/lib/$PROGRAM_NAME"
		echo "/usr/lib/$PROGRAM_NAME"
	fi
	if [ -d "/usr/lib64/$PROGRAM_NAME/browser" ] ;then
		BROWSER_PATH="/usr/lib64/$PROGRAM_NAME"
		echo "/usr/lib64/$PROGRAM_NAME"
	fi
fi

if [ -n "$BROWSER_PATH" ] ;then
	echo "Firefox was found"

	cp $CUR_DIR/firefox/cryptoarm-firefox-preferences.cfg "$BROWSER_PATH/"
	if [ -d "$BROWSER_PATH/defaults/pref" ] ;then
		cp $CUR_DIR/firefox/cryptoarm-firefox-preferences.js "$BROWSER_PATH/defaults/pref/"
	else
		if [ -d "$BROWSER_PATH/defaults/preferences" ] ;then
			cp $CUR_DIR/firefox/cryptoarm-firefox-preferences.js "$BROWSER_PATH/defaults/preferences/"
		fi
	fi
else
	echo "Firfeox cannot be found. $certificateName certificate not installed"
fi
