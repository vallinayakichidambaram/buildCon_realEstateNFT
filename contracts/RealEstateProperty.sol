//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract RealEstateProperty is ERC721URIStorage{

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() ERC721("RealEstateProp", "Prop") {}

       function mintProp(string memory tokenURI) public returns (uint256) {
        _tokenIds.increment();

        uint256 newPropId = _tokenIds.current();
        _mint(msg.sender, newPropId);
        _setTokenURI(newPropId, tokenURI);

        return newPropId;
    } 

    function totalSupply() public view returns(uint256) {
        return _tokenIds.current();
    }




}
