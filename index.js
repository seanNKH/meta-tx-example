const nearAPI = require("near-api-js");
const { actionCreators } = require('@near-js/transactions')
const { UnencryptedFileSystemKeyStore } = require('@near-js/keystores-node');
const { InMemorySigner } = require('@near-js/signers');
const keyStore = new nearAPI.keyStores.InMemoryKeyStore();
const { Account } = require('@near-js/accounts');
const { JsonRpcProvider } = require('@near-js/providers');
const os = require('os');
const path = require('path');
const BN = require('bn.js');

const { signedDelegate, transfer } = actionCreators;


async function callMetaTx() {
  const networkId = 'testnet';

    /* Keystore 사용 버전 */
    /*
    const near = await nearAPI.connect(nearConfig);
    const keyPair = nearAPI.KeyPair.fromString(프라이빗 키)
    const relayerKeyPair = nearAPI.KeyPair.fromString(프라이빗키)
    
    await keyStore.setKey(networkId, "트랜잭션 보내는 계정 id", keyPair);
    await keyStore.setKey(networkId, "릴레이어 계정 id", relayerKeyPair);

    // 계정 정보 세팅
    const senderAccountId = "트랜잭션을 보내려고 하는 유저";
    const senderAccount = await near.account(senderAccountId);
    const signingAccount = await near.account("relayertestrelayer.testnet") // 릴레이어 계정 id
    const receiverAccount = "최종 receiver 유저";
    */
   
    /* nearCredentials 사용 버전 */
    const provider = new JsonRpcProvider({ url: 'https://rpc.testnet.near.org' });
    const CREDENTIALS_DIR = '.near-credentials';
    const credentialsPath = path.join(os.homedir(), CREDENTIALS_DIR);
    // access keys are required for the sender and signer
    const receiverAccount = '최종 receiver 유저'; // the ultimate recipient of the meta transaction execution
    const SENDER_ACCOUNT_ID = '트랜잭션을 보내려고 하는 유저';     // the account requesting the transaction be executed
    const SIGNER_ACCOUNT_ID = '릴레이어 계정 id';     // the account executing the meta transaction on behalf (e.g. as a relayer) of the sender
    
    const senderAccount = new Account({
        networkId,
        provider,
        signer: new InMemorySigner(new UnencryptedFileSystemKeyStore(credentialsPath))
    }, SENDER_ACCOUNT_ID);

    const signingAccount = new Account({
        networkId,
        provider,
        signer: new InMemorySigner(new UnencryptedFileSystemKeyStore(credentialsPath))
    }, SIGNER_ACCOUNT_ID);

    try {
    // delegate할 action 정의
    const signedResult = await senderAccount.signedDelegate({
        actions: [
            transfer(new BN('10000000000000000'))
        ],
        blockHeightTtl: 60,
        receiverId: receiverAccount
    });
    // 정의한 action을 relayer가 대신 실행
    console.log(await signingAccount.signAndSendTransaction({
        actions: [
        actionCreators.signedDelegate(signedResult)
        ],
        receiverId: signedResult.delegateAction.senderId,
    }));

  } catch (error) {
    console.error("Error calling contract:", error);
  }
}

callMetaTx();