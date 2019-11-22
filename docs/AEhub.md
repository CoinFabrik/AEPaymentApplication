# AEhub

[TOC]

## Description

This is a payment hub demo implementation over AEternity State Channels. This hub provides a centralized version of what would be a Virtual State Channel, allowing for micro-payments.
 
This application is complemented with the Customer and Merchant apps to be run inside AEternity Base-Aepp.

This server will connect to Merchants and Customers apps through State-channels, enabling them communicate payment-creation and execution, keeping track of balances and purchases while also tracking State-channel state allowing clients safe reconnection. 

The AEternity Base-Aepp architecture requires all content be delivered through SSL/TLS connections. It is because of this that we require sometimes wrapping connections with a reverse proxy configured to use SSL/TLS certificates and that we provide some custom-url configuration. 


## Scope

- **Hub-Server**
    1. Accepts connections from Merchants and Customers
    2. Keeps track of channels state providing fast reconnection
    3. Performs payment requests validation and tracking

- **Merchant App component for Base-Aepp**
    1. Connected to Base-Aepp wallet.
    2. Open a state channel against the _Hub Server_.
    3. Request payments, specifying amounts and item description and showing a QR code that should be scanned by the customer.
    4. Get notified when the customer confirms the payment.
    5. Check last payments.
    6. Close the state channel, so that the collected funds go to the wallet.

- **Customer App component for Base-Aepp**
    1. Connected to Base-Aepp wallet.
    2. Open a state channel against the _Hub Server_, setting an initial deposit.
    3. Scan payment requests (QR codes), which are confirmed or rejected.
    4. Check last payments.
    5. Close the state channel, so that the remaining funds go to the wallet.


### Out of Scope

 * Offline payments
 * Clearance
 * Channel solo close disputes

## Endpoints

 * functional
     * `/clear`: display merchants balances
     * `/solo`: will solo-close all open channels
     * `/leaveall`: will disconnect all open channels
 * informative
     * `/`: will show onboarding QR
     * `/all_merchants`: will display all created merchants
     * `/all_customers`: will display all created customers
     * `/merchants`: will display all connected merchants
     * `/clients`: will display all connected customers
 * products (testing functionality)
     * `/products`: will display web-defined available products QR-codes
     * `/products/new`: prompt to allow users to create a new product QR, requires:
        * unique_id: which is informational 
        * product-code: `{"something":"", "amount":"10000000000000000", "merchant":"ak_25VJ5qBunt1D5jCs2rxHciRjuPAUqRRsjzQt9ey7zK4Yw4Vs1h","type":"payment-request"}` :
            * amount: in _aettos_
            * something: product/s description
            * merchant: must be the merchant's to register this product to.



## Setup

To run a hub you must have a wallet file this server can use.

These are the required parameters in order to run this hub. Some of these parameters are only used to provide better usability in the final-user (merchant-customer) app.

 * `AENODE`: the aeternity node the hub will use for its interaction with then block-chain.
 * `NET`: the name of the blockchain available at the given node.
 * `MIN_DEPTH`: amount of blocks to wait for channel confirmation (default: 3). A lower value will provide faster SC creation
 * `USER_NODE`: this parameter will be used to let the clients know which "node" should they connect to. (*) 
   * The format of this parameter is: `s://anode.server`
   * Where the `s` indicates the communication must be made with ssl/tls protocol. 
   * And anode.server should be the domain name and path where the node listens. 
   * Again, to use this from the base-aepp we recommend use a server having enabled SSL/TLS. 
 * `QR_HUB_URL`: this must be the full url (protocol included) that will be used by clients to connect to this hub. (Again, we recommend this to be pointed to your reverse-proxy having SSL/TLS certificates for it).


This is where your reverse-proxy will connect to: 
 * `PORT`: the port where this hub will listen. default port is: `3000`. 
 * `HOST`: host-ip to listen in. default: `0.0.0.0`. You can use `127.0.0.1` or another internal address, provided your
        proxy be still able to reach the hub. 

Also, you will need an Ae-CLI (command line): 

    * git clone https://github.com/aeternity/aepp-cli-js.git
    * cd aepp-cli-js
    * npm link 
    
 Or you could follow the tutorial at: http://aeternity.com/documentation-hub/tutorials/account-creation-in-ae-cli/
 
(*) Custom clients may ignore this setting and use whichever node they want. But by using this parameter you can avoid one point of failure in configuration. 


### A real-world sample configuration

This is a real-life configuration example. 

