Script to generate production keys (mining + voting + payout) from initial key

### Usage:
1. clone the repository
```
git clone https://github.com/phahulin/gen-prod-keys.git
cd gen-prod-keys
```

2. install dependencies
```
npm install
```

3. place initial key's json keystore file into `keystore` folder. Filename should contain the corresponding address (e.g. `initial-key-0xd61a7010e9b40819df0045cbcd0c89c51ad18fe1.json`)

4. run the script
```
node index.js . <0xADDRESS> <KEYSTORE_PASSWORD> <KEYSMANAGER_CONTRACT_ADDRESS>
```
* `0xADDRESS` - initial key's address with `0x` prefix
* `KEYSTORE_PASSWORD` - password for initial key's json keystore file
* `KEYSMANAGER_CONTRACT_ADDRESS` - `0x`-prefixed address of the keys manager contract of the network.

5. generated mining, voting and payout json keystore files and their passwords will be saved in `production-keys/validator-<0xADDRESS>/` folder:
```
| production-keys/
| ---- validator-0xd61a7010e9b40819df0045cbcd0c89c51ad18fe1/
| --------  mining-0x7b0661c73bb2b0d7fa3de65791b27ef35cfbb65e.json
| --------  mining-0x7b0661c73bb2b0d7fa3de65791b27ef35cfbb65e.key
| --------  voting-0x4acf7136731e0105772969d771f750749c17e0c3.json
| --------  voting-0x4acf7136731e0105772969d771f750749c17e0c3.key
| --------  payout-0x9101be9854eaf3f8e4ff84267b6bada712ba2b98.json
| --------  payout-0x9101be9854eaf3f8e4ff84267b6bada712ba2b98.key
```
