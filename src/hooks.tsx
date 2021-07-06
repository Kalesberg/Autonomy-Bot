import React, { useEffect, useState, useCallback } from 'react';
import Web3 from 'web3';
import Web3Modal from 'web3modal';
import { provider as ProviderType } from 'web3-core';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { AbiItem } from 'web3-utils';
import { Contract, ContractOptions } from 'web3-eth-contract';

import { REGISTRY_CONTRACT_ADDRESS, SENDER_CONTRACT_ADDRESS } from './config/contants';
import registryAbi from './config/registryABI.json';
import senderAbi from './config/senderABI.json';

/**
 * Global scope variables
 * These need to be initialized only once
 * * Required for Web3Modal init
 */
const providerOptions = {
  walletconnect: {  // optional
    package: WalletConnectProvider,
    options: {
      infuraId: "8043bb2cf99347b1bfadfb233c5325c0"
    }
  }
};
const web3Modal = new Web3Modal({
  cacheProvider: false,
  disableInjectedProvider: false,
  providerOptions,
});

export const useConnector = () => {
  const [provider, setProvider] = useState<ProviderType | null>(null);  // Web3 Http Provider
  const [web3, setWeb3] = useState<Web3 | null>(null);  // Actual web3 object
  const [isRopsten, setIsRopsten] = useState(false);  // Flag to only allow Ropsten
  const [registryContract, setRegistryContract] = useState<Contract | null>(null);  // Reg contract object
  const [senderContract, setSenderContract] = useState<Contract | null>(null);  // Sender contract object

  /**
   * Connect Metamask
   * ! Use Ropsten to properly use this app
   * * Web3Modal library needs to be updated for event subscribers (connect, disconnect)
   */
  const connect = useCallback(async () => {
    const provider = await web3Modal.connect();
    provider
    .on('connect', console.log)
    .on('chainChanged', (chainId: number) => {
      setIsRopsten(chainId.toString() === '0x3');
    });
    setProvider(provider);
    const web3 = new Web3(provider);
    setWeb3(web3);
    setRegistryContract(new web3.eth.Contract((registryAbi as unknown) as AbiItem, REGISTRY_CONTRACT_ADDRESS));
    setSenderContract(new web3.eth.Contract((senderAbi as unknown) as AbiItem, SENDER_CONTRACT_ADDRESS));
  }, [setProvider, setWeb3]);

  /**
   * Disconnect Wallet
   */
  const disconnect = useCallback(async () => {
    web3Modal.clearCachedProvider();
    setProvider(null);
    setIsRopsten(false);
  }, [setProvider]);

  /**
   * Detech Ropsten network
   */
  useEffect(() => {
    async function init() {
      if (web3) {
        const chainId = await web3.eth.net.getId();
        setIsRopsten(chainId === 3);
      }
    }
    init();
  }, [web3, setIsRopsten]);

  return { connect, disconnect, web3, isRopsten, registryContract, senderContract };
};

/**
 * useContract
 * Create Contract object for a deployed smart contract
 * @param abi ABI
 * @param address Smart Contract Address
 * @param contractOptions Contract Options
 * @returns Web3 Contract object
 */
export const useContract = (abi: AbiItem, address: string, contractOptions?: ContractOptions) => {
  const { web3 } = useConnector();
  const [contract, setContract] = useState<Contract | null>(null);

  useEffect(() => {
    if (web3) {
      setContract(new web3.eth.Contract(abi, address, contractOptions));
    }
  }, [abi, address, contractOptions, web3])

  return contract;
};
