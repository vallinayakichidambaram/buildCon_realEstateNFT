//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Escrow {

    //Functions to receive ether

    //msg.data must be empty
    receive() external payable{}
    //msg.data must have value
    fallback() external payable{}


    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    address payable public nftAddress;
    address payable public seller;
    address public inspector;
    address public lender;



    mapping (uint256 => bool) public isListed;
    mapping (uint256 => uint256) public purchasePrice;
    mapping (uint256 => uint256) public escrowAmount;
    mapping (uint256 => address) public buyer;
    mapping (uint256 => bool) public inspectionStatus;
    mapping (uint256 => mapping (address => bool)) public approval;


    modifier onlySeller() {

        require(msg.sender == seller, 'Only Seller can call this method');
        _;
    }

    modifier onlyBuyer(uint256 _nftID) {

        require(msg.sender == buyer[_nftID],'Only Buyer can call this method');
        _;
    }

    modifier onlyInspector() {
        require(msg.sender == inspector,'Only Inspector can call this method');
        _;        
    }

    constructor
    (address payable _nftAddress,
    address payable _seller,
    address _inspector,
    address _lender)
    {
        nftAddress = _nftAddress;
        seller = _seller;
        inspector = _inspector;
        lender = _lender;
    }


    //Listing property for Sale
    //Only seller can call this method
    function listProperty(
        uint256 _nftID,
        address _buyer, 
        uint256 _purchasePrice, 
        uint256 _escrowAmount
        ) public payable onlySeller{

        IERC721(nftAddress).transferFrom(msg.sender,address(this),_nftID);
        isListed[_nftID] = true;
        purchasePrice[_nftID] = _purchasePrice;
        buyer[_nftID] = _buyer;
        escrowAmount[_nftID] = _escrowAmount;

    }

    

    //Buyer deposits escrow amount on calling this method
    function depositEscrowAmount(
        uint _nftID)
    public payable onlyBuyer(_nftID) {

        require(msg.value == escrowAmount[_nftID]);

    }

    //Update the Inspection status of the property
    //This method can be called only by the inspector
    function approveInspectionStatus (
        uint256 _nftID,
        bool _inspectionStatus
        ) public onlyInspector {
        inspectionStatus[_nftID] = _inspectionStatus;
    }


     //Handle Deposit amount sent by buyer
    function intiatePayment (
        uint256 _nftID
        ) public payable {
        if(inspectionStatus[_nftID] == true) {
            //Send the escrow amount to seller
            payable(seller).transfer(escrowAmount[_nftID]);

        } else {
            //Inspection failed
            //Send the escrow amount back to buyer
            payable(buyer[_nftID]).transfer(escrowAmount[_nftID]);
        }
    }


    //Function to approve the sale of property
    function approveSale(
        uint256 _nftID
        ) public {

        approval [_nftID][msg.sender] = true;

    }
    //Finalize Sale
    function transferProperty (
        uint256 _nftID
        ) public payable {
        require(inspectionStatus[_nftID]);
        require(approval[_nftID][buyer[_nftID]]);
        require(approval[_nftID][seller]);
        require(approval[_nftID][lender]);
        require(address(this).balance >= purchasePrice[_nftID]);
        isListed[_nftID] = false;

        (bool success, ) = payable(seller).call{value: purchasePrice[_nftID]}("");
        require(success);

        IERC721(nftAddress).transferFrom(address(this), buyer[_nftID],_nftID);


    }

   
}
