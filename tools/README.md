# Tools

## wallet creation
 *  default pass is 1234
```bash
aecli account create  <wallet-file_name>  
```

## transfer funds

```bash
EANODE=10.10.0.79:3001 node tx.js from-wallet to-wallet  ammount
```
where:
 - from-wallet: source wallet filename
 - to-wallet: destination wallet filename / or simple an ak_... address
 - amount: amount to transfer

a shortcut only valid in `from-wallet` is: `init` which will take data from first standard account.


## merchant example: merchtest3b.js
This will take wallet filename from: 
 **argv2**, if fails, env:**MERCHANT**, if fails, env:**ACCOUNT**. 

I do run it this way:
```
$ EANODE=10.10.0.79:3001 node merchtest3b.js merchant2
```



## customer example: custtest3b.js
This will take wallet filename from: 
 **argv2**, if fails, env:**CUSTOMER**, if fails, env:**ACCOUNT**. 

I do run it this way:
```
$ EANODE=10.10.0.79:3001 node custtest3b.js customer 
```
