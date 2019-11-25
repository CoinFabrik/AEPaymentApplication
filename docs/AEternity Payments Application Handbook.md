# Æternity Payments Application
## Handbook for the Universe One Conference

## Purpose Of This Document
This document is a brief guideline to use the Pæy.me application.

[TOC]


## Using the Pæy.me application
### You are a Merchant
 1. Install the Base æpp from the store:
    * On Android, check Google Play Strore
    * On iOS, use the web application from https://base.aepps.com
 1. Based on your preferences you can choose to use either the default configured Base-Aepp node or one custom made. Always check the node is connected to the same network (mainnet/testnet) than the hub you are connecting to. In case you want to use a custom node:
     * Tap on **connect to another node**
     * Enter your node, in our case: https://aehub.coinfabrik.com/
 1. Fund your AE account. You will need at least 0.00004 AE every time you open and close a state channel.
 1. In the **Browse** tab open the Pæy.me Merchant application. If you don’t find it in the featured applications menu, open the following url: https://m.pay.coinfabrik.com
 1. Connect your Pæy.me application to your wallet. An access request is shown, press ALLOW.
 1. Depending on apps configuration, you may need to scan an onboarding code to connect to the Payment Hub or it will be automatic. In the first case check the **Onboarding Section** below.
 1. Enter the name of your store, which will allow customers to identify your payment requests.
 1. Open the state channel. You will be asked to confirm the transaction. This operation could take from 3 to 5 minutes, until the transaction is confirmed in the blockchain (a new block must be mined). Do not close the application, because the channel's FiniteStateMachine could reach an invalid state.
 1. Your Channel Balance is 0.00 AE. Every time you are paid, this balance will grow. Once you close the channel, all the funds go from you Channel Balance to your Wallet Balance.
 1. Request one Payment. Just enter the amount your customer has to pay and, optionally, the item(s) you are being paid for. Show the payment request (QR code) to be scanned by your customer. Once the payment request is accepted, the collected amount will be accumulated in your Channel Balance. You can repeat this step multiple times for different customers.
 1. Check your activity. All the payments you collected appear ordered by date.
 1. Close the state channel. You will be asked to confirm the transaction. The same as while opening the channel, this operation could take from 3 to 5 minutes, until the transaction is confirmed in the blockchain (a new block must be mined). Do not close the application, because the node (FSM) could reach an invalid state.
 1. All the funds in your Channel Balance go to your Wallet.

### You are a Customer

 1. Install the Base æpp from the store
    * On Android, check Google Play Strore
    * On iOS, use the web application from https://base.aepps.com
 1. Based on your preferences you can choose to use either the default configured Base-Aepp node or one custom made. Always check the node is connected to the same network (mainnet/testnet) than the hub you are connecting to. In case you want to use a custom node:
     * Tap on **connect to another node**
     * Enter your node, in our case: https://aehub.coinfabrik.com/
 1. Fund your AE account. You will need at least 0.00004 AE every time you open and close a state channel, plus the amount of AEs you are planning to spend with your purchases.
 1. In the Browse tab open the Pæy.me Merchant application. If you don’t find it in the featured applications menu, open the following url: https://c.pay.coinfabrik.com
 1. Connect your Pæy.me application to your wallet. An access request is shown, press ALLOW.
 1. Depending on apps configuration, you may need to scan an onboarding code to connect to the Payment Hub or it will be automatic. In the first case check the **Onboarding Section** below.
 1. Enter your name, which will allow merchants to identify your payments.
 1. Deposit AEs into your channel. Set the amount you want to deposit in order to make purchases.
 1. Open the state channel. You will be asked to confirm the transaction. This operation could take from 3 to 5 minutes, until the transaction is confirmed in the blockchain (a new block must be mined). Do not close the application, because the node (FSM) could reach an invalid state.
 1. Your Channel Balance is the amount you deposited. Every time you pay, this balance will decrease. Once you close the channel, all the remaining funds go from you Channel Balance to your Wallet Balance.
 1. Make a payment. Just go to a store and buy what you want. When paying, ask the seller to use Pæy.me. Seller will show you a QR Code with the payment request. Once you scan it, all its information will appear on your device. Confirm the transaction and the seller will receive your payment.
 1. Check your activity. All the payments you made appear ordered by date.
 1. All the funds in your Channel Balance go to your Wallet.

## Onboarding section

The Onboarding QR code can be printed from this page. It should be visible and accessible for every user, customers and merchants, at the entrance and replicated in many points along the conference site (auditoriums, chat rooms, buffets, etc.) including, of course, every point of sale.
This QR code includes the server configuration:

![Onboarding QR Code](https://i.imgur.com/KYWN6lX.png)
