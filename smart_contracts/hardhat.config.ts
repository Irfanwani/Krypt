// https://eth-goerli.g.alchemy.com/v2/D1asUcNNtiD8yw3bauJdhmqq5T5PrkN8

require('dotenv').config({path:__dirname+'/.env'})


require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.0",
  networks: {
    goerli: {
      url: process.env.ALCHEMY_URL,
      accounts: [
        process.env.PRIVATE_KEY,
      ],
    },
  },
};
