import React, {
  ReactNode,
  FC,
  useState,
  createContext,
  useEffect,
} from "react";
import { ethers } from "ethers";

import { contractABI, contractAddress } from "../utils/constants";

export const TransactionContext = createContext({});

const { ethereum } = window;

const getEthereumContract = () => {
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  const transactionContract = new ethers.Contract(
    contractAddress,
    contractABI,
    signer
  );

  return transactionContract;
};

interface TProps {
  children: ReactNode;
}

export const TransactionProvider: FC<TProps> = ({ children }) => {
  const [connectedAccount, setConnectedAccount] = useState("");

  const [formdata, setFormdata] = useState({
    addressTo: "",
    amount: "",
    keyword: "",
    message: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [tc, setTC] = useState(localStorage.getItem("transactionCount"));
  const [tx, setTx] = useState([]);

  const handleChange = (e, name: string) => {
    setFormdata((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const getAllTransactions = async () => {
    try {
      if (!ethereum) return alert("please install metamask");
      const TransactionContract = getEthereumContract();
      const availableTransactions =
        await TransactionContract.getAllTransactions();

        const structuredTxns = availableTransactions.map((tx: Object) => ({
          addressTo: tx.receiver,
          addressFrom: tx.sender,
          timestamp: new Date(tx.timestamp.toNumber()*1000).toLocaleString(),
          message: tx.message,
          keyword: tx.keyword,
          amount: parseInt(tx.amount._hex) / (10**18)
        }))

      setTx(structuredTxns);

      console.log(structuredTxns);
    } catch (err) {
      console.log(err);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) return alert("Please install metamask");

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length) {
        setConnectedAccount(accounts[0]);
        getAllTransactions();
      } else {
        console.log("No accounts found");
      }

      console.log(accounts);
    } catch (error) {
      alert("No wallet found");
    }
  };

  const checkIfTransactionExist = async () => {
    try {
      const transactionContract = getEthereumContract();
      const transactionCount = await transactionContract.getTransactionCount();

      window.localStorage.setItem("transactionCount", transactionCount);
    } catch (err) {
      console.log(err);
    }
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Please install metamask");

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      setConnectedAccount(accounts[0]);
    } catch (error) {
      console.log(error);

      throw new Error("No ethereum object.");
    }
  };

  const sendTransaction = async () => {
    try {
      if (!ethereum) return alert("Please install metamask");

      // get the data from the form

      const { addressTo, amount, keyword, message } = formdata;

      const transactionContract = getEthereumContract();
      const parsedAmount = ethers.utils.parseEther(amount);

      await ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: connectedAccount,
            to: addressTo,
            gas: "0x5208", // 21000 gwei
            value: parsedAmount._hex,
          },
        ],
      });

      const transactionHash = await transactionContract.addToBlockchain(
        addressTo,
        parsedAmount,
        message,
        keyword
      );
      setIsLoading(true);
      console.log(`Loading - ${transactionHash.hash}`);
      await transactionHash.wait();

      setIsLoading(false);

      console.log(`Success - ${transactionHash.hash}`);

      const transactionCount = await transactionContract.getTransactionCount();

      setTC(transactionCount.toNumber());

      window.location.reload();
    } catch (error) {
      console.log(error);

      throw new Error("No ethereum object");
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    checkIfTransactionExist();
  }, []);
  return (
    <TransactionContext.Provider
      value={{
        connectWallet,
        connectedAccount,
        formdata,
        handleChange,
        sendTransaction,
        tx,
        isLoading
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
