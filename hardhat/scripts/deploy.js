const hre = require('hardhat');

async function main(){
    const votingContract = await hre.ethers.getContractFactory("Voting");
    const deployedVotingContract = await votingContract.deploy();

    console.log(`Contract Address Deployed: ${deployedVotingContract.target}`);
}

main().catch((error)=>{
    console.error(error);
    process.exitCode = 1;
});

// Contract Address Deployed: 0xAD470F46119661415Ee5fD94D5e2246fF2428404
//https://amoy.polygonscan.com/address/0xAD470F46119661415Ee5fD94D5e2246fF2428404