First clone the repository from: https://gitlab.com/coinfabrik.com/aehu://github.com/CoinFabrik/AEPaymentApplication

 1. Create an account for the server (it search for file named hub). Hub will try to use empty or "1234" password to open the created wallet file:

```bash
$ aecli account create hub

✔ Enter your password … ****
Address_________________________________ ak_k65RLRPH8KbexMw5c2efG8wK2X8yKL6VzYimAJMh3Eai36W5q
Path____________________________________ ../hub
```

 2. Transfer a few AEs to the created address, in this case: `ak_k65RLRPH8KbexMw5c2efG8wK2X8yKL6VzYimAJMh3Eai36W5q`.


## scripts

### common setup

Create accounts and fund them:

```bash
# development

# 0.1 create accounts you'll use - we use 1234 as paassword for all (not configurable yet)
$ aecli account create merchant
$ aecli account create customer

#  0.2 transfer funds            (src)                      (dst)
tools$ AENODE=.. node tx.js <init or wallet_filename> <wallet_filename or address>  amount
(*)

will move amount from $src to $dst.
-init = is a shortcut to first account from forgae
-src wallet file should have 1234 as pwd.
-amount is expressed aettos
```

(*) In case you do not want to transfer funds through command line, you could always send them using the base application copying the addresses recently created.

### Merchant

* Merchant execution

This will simply launch a client which will connect as a merchant and stay connected. It will periodically hub for balance changes and will display them.

``` bash
~/aehub/tools$ HUB=127.0.0.1 HUBPORT=5000 ACCOUNT=../merchant NODE=https://aehub.coinfabrik.com NET=ae_uat node merchant.js

```
This may take up to five minutes, so after connection.. when a purchase is executed you'll see:

``` bash
Balance: 3000000000000022
{"id":"df96ddbb-ad17-4415-9ce0-da85d018199c", 
 "merchant":  "ak_w38qanGDGxaWXAu5j5Jd5j1cb2Q5hzF8awWFKJZbaxJerupYJ",
 "merchant_name" : "dave's beer", 
 "customer":  "ak_XrC9LqQ4jMj96NFkvJ1CgdSpsJTQ1MuYNB2MiavtmURYHwPd4", 
 "amount" : "1" , 
 "something": [{"what":"beer","amount":"1"}], 
 "customer_name": "1572472960943", 
 "type": "payment-request-completed"}
Balance: 3000000000000023
```

### Customer

* Customer purchase

This connects the given wallet as a customer role, perform a purchase and exit.

``` bash
~/aehub/tools$ HUB=127.0.0.1 HUBPORT=5000 ACCOUNT=../customer NODE=https://aehub.coinfabrik.com NET=ae_uat node customer_purchase.js  
```

Just like with the merchant instruction, this may take up to five minutes, so after connection settings you'll see something like:

``` bash
[CONNECTED]
[OPEN]
{"id":"df96ddbb-ad17-4415-9ce0-da85d018199c",
 "merchant":"ak_w38qanGDGxaWXAu5j5Jd5j1cb2Q5hzF8awWFKJZbaxJerupYJ",
 "merchant_name":"dave's beer",  "customer":"ak_XrC9LqQ4jMj96NFkvJ1CgdSpsJTQ1MuYNB2MiavtmURYHwPd4",
 "amount":"1",
 "something":[{"what":"beer","amount":"1"}],
 "type":"payment-request-accepted"}
sending payment..
payment sent!
{"id":"df96ddbb-ad17-4415-9ce0-da85d018199c",
  "merchant":"ak_w38qanGDGxaWXAu5j5Jd5j1cb2Q5hzF8awWFKJZbaxJerupYJ",
 "merchant_name":"dave's beer",  "customer":"ak_XrC9LqQ4jMj96NFkvJ1CgdSpsJTQ1MuYNB2MiavtmURYHwPd4",
 "amount":"1",
 "something":[{"what":"beer","amount":"1"}],
 "customer_name":"1572472960943",
 "type":"payment-request-completed"}
payment completed!
exit..
[DIED]
[DISCONNECTED]
```
#### Advice

In case you need to shut your computer down, it is a good practice to first disconnect from the channel by pressing "ctrl-c". This way the server side will keep the last state of the merchant channel and consequently, once we try to connect again we will not loose our state and also we will not have to wait the same amount of time as the first one. 

#### Host Setup
 
We have one host serving:

 * aeternity node
 * merchant and customer client-side apps (requires one subdomain each)
 * hub providing micro-payment service (requires one domain along with node)
 
#### Hub configuration

Domain will be `aehub.coinfabrik.com` and via https we will access aeternity node:  
 * `AENODE=https://aehub.coinfabrik.com` .
