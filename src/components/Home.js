import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

import close from '../assets/close.svg';

const Home = ({ home, provider,account, escrow, togglePop }) => {

    const [buyer,setBuyer] = useState(null)
    const [lender,setLender] = useState(null)
    const [inspector,setInspector] = useState(null)
    const [seller,setSeller] = useState(null)
    const [owner,setOwner] = useState(null)

    const [hasBought,setHasBought] = useState(false)
    const [hasSold,setHasSold] = useState(false)
    const [hasLended,setHasLended] = useState(false)
    const [hasInspected,setHasInspected] = useState(false)

    const fetchDetails = async() => {

        const buyer = await escrow.buyer(home.id)
        setBuyer(buyer)

        const hasBought = await escrow.approval(home.id,buyer)
        setHasBought(hasBought)

        const lender = await escrow.lender()
        setLender(lender)

        const hasLended = await escrow.approval(home.id,lender)
        setHasLended(hasLended)

        const inspector = await escrow.inspector()
        setInspector(inspector)

        const hasInspected = await escrow.inspectionStatus(home.id)
        setHasInspected(hasInspected)
        

        const seller = await escrow.seller()
        setSeller(seller)

        const hasSold = await escrow.approval(home.id,seller)
        setHasSold(hasSold)

    }


    const fetchOwner =  async () => {

        if(await escrow.isListed(home.id)) return
            const owner = await escrow.buyer(home.id)
            setOwner(owner)

    }


    useEffect(() => {

        fetchDetails()
        fetchOwner()

    },[hasSold])


    const buyHandler = async() => {

        //Get the escrow amount for the home
        const escrowAmount = await escrow.escrowAmount(home.id)
        
        //Transfer the amount to the escrow account
        //Get Signer first
        const signer = await provider.getSigner()
        let transaction = await escrow.connect(signer).depositEscrowAmount(home.id,{value: escrowAmount})
        await transaction.wait()

        //Approve the sale from the buyer point of view
        transaction = await escrow.connect(signer).approveSale(home.id)
        await transaction.wait()

        setHasBought(true)

    }

    const inspectionHandler = async() => {

        const signer = await provider.getSigner()
        let transaction = await escrow.connect(signer).approveInspectionStatus(home.id,true)
        await transaction.wait()

        setHasInspected(true)
        
    }

    const lendHandler = async() => {
        
        const signer = await provider.getSigner()
        
        //Approve the sale from the lender point of view
        let transaction = await escrow.connect(signer).approveSale(home.id)
        await transaction.wait()

        //Send the balance amount to the escrow account
        //Lender Amount = Purchase Price of the home - Escrow Amount deposited by the buyer
        const lenderAmount = await escrow.purchasePrice(home.id) - await escrow.escrowAmount(home.id)
        await signer.sendTransaction({to: escrow.address, value: lenderAmount.toString(), gasLimit: 60000})

        setHasLended(true)

    }
    const sellHandler = async() => {

        const signer = await provider.getSigner()
        
        //Approve the sale from the sellet point of view
        let transaction = await escrow.connect(signer).approveSale(home.id)
        await transaction.wait()

        //Transfer the property to buyer
        transaction = await escrow.connect(signer).transferProperty(home.id)
        await transaction.wait()

        setHasSold(true)
        
    }



    return (
        <div className="home">
            <div className='home__details'>
                <div className='home__image'>
                    <img src = {home.image} alt = 'Home' />

                </div>
                <div className = 'home__overview'>
                    <h2>{home.name}</h2>
                    <p>
                    <strong>{home.attributes[2].value}</strong> beds |
                    <strong>{home.attributes[3].value}</strong> baths |
                    <strong>{home.attributes[4].value}</strong> sq.ft

                    </p>
                    <p>
                        {home.address}
                    </p>
                    <h2>
                        {home.attributes[0].value} ETH
                    </h2>

                   {owner ? (
                    <div className = 'home__owned'> 
                        Owned by {owner.toString().slice(0,3)} + '...' + {owner.toString().slice(38,42)}
                    </div>
                   ) : (
                    <div>
                       {(account === inspector) ? (

                        <button className = 'home__buy' onClick = {inspectionHandler} disabled = {hasInspected}>
                            Approve Inspection
                        </button>

                       ) : (

                        (account === lender) ? (
                            <button className = 'home__buy' onClick={lendHandler} disabled={hasLended}>
                                Approve & Lend

                            </button>

                        ) : (
                            (account === seller) ? (
                            <button className = 'home__buy' onClick={sellHandler} disabled={hasSold}>
                                Approve & Sell
                            </button>
                            ) : (
                            <button className = 'home__buy' onClick={buyHandler} disabled={hasBought}>
                                Buy
                            </button>
                                
                            )

                        )

                       )}
                        <button className = 'home__contact'>
                                Contact Agent
                        </button>
                    </div>    
                   )}

                    
                    <h2>
                        Overview
                    </h2>
                    <p>
                        {home.description}
                    </p>
                    <h2>
                        Facts and Features
                    </h2>
                    <ul>
                        {home.attributes.map((attribute,index) => (
                            <li key = {index}>
                                <strong>{attribute.trait_type}</strong> : {attribute.value}
                            </li>
                        ))}
                    </ul>
                </div>

                <button className = 'home__close' onClick={togglePop}>
                    <img src = {close} alt = 'Close button'/>
                </button>

            </div>
        </div>
    );
}

export default Home;
