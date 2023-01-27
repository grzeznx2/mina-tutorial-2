import { IncrementSecret } from './IncrementSecret.js';
import {
  Field,
  Mina,
  isReady,
  shutdown,
  PrivateKey,
  AccountUpdate,
} from 'snarkyjs';

await isReady;

const useProof = false;
const Local = Mina.LocalBlockchain({ proofsEnabled: useProof });
Mina.setActiveInstance(Local);

const { privateKey: deployerKey, publicKey: deployerAccount } =
  Local.testAccounts[0];
const { privateKey: senderKey, publicKey: senderAccount } =
  Local.testAccounts[1];

const zkAppPrivateKey = PrivateKey.random();
const zkAppAddress = zkAppPrivateKey.toPublicKey();

const zkAppInstance = new IncrementSecret(zkAppAddress);

const salt = Field.random();

const deployTxn = await Mina.transaction(deployerAccount, () => {
  AccountUpdate.fundNewAccount(deployerAccount),
    zkAppInstance.deploy(),
    zkAppInstance.initState(salt, Field(750));
});

await deployTxn.prove();
await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();

const num0 = await zkAppInstance.x.get();
console.log(num0.toString());

const txn1 = await Mina.transaction(senderAccount, () => {
  zkAppInstance.incrementSecret(salt, Field(750));
});

await txn1.prove();
await txn1.sign([senderKey]).send();

const num1 = zkAppInstance.x.get();
console.log(num1.toString());

await shutdown();
