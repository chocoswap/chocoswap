## ropsten testnet hash

Contract name |hash
---|---
choco_hash | 0x256c394aD4a5Fe42311b6296B63f16943937DAD6
choco_presale_hash | 0xBfbeD1CA01335370DC8a714D638627c8FA14dC83
vnla_hash | 0x8E62389CA02EAf67a83f824654c63b47FD435951
vnladist_hash | 0x9960ECb89Ec3F375b6A481373FFB12504178D70B
private_key | b4a7e45ed8ba7ccf21f425f9b2db7154d04300e2a26d7769b9adf948ec8bcf3c

Asset name | hash
---|---
choco | 0x256c394aD4a5Fe42311b6296B63f16943937DAD6
vnla | 0x8E62389CA02EAf67a83f824654c63b47FD435951
usdt | 0x516de3a7a567d81737e3a46ec4ff9cfd1fcb0136
dai | 0xc2118d4d90b274016cB7a54c03EF52E6c537D957


Uni pair | hash
---|---
USDT_CHOCO_lp_0 | 0x4DAAC4991b09C41eB32c38850adb5E91cf603340
USDT_VNLA_lp_1 | 0x3a72D784b97CAF33BEDC3d897171383798eABfd5
USDT_DAI_lp_2 | 0x1BF39399FC3cDb6ace84466f066Bddb110A040a8





## vnla funcs interfaces
Invoke methods include:(send())
1. transfer

abi file | contract hash | method | parameters
---|---|---|---
vnla.abi | vnla_hash | transfer |(to, amount)


2. approve

abi file | contract hash | method | parameters
---|---|---|---
vnla.abi | vnla_hash | approve |(spender_address, max_uint256)

3. transferFrom

abi file | contract hash | method | parameters
---|---|---|---
vnla.abi | vnla_hash | transferFrom |(sender_address, recipient_address, amount)


Pre-invoke methods includes (call())
4. allowance

abi file | contract hash | method | parameters | returns 
---|---|---|---|---
vnla.abi | vnla_hash | allowance |(owner_address, spender_address) | uint256

5. balanceOf

abi file | contract hash | method | parameters | returns 
---|---|---|---|---
vnla.abi | vnla_hash | balanceOf |(owner_address) | uint256


6. supply

abi file | contract hash | method | parameters | returns 
---|---|---|---|---
vnla.abi | vnla_hash | totalSupply | None | uint256



## vnladist funcs interfaces

1. deposit

abi file | contract hash | method | parameters
---|---|---|---
vnladist.abi | vnladist_hash | deposit |(lp_pid, lp_amount)
Before invoking deposit, you should invoke approve first.

lp_id_hash.approve(vnladist_hash, max_uint256)

1. withdraw 

abi file | contract hash | method | parameters
---|---|---|---
vnladist.abi | vnladist_hash | withdraw |(lp_pid, lp_amount)

#### withdraw(lp, lp_amount) can satisfy three requirements.

1.1. Withdraw all the profit, withdraw(lp, 0)

1.2. Withdraw partial profit lp_amt, withdraw(lp, lp_amt)

1.3. Withdraw all the profit and lp amt, withdraw(lp, lp_all_amt)

3. Check current pending profit

abi file | contract hash | method | parameters
---|---|---|---
vnladist.abi | vnladist_hash | pendingVnla |(lp_pid, user_address)

1. Check how many lps have been deposited currently

abi file | contract hash | method | parameters | returns
---|---|---|---|---
vnladist.abi | vnladist_hash | userInfo |(lp_pid, user_address) | UserInfo

```
struct UserInfo {
    uint256 amount;
    uint256 rewardDebt;
}
```


## Extra

1. Your VNLA balance:

abi file | contract hash | method | parameters | returns 
---|---|---|---|---
vnla.abi | vnla_hash | balanceOf | None | uint256



2. total VNLA supply:

abi file | contract hash | method | parameters | returns 
---|---|---|---|---
vnla.abi | vnla_hash | totalSupply | None | uint256

3. pending harvest 

=>pendingVnla(user_address)

1. New Reward per block

abi file | contract hash | method | parameters | returns 
---|---|---|---|---
vnla.abi | vnladist_hash | rewardPerBlock | None | uint256

The Calculation method is explained as bellow.
Input: start Block number => sb
Input: end block number
Input: current block number => cb (pls refer to [web3js](https://web3js.readthedocs.io/en/v1.2.0/web3-eth.html#getblocknumber))

Output: new reward per block => y
=> 
```
if cb > sb {
    a = math.floor((cb - sb) / 40320)
    if (a >9 ) {
        factor = 0
    } else if (a == 9) {
        factor = 1
    } else {
        factor = 2 ^ (8 - a)
    }
    y = factor * 4359654017857142
} else {
    y = 0
}
```