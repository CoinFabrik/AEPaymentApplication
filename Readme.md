# AEHub Payment Application: 

This is a payment application through state channels inside the **Aeternity blockchain application**. Before putting our hands to work, let's understand the complexity of the application: 

* Firstly, let's focus on the environment where our featured applications will be running; the **base Ae application**. This is the Aeternity blockchain official application where the complete features of this blockchain will be available; from creating accounts, wallets, to sending and receiving transactions and so on. However, and luckily for us, this app allows adding special applications, aeapps, which will be running one at a time in each phone, to upgrade the app. 

### Aeaps

* Two featured applications have been developed to work together inside this app, resulting in what it is called a payment application through state channels. If you want to test them either by using our node or the aeternity testnet node you must follow the [AEternity Payments Application handbook guide](https://github.com/CoinFabrik/AEPaymentApplication/blob/master/docs/AEternity%20Payments%20Application%20Handbook.md). This tutorial will take you through a series of instructions to test the aeapps in a simple and straightforward way. We suggest having two cell phones at the time of testing them, otherwise, you would not be able to appreciate the results and the potential of these aeapps. However, if this is something not available for you, we remind you that it is possible to test the aepps separately, one at a time on your phone. 

### AEHub

* The aeternity base application connects to a server which is assigned automatically when the app is started. It is possible to reassign the server address to one of your own choice. This leads us to our third and final step to complete the application, the AEHub payment hub to work with state channels. 

* For starters, we recommend reading and testing the [AEhub tutorial](https://github.com/CoinFabrik/AEPaymentApplication/blob/master/docs/AEhub.md). This guide will allow you to start your server in your computer, and once this is achieved, it will replicate the behavior of the base aeapp locally and securely. 

* To conclude, once you are ready to complete the process to start your own AEHub payment application, then you must follow the host setup and hub configuration guide, including the reverse proxy configuration to get any phone connected to your server./(TODO).


