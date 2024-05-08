const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.parseUnits(n.toString(), 'ether')
}

describe('Escrow',() => {

    let buyer,seller, inspector, lender
    let realEstate, escrow

    beforeEach ("deploys the contracts", async()=> {

        [buyer,seller,inspector,lender] = await ethers.getSigners()
        
       // console.log('buyer',buyer)
        //deploy Real Estate Property Contract
        const realEstateProperty = await ethers.getContractFactory('RealEstateProperty')
        realEstate = await realEstateProperty.deploy()
        realEstate.waitForDeployment();
        //console.log(await realEstate.getAddress())


        //Mint a property
        let transaction = await realEstate.connect(seller).mintProp("https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS")
        await transaction.wait();
     //   console.log(transaction)


        //deploy Escrow contract
        // console.log(await realEstate.getAddress());
        // console.log(seller.address);
        // console.log(inspector.address);
        // console.log(lender.address);

        const Escrow = await ethers.getContractFactory('Escrow')
        escrow = await Escrow.deploy(
           await realEstate.getAddress(),
            seller.address,
            inspector.address,
            lender.address
        );
        escrow.waitForDeployment();
       // console.log(await escrow.getAddress())
        
       //Approve Property 
       //Every ERC721 token has inbuilt approve function which can be called to approve the transfer of ownership of the NFT
        let EscrowContract = await escrow.getAddress();
       transaction = await realEstate.connect(seller).approve(EscrowContract,1);
       await transaction.wait();

        //Call the list function in Escrow as seller
       transaction = await escrow.connect(seller).listProperty(1,buyer.address,tokens(100),tokens(25));
       await transaction.wait();


    })

    

    describe('check Users', () => {


        it('returns NFT Address', async() => {
            let result = await escrow.nftAddress()
            expect(result).to.be.equal(await realEstate.getAddress())
        })
    
    
        it('returns seller Address', async() => {
            let result = await escrow.seller()
            expect(result).to.be.equal(seller.address)
        })
    
    
        it('returns Inspector Address', async() => {
            let result = await escrow.inspector()
            expect(result).to.be.equal(inspector.address)
        })
    
        it('returns lender Address', async() => {
            let result = await escrow.lender()
            expect(result).to.be.equal(lender.address)
        })

    })
        
        

    describe('Listing', () => {

        it('Updates Ownership', async() => {
    
            expect(await realEstate.ownerOf(1)).to.be.equal(await escrow.getAddress())
    
        })

        it('Updates Status of the Property', async()=> {

            let status = await escrow.isListed(1)
            expect(status).to.be.equal(true)
        })
    

        it('Updates Purchase Price of the Property', async()=> {

            let status = await escrow.purchasePrice(1)
            expect(status).to.be.equal(tokens(100))
        })

        it('Updates buyer of the Property', async()=> {

            let status = await escrow.buyer(1)
            expect(status).to.be.equal(buyer.address)
        })
        it('Updates Escrow Amount of the Property', async()=> {

            let status = await escrow.escrowAmount(1)
            expect(status).to.be.equal(tokens(25))
        })
    
    })


    describe ('Escrow Deposit', () => {

        beforeEach ('Calling deposit function...', async() => {
            const tx = await escrow.connect(buyer).depositEscrowAmount (1, {value: tokens(25)});
            await tx.wait();

        })

        it('Buyer deposits escrow amount', async() => {
            
            expect(await escrow.getBalance()).to.be.equal(tokens(25))

        })


    })


    describe('Inspection Status',()=>{

        beforeEach('Update Inspection', async()=>{
            let transaction = await escrow.connect(inspector).approveInspectionStatus(1,true)
            await transaction.wait()
        })

        it('Inspector updates the status', async() => {
            let status = await escrow.inspectionStatus(1)
            expect (status).to.be.equal(true)
        })

    })

    describe('Approval',() => {

        beforeEach('Approval by users', async() => {

            let sellerApproval = await escrow.connect(seller).approveSale(1);
            await sellerApproval.wait();
            
            let buyerApproval = await escrow.connect(buyer).approveSale(1);
            await buyerApproval.wait();

            let lenderApproval = await escrow.connect(lender).approveSale(1);
            await lenderApproval.wait();


        })

        it('Approval by stakeholders',async() => {

            expect(await escrow.approval(1, buyer.address)).to.be.equal(true)
            expect(await escrow.approval(1, seller.address)).to.be.equal(true)
            expect(await escrow.approval(1, lender.address)).to.be.equal(true)


        })

    })


    describe('Finalize Sale',() =>{

        beforeEach('setting prerequisites', async() => {

           
            let inspectionStatus = await escrow.connect(inspector).approveInspectionStatus(1,true);
            await inspectionStatus.wait();

            let sellerApproval = await escrow.connect(seller).approveSale(1);
            await sellerApproval.wait();
            
            let buyerApproval = await escrow.connect(buyer).approveSale(1);
            await buyerApproval.wait();

            let lenderApproval = await escrow.connect(lender).approveSale(1);
            await lenderApproval.wait();

            let buyerShare = await escrow.connect(buyer).depositEscrowAmount (1, {value: tokens(25)});
            await buyerShare.wait();

            await lender.sendTransaction({to: await escrow.getAddress(), value: tokens(75)});


            let finalizeSale = await escrow.connect(seller).transferProperty(1);
            await finalizeSale.wait();

        })
        

        it('Updates ownership of property',async() => {

            expect (await realEstate.ownerOf(1)).to.be.equal(buyer.address)

        })

        it('Transfer done',async()=> {
            expect(await escrow.getBalance()).to.be.equal(0)
        })


    })

    describe('Handle Escrow',() => {
        //Refer Hardhat chai matchers

        beforeEach('Prerequisites', async() => {
            //Buyer deposits escrow amount
          
            let txn = await escrow.connect(buyer).depositEscrowAmount(1,{value: tokens(25)})
            await txn.wait()

        })


        it('Buyer refunded after failed inspection',async() => {
            let inspection = await escrow.connect(inspector).approveInspectionStatus(1,false)
            await inspection.wait()
            expect (await escrow.intiatePayment(1)).to.changeEtherBalances([await escrow.getAddress(),buyer.address],[-25,25])
        })

        it('Seller gets the escrow amount if the inspection is successful',async() => {
            let inspection = await escrow.connect(inspector).approveInspectionStatus(1,true)
            await inspection.wait()
            expect (await escrow.intiatePayment(1)).to.changeEtherBalances([await escrow.getAddress(),seller.address],[-25,25])
    
        })
    })

})



