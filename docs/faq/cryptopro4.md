---
slug: "/post8"
title: "КриптоАРМ ГОСТ 2 и выше на unix системах не работает с КриптоПро 4"
sort: "08"
--- 

Признак - нет никаких сертификатов на вкладке **Сертификаты**.

Для решения проблемы надо:

1. Доустановить пакет КриптоПро cprocsp-rsa.

2. MacOS: скачать скрипт https://drive.google.com/file/d/11Ts3wshs0-Fy7mc5NACKEb1x7fEu9oAy/view?usp=sharing,
в терминале ввести команду chmod u+x <путь к скрипту>/script.sh

sudo ./script.sh

Linux: скачать скрипт (https://drive.google.com/file/d/11Ts3wshs0-Fy7mc5NACKEb1x7fEu9oAy/view?usp=sharing),
в терминале ввести команду chmod u+x <путь к скрипту>/script.sh
sudo bash ./script.sh

Или:

2. В конфигурационном файле КриптоПро (/etc/opt/cprocsp/config.ini) от администратора добавить блоки:

-   **Для Linux:**

    (этот после блока [Defaults\\Provider\\"Crypto-Pro RSA CSP"])

    [Defaults\\Provider\\"Crypto-Pro Enhanced RSA and AES CSP"]

    "Image Path" = "/opt/cprocsp/lib/amd64/librsaenh.so"

    "Function Table Name" = "CPRSA_GetFunctionTable"

    Type = 24

    (Этот после блока [Defaults\\"Provider Types"\\"Type 001"])

    [Defaults\\"Provider Types"\\"Type 024"]

    Name = "Crypto-Pro Enhanced RSA and AES CSP"

    TypeName = "RSA Full and AES"

-   **Для MacOS:**

    (этот после блока [Defaults\\Provider\\"Crypto-Pro RSA CSP"])

    [Defaults\\Provider\\"Crypto-Pro RSA CSP and AES CSP"]

    "Image Path" = "/opt/cprocsp/lib/librsaenh.dylib"

    "Function Table Name" = "CPRSA_GetFunctionTable"

    type = 24

    (Этот после блока [Defaults\\"Provider Types"\\"Type 001"])

    [Defaults\\"Provider Types"\\"Type 024"]

    Name = "Crypto-Pro RSA CSP and AES CSP"

    TypeName = "RSA Full (Signature and Key Exchange)"

    Для редактирования конфигурационного файла можно запросить скрипт в
    технической поддержке.
