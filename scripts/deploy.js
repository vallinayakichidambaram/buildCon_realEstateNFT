// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require ("hardhat")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

async function main() {

  //Same as test - deploy realEstateProperty contract and mint the properties
  //Deploy Escrow and List the properties

  const [buyer,seller,inspector,lender] = await ethers.getSigners()
        

  //deploy Real Estate Property Contract
  const realEstateProperty = await ethers.getContractFactory('RealEstateProperty')
  const realEstate = await realEstateProperty.deploy()
  await realEstate.deployed()

  console.log(`Real Estate Property contrat deployed at ${realEstate.address}`)

  //Mint properties
  for (let i=0;i<3;i++) {
    const txn = await realEstate.connect(seller).mintProp(`https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${i + 1}.json`)
    await txn.wait()
  }


  //Deploy Escrow Contract
  const escrowContract = await ethers.getContractFactory('Escrow')
  const escrow = await escrowContract.deploy(realEstate.address,
                                              seller.address,
                                              inspector.address,
                                              lender.address)
  await escrow.deployed()


  console.log(`Escrow contrat deployed at ${escrow.address}`)
  //List Properties
  //Approve Properties
  //Every ERC721 token has inbuilt approve function which can be called to approve the transfer of ownership of the NFT

  for (let i=0;i<3;i++) {

    let transaction = await realEstate.connect(seller).approve(escrow.address,i+1);
    await transaction.wait();

  }


  const transaction1 = await escrow.connect(seller).listProperty(1,buyer.address,tokens(20),tokens(10));
  await transaction1.wait();

  const transaction2 = await escrow.connect(seller).listProperty(2,buyer.address,tokens(15),tokens(7));
  await transaction2.wait();

  const transaction3 = await escrow.connect(seller).listProperty(3,buyer.address,tokens(10),tokens(5));
  await transaction3.wait();

  console.log("Finished")
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
