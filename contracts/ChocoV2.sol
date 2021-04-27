// SPDX-License-Identifier: MIT

// https://github.com/OpenZeppelin/openzeppelin-contracts

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

abstract contract Context {
    function _msgSender() internal view virtual returns (address payable) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes memory) {
        this;
        return msg.data;
    }
}

contract ERC20 is Context, IERC20 {
    using SafeMath for uint256;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 internal _totalSupply;
    string internal _name;
    string internal _symbol;
    uint8 internal _decimals;

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        require(_balances[msg.sender] >= amount, "money not enough");
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

    function allowance(address owner, address spender) public view virtual override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        _approve(_msgSender(), spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public virtual override returns (bool) {
        _transfer(sender, recipient, amount);
        _approve(sender, _msgSender(), _allowances[sender][_msgSender()].sub(amount, "ERC20: transfer amount exceeds allowance"));
        return true;
    }

    function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool) {
        _approve(_msgSender(), spender, _allowances[_msgSender()][spender].add(addedValue));
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool) {
        _approve(_msgSender(), spender, _allowances[_msgSender()][spender].sub(subtractedValue, "ERC20: decreased allowance below zero"));
        return true;
    }

    function _transfer(address sender, address recipient, uint256 amount) internal virtual {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        _beforeTokenTransfer(sender, recipient, amount);

        _balances[sender] = _balances[sender].sub(amount, "ERC20: transfer amount exceeds balance");
        _balances[recipient] = _balances[recipient].add(amount);
        emit Transfer(sender, recipient, amount);
    }

    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: mint to the zero address");

        _beforeTokenTransfer(address(0), account, amount);

        _totalSupply = _totalSupply.add(amount);
        _balances[account] = _balances[account].add(amount);
        emit Transfer(address(0), account, amount);
    }

    function _burn(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: burn from the zero address");

        _beforeTokenTransfer(account, address(0), amount);

        _balances[account] = _balances[account].sub(amount, "ERC20: burn amount exceeds balance");
        _totalSupply = _totalSupply.sub(amount);
        emit Transfer(account, address(0), amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal virtual {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _setupDecimals(uint8 decimals_) internal {
        _decimals = decimals_;
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual {}
}


contract Base {
    bool private unlocked = true;           //避免重入。有调用外部合约的时候，可以谨慎使用！
    modifier lock() {
        require(unlocked == true, '1');
        unlocked = false;
        _;
        unlocked = true;
    }

    address public adminAddress;

    function setAdmin(address _adminAddress) public onlyAdmin {
        adminAddress = _adminAddress;
    }

    modifier onlyAdmin {
        require(msg.sender == adminAddress);
        _;
    }
}

contract ChocoToken is ERC20, Base {
    using SafeMath for uint256;

    uint public totalAmount;
    uint public mintedAmount = 0;
    address public nftAddress;

    uint public pre_mint = 0;

    // pool 的额度，
    mapping(address => uint) public poolLineOf;
    // pool 的额度使用量
    mapping(address => uint) public poolAmountOf;

    constructor (address _adminAddress) {
        adminAddress = _adminAddress;
        _name = "ChocoToken";
        _symbol = "CHOCO";
        _decimals = 18;

        //总量：100000
        //空投：2000
        //矿池：64000（分两个阶段挖矿，4000+60000）
        //预留：34000
        totalAmount = 100000 * (10 ** uint(_decimals));
        // kovan
        // _mint(0x8D8B097B0C5E939e97A8fDD5116a44F10c376049, totalAmount);
        // heco ceshi
        _mint(0x1184106C3642b0035de120aDf9D48dd1a78D02e9, totalAmount);
        // heco
        // _mint(0x239C9005128DD4Fe9b0D6B31EE4A358F1CaAA4f4, totalAmount);
    }
}
