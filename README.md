# AEhub

## Description

This is a payment hub demo implementation over AEternity State Channels. This hub provides a centralized version of what would be a Virtual State Channel, allowing for micro-payments.
 
This application is complemented with the Customer and Merchant apps to be run inside AEternity Base-Aepp.

This server will connect to Merchants and Customers apps through State-channels, enabling them communicate payment-creation and execution, keeping track of balances and purchases while also tracking State-channel state allowing clients safe reconnection. 

The AEternity Base-Aepp architecture requires all content be delivered through SSL/TLS connections. It is because of this that we require sometimes wrapping connections with a reverse proxy configured to use SSL/TLS certificates and that we provide some custom-url configuration. 


## Configuration

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


(*) Custom clients may ignore this setting and use whichever node they want. But by using this parameter you can avoid one point of failure in configuration. 


# A real-world sample configuration

This is a real-life configuration example. 

 1. First create an account for the server (it search for file named hub). Hub will try to use empty or "1234" password to open the created wallet file:

```bash
$ aecli account create hub

✔ Enter your password … ****
Address_________________________________ ak_k65RLRPH8KbexMw5c2efG8wK2X8yKL6VzYimAJMh3Eai36W5q
Path____________________________________ ../hub
```

 2. Transfer a few AEs to the created address, in this case: `ak_k65RLRPH8KbexMw5c2efG8wK2X8yKL6VzYimAJMh3Eai36W5q`.


## Host Setup
 
We have one host serving:

 * aeternity node
 * merchant and customer client-side apps (requires one subdomain each)
 * hub providing micro-payment service (requires one domain along with node)
 
### Hub configuration

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

### Reverse-Proxy configuration

#### Node

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

#### Hub

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


#### Merchant and Customer Apps
 
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
