import React, { useCallback, useState } from 'react';
import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FormHelperText from '@material-ui/core/FormHelperText';

import { useConnector } from './hooks';
import './App.css';
import { SENDER_CONTRACT_ADDRESS } from './config/contants';


function App() {
  const [datetime, setDatetime] = useState('');   // When to send ETH
  const [recipient, setRecipient] = useState(''); // Recipient wallet address
  const [amount, setAmount] = useState('');       // Amount in ETH

  const { connect, disconnect, web3, isRopsten, registryContract, senderContract } = useConnector();

  // Handler when click submit button
  const onSubmit = useCallback(async () => {
    if (!registryContract || !senderContract || !web3) return;
    const accounts = await web3.eth.getAccounts();
    const timestamp = (new Date(datetime)).valueOf() / 1000;  // Convert Javascript timestamp for compatibility
    const amountWei = Web3.utils.toWei(amount, 'ether');      // Convert Eth amount to Wei
    const fee = Web3.utils.toWei('0.01', 'ether');
    const bg1 = new BigNumber(amountWei);
    const bg2 = new BigNumber(fee);
    const totalValue = bg1.plus(bg2).toString();  // We apply flat fee of 0.01ETH for every request

    const callData = senderContract.methods.sendEthAtTime(timestamp, recipient).encodeABI();

    registryContract.methods
    .newReq(SENDER_CONTRACT_ADDRESS, '0x0000000000000000000000000000000000000000', callData, amountWei, false, false)
    .send({ from: accounts[0], value: totalValue })
    .on('error', (e: any) => console.error('error!!!', e))
    .on('transactionHash', () => console.info('Your transaction has been recorded'))
    .on('confirmation', () => console.info('You have successfully claimed your airdrop'));
  }, [web3, registryContract, senderContract, datetime, recipient, amount]);

  return (
    <div className="App">
      <div className="App-header">
        <div className="App-logo">
          <a href="/">🧠</a>
        </div>
        <div className="App-motto">
          Autonomy Network
        </div>
        <div className="App-actions">
          {isRopsten ? (
            <button className="btn-connect" onClick={disconnect}>Disconnect</button>
          ) : (
            <button className="btn-connect" onClick={connect}>Connect</button>
          )}
        </div>
      </div>
      <div className="App-body">
        <div className="App-form">
          <h3>Submit Request</h3>
          <div className="form-control">
            <TextField type="datetime-local" variant="outlined" fullWidth
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
            />
          </div>
          <div className="form-control">
            <TextField placeholder="0x00..." label="Recipient Wallet Address" variant="outlined" fullWidth
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          <div className="form-control">
            <TextField placeholder="0.00" label="ETH Amount To Send" variant="outlined" fullWidth
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="form-control">
            <Button variant="contained" color="primary" disableElevation disabled={!isRopsten} onClick={onSubmit}>
              Submit
            </Button>
          </div>
          {!isRopsten && (
            <FormHelperText error>Please use Ropsten Testnet for now.</FormHelperText>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
