// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

import "./ERC721Full.sol";

contract DragonBallToken is ERC721Full {
    constructor() public ERC721Full("Dragon Ball Token", "DBZ") {}

    function mint(address _to, string memory _tokenURI) public returns (bool) {
        uint _tokenId = totalSupply().add(1);
        _mint(_to, _tokenId);
        _setTokenURI(_tokenId, _tokenURI);
        return true;
    }
}
