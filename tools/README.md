# Tools

## wallet creation
 *  default pass is  `1234`
```bash
aecli account create  <wallet-file_name>  
```

## transfer funds

```bash
EANODE=10.10.0.79:3001 node tx.js from-wallet to-wallet  ammount
```
where:
 - from-wallet: source wallet filename / or init or initX with X in 0..9 (*) 
 - to-wallet: destination wallet filename / or simply an ak_... address
 - amount: amount to transfer

(*) initX will be the hardcoded-miner address X


## massive accounts creation tool

(in my case node is at localhost:3001)

    AENODE=localhost ts-node create_accounts.ts MAX

will, in this order:

1. open `accounts_idx.json` and read its contents to "load" previously generated accounts into "accounts" array.
2. if accounts.length < MAX, script will generate accounts and save into accounts_idx.json until MAX reached.  
# merge funds:
3. script will check the funds of the ten hardcoded accounts and will merge them into the first of them.
    public_key: "ak_2mwRmUeYmfuW93ti9HMSUJzCk1EYcQEfikVSzgo6k2VghsWhgU",
    public_key: "ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk",
    public_key: "ak_tWZrf8ehmY7CyB1JAoBmWJEeThwWnDpU4NadUdzxVSbzDgKjP",
    ..
    public_key: "ak_zPoY7cSHy2wBKFsdWJGXM7LnSjVt6cn1TWBDdRBUMC7Tur2NQ",
4. distribute:  [total / (3*MAX)] - min_fee  to each account created


## massive customer tool

(in my case node is at localhost:3001)

    AENODE=localhost HUB=localhost node customer_stest.js MAX ms

 * Assume you have `accounts_idx.json` in same path with `MAX` accounts created in there and each one have enough funds.
 
This script will, immediately, start `MAX` customer co-routines with `ms` milliseconds of delay among each of them, 
which will perform a buy transaction of 1 aetto to one merchant (picked randomly from those connected). 

At the moment, no stat is performed by this script.  But you can check merchants balance in its own console.
