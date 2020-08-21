#!/bin/sh
#Add directory for license
#mkdir "/etc/opt/Trusted"
mkdir -p "/etc/opt/Trusted/CryptoARM GOST"
chmod 777 "/etc/opt/Trusted/CryptoARM GOST"
# xdg-mime default cryptoarm-gost.desktop x-scheme-handler/cryptoarm
# xdg-mime default CryptoARM_GOST.desktop x-scheme-handler/cryptoarm

if dpkg -S /bin/ls >/dev/null 2>&1
then
  case "$(arch)" in
    x86_64)
      xdg-mime default CryptoARM_GOST.desktop x-scheme-handler/cryptoarm ;;
    i368)
      xdg-mime default CryptoARM_GOST.desktop x-scheme-handler/cryptoarm;;
    *)
      exit 1
      ;;
  esac
elif rpm -q -f /bin/ls >/dev/null 2>&1
then
  case "$(arch)" in
    x86_64)
     xdg-mime default cryptoarm-gost.desktop x-scheme-handler/cryptoarm ;;
    i368)
      xdg-mime default cryptoarm-gost.desktop x-scheme-handler/cryptoarm;;
    *)
      exit 1
      ;;
  esac
else
  exit 1
fi