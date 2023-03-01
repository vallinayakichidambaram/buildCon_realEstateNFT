import logo from '../assets/logo.svg';
import {ethers} from 'ethers';

const Navigation = ({ account, setAccount }) => {

    const connectHandler = async() => {

        const accounts = await window.ethereum.request({method: 'eth_requestAccounts'})
        const account = ethers.utils.getAddress(accounts[0])
        setAccount(account)

    }
    
    return(
        <nav>
            <ul className='nav__links'>
                <li><a href = "#"> Buy</a></li>
                <li><a href = "#"> Rent</a></li>
                <li><a href = "#"> Sell</a></li>
            </ul>
            <div className='nav__brand'>
                <img 
                    src = {logo}
                    alt = 'Logo'
                />
                <h1>BuildCon</h1>
                
              {account ? (<button
                    type = 'button'
                    className='nav__connect'
                >
                   {account.toString().slice(0,3) + '...' + account.toString().slice(39,42)}
                </button>)  :
                (<button 
                    type = 'button'
                    className='nav__connect'
                    onClick={connectHandler}
                >
                    Connect
                </button>)}
            </div>




        </nav>
    )


}

export default Navigation;
