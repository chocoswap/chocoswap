pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract ChocoToken is ERC20("Choco Swap", "Choco") {
    // address constant public preSale = 0x2408c20608d819ebEE26653B272579dCb196C0e9;
    // address constant  dev = 0xCf4c701f361BC94421F7734723f8Cb08baE63783;
    // address constant  tradeMining = 0xE101110384203a9aBb3d4A9BcFCF1Fecc2e1E411;
    constructor(address preSale, address dev, address tradeMining) public {
        _mint(preSale, 1e24);
        _mint(dev, 1e24);
        _mint(tradeMining, 8e24);
    }
}