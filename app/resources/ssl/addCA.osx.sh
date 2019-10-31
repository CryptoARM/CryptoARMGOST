#!/bin/sh
#Add directory for license
mkdir "/etc/opt/Trusted"
mkdir "/etc/opt/Trusted/CryptoARM GOST"
chmod 777 "/etc/opt/Trusted/CryptoARM GOST"

#FILE="/opt/cryptoarm_gost/ssl/log.txt"
#echo "Start: `date`" > $FILE
#echo "" >> $FILE

# Add certificate to system key chain
CUR_DIR="/opt/cryptoarm_gost/ssl"
certPath=${CUR_DIR}/root.pem
certificateName="CryptoARM Local CA"

chmod 777 ${CUR_DIR}/certutil/osx/certutil

echo -e "certificateName: ${certificateName}"
echo -e "certPath: ${certPath}"
#echo "certificateName: ${certificateName}" >> $FILE
#echo "certPath: ${certPath}" >> $FILE

# Firefox
#firefoxProfileDir=${HOME}/Library/Application\ Support/Firefox/Profiles
firefoxProfileDir=/Users/$(ls -l /dev/console | awk '/ / { print $3 }')/Library/Application\ Support/Firefox/Profiles
firefoxProfiles=$( find "$firefoxProfileDir" -name "*.default*" )
firefoxDefaultProfile="${firefoxProfiles[0]}"

if [ ! -z "${firefoxDefaultProfile}" ]
then
    echo "Firefox was found"
    echo -e "Delete old cert"
    #echo "Firefox was found" >> $FILE
    #echo -e "Delete old cert" >> $FILE
    # Delete old cert
    # /usr/local/Cellar/nss/3.31/bin/certutil -D -n "${certificateName}" -d "${firefoxDefaultProfile}"
    until ! ${CUR_DIR}/certutil/osx/certutil -D -n "CryptoARM Local CA" -d sql:"${firefoxDefaultProfile}"
    do
        echo "CryptoARM certificate was removed from sql:cert.db"
        #echo "CryptoARM certificate was removed from sql:cert.db" >> $FILE
    done
    until ! ${CUR_DIR}/certutil/osx/certutil -D -n "CryptoARM Local CA" -d dbm:"${firefoxDefaultProfile}"
    do
        echo "CryptoARM certificate was removed from dbm:cert.db"
        #echo "CryptoARM certificate was removed from dbm:cert.db" >> $FILE

    done
    ${CUR_DIR}/certutil/osx/certutil -A -i "${certPath}" -n "${certificateName}" -t "C,c,c" -d sql:"${firefoxDefaultProfile}"
    ${CUR_DIR}/certutil/osx/certutil -A -i "${certPath}" -n "${certificateName}" -t "C,c,c" -d dbm:"${firefoxDefaultProfile}"
    ${CUR_DIR}/certutil/osx/certutil -L -d sql:"${firefoxDefaultProfile}"
    ${CUR_DIR}/certutil/osx/certutil -L -d dbm:"${firefoxDefaultProfile}"

    sudo -u ${USER} bash ${CUR_DIR}/osx_firefox.sh
fi

# keychain
sudo security delete-certificate -c ${certificateName} /Library/Keychains/System.keychain
echo "sudo security delete-certificate -c ${certificateName} /Library/Keychains/System.keychain"
#echo "delete-certificate worked success" >> $FILE
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ${certPath}
echo "sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ${certPath}"
#echo "add-trusted-cert worked success" >> $FILE

#echo "" >> $FILE
#echo "End: `date`" >> $FILE
