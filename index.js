'use strict';

const Keythereum = require('keythereum');
const EthereumTx = require('ethereumjs-tx');
const Web3 = require('web3');
const GeneratePassword = require('password-generator');

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
const keysDir = process.argv[2];
const address = process.argv[3];
const password = process.argv[4];
const keysManagerAddress = process.argv[5];
const keysManagerABI = require('./KeysManager.abi.json');

const GASPRICE_GWEI = 1;

function loginf(...args) {
    console.log(new Date().toISOString(), ...args);
}

function logerr(...args) {
    console.error(new Date().toISOString(), ...args);
}

function generateKey() {
    var params = {
        keyBytes: 32,
        ivBytes: 16,
    };
    var dk = Keythereum.create(params);
    var password = GeneratePassword(20, false);
    var keyObj = Keythereum.dump(password, dk.privateKey, dk.salt, dk.iv, {});
    return {
        dk,
        password,
        keyObj,
    };
}

function validateArgs() {
    if (process.argv.length !== 6) {
        logerr('Usage: node index.js KEYSTORE_DIR 0xADDRESS KEYSTORE_PASSWORD KEYS_MANAGER_ADDRESS');
        process.exit(1);
    }

    if (!web3.utils.isAddress(address)) {
        logerr('Incorrect parameter ADDRESS: ' + address);
        logerr('Expecting 0x-prefixed address. If it contains both uppercase and lowercase letters, checksum is also validated.');
        process.exit(1);
    }

    if (!web3.utils.isAddress(keysManagerAddress)) {
        logerr('Incorrect parameter KEYS_MANAGER_ADDRESS: ' + keysManagerAddress);
        logerr('Expecting 0x-prefixed address. If it contains both uppercase and lowercase letters, checksum is also validated.');
        process.exit(1);
    }
}

function getPrivateKeyFromInitialKey(address, keysDir) {
    var key = Keythereum.importFromFile(address, keysDir);
    var privateKey = Keythereum.recover(password, key);
    return privateKey;
}

function createKeys(address, privateKey, keysManagerContract, miningKeyAddress, votingKeyAddress, payoutKeyAddress, callback) {
    loginf('createKeys for: ' + address);
    loginf('calling getId');
    web3.eth.net.getId((err, chainId) => {
        if (err) throw err;

        loginf('chainId:', chainId);
        loginf('calling estimateGas');
        keysManagerContract.methods.createKeys(miningKeyAddress, votingKeyAddress, payoutKeyAddress).estimateGas({ from: address }, (err, gasEstimation) => {
            if (err) throw err;

            loginf('gasEstimation:', gasEstimation);
            loginf('calling getTransactionCount');
            web3.eth.getTransactionCount(address, (err, nonce) => {
                if (err) throw err;

                loginf('nonce:', nonce);
                loginf('encoding method call');
                var txData = keysManagerContract.methods.createKeys(miningKeyAddress, votingKeyAddress, payoutKeyAddress).encodeABI();
                loginf('txData:', txData);
                var txParams = {
                    from: address,
                    to: keysManagerAddress,
                    data: txData,
                    gasPrice: web3.utils.toHex(web3.utils.toWei(GASPRICE_GWEI.toString(), 'gwei')),
                    gasLimit: parseInt(gasEstimation),
                    chainId: chainId,
                    nonce: parseInt(nonce) + 1,
                };

                loginf('signing tx');
                var tx = new EthereumTx(txParams);
                tx.sign(privateKey);
                var serializedTx = tx.serialize();
                loginf('calling sendSignedTransaction');
                web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'), (err, txHash) => {
                    if (err) throw err;

                    loginf('tx:', txHash);
                    return callback(null, txHash);
                });
            });
        });
    });
}

// ********** MAIN ********* //
validateArgs();

var miningKey = generateKey();
var votingKey = generateKey();
var payoutKey = generateKey();

loginf('miningKey:', miningKey);
loginf('votingKey:', votingKey);
loginf('payoutKey:', payoutKey);

const keysManagerContract = new web3.eth.Contract(keysManagerABI, keysManagerAddress);
var privateKey = getPrivateKeyFromInitialKey(address, keysDir);
loginf('Recovered private key from initial key: ' + privateKey.toString('hex'));

createKeys(
    address,
    privateKey,
    keysManagerContract,
    miningKey.keyObj.address,
    votingKey.keyObj.address,
    payoutKey.keyObj.address,
    (err, result) => {
        if (err) throw err;

        loginf('* saving miningKey:');
        loginf('* password:', miningKey.password);
        Keythereum.saveToFile(miningKey.keyObj);

        loginf('* saving votingKey:');
        loginf('* password:', votingKey.password);
        Keythereum.saveToFile(votingKey.keyObj);

        loginf('* saving payoutKey:');
        loginf('* password:', payoutKey.password);
        Keythereum.saveToFile(payoutKey.keyObj);

        loginf('Done');
    }
);