Also for its clients we want they to use this node and access it in a secure form so:
 * `USER_NODE=s://aehub.coinfabrik.com` 
In this case we used the same node for the clients than for the hub itself, but they could be different. And easily, in 
future version, the node could be selected from a node-pool. 

We will configure reverse-proxy to access hub at localhost:5000 and make it accessible through SSL/TLS at: 
https://aehub.coinfabrik.com:3000, so: 
`QR_HUB_URL=https://aehub.coinfabrik.com:3000` 
 
Final parameters are: 
`NET=ae_uat`: because we made our node connect to testnet. 
`MIN_DEPTH=1`: because we considered 1 block confirmation to be enough.


Complete command line is:
`AENODE=https://aehub.coinfabrik.com NET=ae_uat MIN_DEPTH=1 USER_NODE=s://aehub.coinfabrik.com QR_HUB_URL=https://aehub.coinfabrik.com:3000 PORT=5000 npm run start`

#### Reverse-Proxy configuration

##### Node

Create file: `/etc/nginx/sites-enabled/aenode` and verify which ports your node uses for regular connections (here `3013`) and which one and url for State-Channel websockets (in this case `3014` and `/channel`):
```nginx
server {
   root /var/www/html;
   index index.html index.htm index.nginx-debian.html;
   server_name aehub.coinfabrik.com; # managed by Certbot

   location /channel {
      proxy_pass http://localhost:3014/channel;
      proxy_redirect off;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "Upgrade";
   }
   location / {
      proxy_pass http://localhost:3013;
      proxy_redirect off;
   }
   listen [::]:443 ssl ipv6only=on; # managed by Certbot
   listen 443 ssl; # managed by Certbot
   ssl_certificate /etc/letsencrypt/live/aehub.coinfabrik.com/fullchain.pem; # managed by Certbot
   ssl_certificate_key /etc/letsencrypt/live/aehub.coinfabrik.com/privkey.pem; # managed by Certbot
   include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
   ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
```

##### Hub

Create file: `/etc/nginx/sites-enabled/aehub` and make it point to hub listening address and port:
```nginx
server {
   root /home/coinfabrik/www-root;
   index index.html
   server_name aehub.coinfabrik.com;

   location / {
     proxy_pass http://127.0.0.1:5000;
     proxy_redirect off; 
     
     if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
     }
     
     if ($request_method = 'POST') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';
     }
     
     if ($request_method = 'GET') { 
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';
     }
   }

   listen 3000 ssl; # managed by Certbot
   ssl_certificate /etc/letsencrypt/live/aehub.coinfabrik.com/fullchain.pem; # managed by Certbot
   ssl_certificate_key /etc/letsencrypt/live/aehub.coinfabrik.com/privkey.pem; # managed by Certbot
   include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
   ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
```


##### Merchant and Customer Apps
 
After building client applications and making the output available at:
 * /home/coinfabrik/apps/client/dist-customer
 * /home/coinfabrik/apps/client/dist-merchant
 
We instruct nginx to serve these files with the files: `/etc/nginx/sites-enabled/customer-app`:
```nginx
server {
        listen 80;
        listen [::]:80;
        root /home/coinfabrik/apps/client/dist-customer;
        index index.html index.htm index.nginx-debian.html;
        server_name c.pay.coinfabrik.com;
        location / {
                try_files $uri $uri/ =404;
        }
        listen [::]:443 ssl; # managed by Certbot
        listen 443 ssl; # managed by Certbot
        ssl_certificate /etc/letsencrypt/live/m.pay.coinfabrik.com/fullchain.pem; # managed by Certbot
        ssl_certificate_key /etc/letsencrypt/live/m.pay.coinfabrik.com/privkey.pem; # managed by Certbot
        include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
        ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
```

and: `/etc/nginx/sites-enabled/merchant-app`:

```nginx
# Default server configuration
server {
        listen 80;
        listen [::]:80;
        root /home/coinfabrik/apps/client/dist-merchant;
        index index.html index.htm index.nginx-debian.html;
        server_name m.pay.coinfabrik.com;
        location / {
                try_files $uri $uri/ =404;
        }
        listen [::]:443 ssl; # managed by Certbot
        listen 443 ssl; # managed by Certbot
        ssl_certificate /etc/letsencrypt/live/m.pay.coinfabrik.com/fullchain.pem; # managed by Certbot
        ssl_certificate_key /etc/letsencrypt/live/m.pay.coinfabrik.com/privkey.pem; # managed by Certbot
        include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
        ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
```

