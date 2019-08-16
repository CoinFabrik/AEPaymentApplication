# AEhub

## Description

AEHub

## Installation

```bash
$ npm install
```

```bash
# development

# 0.1 create accounts you'll use - we use 1234 as paassword for all (not configurable yet)
$ aecli account create hub
$ aecli account create merchant
$ aecli account create customer

#  0.2 transfer funds            (src)                      (dst)
tools$ AENODE=.. node tx.js <init or wallet_filename> <wallet_filename or address>  amount

will move amount from $src to $dst.
-init = is a shortcut to first account from forgae
-src wallet file shouold have 1234 as pwd.
-amount is expressed aettos


# 1. server:
# optional environment: EXTERNAL_IP for generated qr-code. if not, external ip address service will be used.
# you can point your app to: http://its_ip:3000/ to get qr required for the application (not req. for scripts below)

$ AENODE=node_ip_address npm run start


# 2. merchant:
tools$ HUB=127.0.0.1 ACCOUNT=merchant NODE=165.22.18.138 node merchtest3b.js  

# 3. customer:
tools$ HUB=127.0.0.1 ACCOUNT=customer NODE=165.22.18.138 node custtest3b.js [ continue ]




HUB : address of server 1.
ACCOUNT : filename of wallet used for this process
AENODE : AE nodo to connect to.
NODE : AE nodo to connect to.  (sorry we are changing this)

server uses hub by default


```
