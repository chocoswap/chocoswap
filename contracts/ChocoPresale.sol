pragma solidity 0.6.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
contract ChocoPresale is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    string private _name;
    string private _symbol;
    uint8 private _decimals;
    uint256 private _totalSupply;
    mapping (address => uint256) private _balances;

    uint256 public phaseIQ = 800e22;
    uint256 public phaseIIQ = 2675e22;
    uint256 public phaseIR = 8000;
    uint256 public phaseIIR = 6250;

    uint256 public duration = 4 weeks;
    uint256 public preSaleStart = uint256(-1);

    address payable public ethReceiver = 0xDaBB2Fa102B48b4bC94746df6eF4e55324B7927f;

    event OnEtherReceived(address indexed user, uint256 etherAmt, uint256 tokenAmt);
    /**
     * @dev Sets the values for {name} and {symbol}, initializes {decimals} with
     * a default value of 18.
     *
     * To select a different value for {decimals}, use {_setupDecimals}.
     *
     * All three of these values are immutable: they can only be set once during
     * construction.
     */
    constructor (string memory name, string memory symbol) public {
        _name = name;
        _symbol = symbol;
        _decimals = 18;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view returns (string memory) {
        return _symbol;
    }

    
    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5,05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the value {ERC20} uses, unless {_setupDecimals} is
     * called.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view returns (uint8) {
        return _decimals;
    }

    /**
     * @dev See {IERC20-totalSupply}.
     */
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev See {IERC20-balanceOf}.
     */
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function setPreSaleStart(uint256 _startTime) public onlyOwner {
        preSaleStart = _startTime;
    }
    
    function withdraw() public {
        ethReceiver.transfer(address(this).balance);
    }
    
    receive () external payable nonReentrant {
        onEtherReceived();
    }

    // 0: not started, 1: phase I, 2: phase II, 3: ended
    function preSalePhase() public view returns (uint256) {
        uint256 now_ = block.timestamp;
        if (now_ < preSaleStart) {
            return 0;
        }
        if (now_ > preSaleStart.add(2 * duration) || _totalSupply >= phaseIIQ) {
            return 3;
        }
        return _totalSupply >= phaseIQ || now_ > preSaleStart.add(duration) ? 2 : 1;
    }
    function onEtherReceived() internal {
        uint256 receivedEther = msg.value;
        address buyer = msg.sender;
        uint256 phase = preSalePhase();
        require(phase == 1 || phase == 2, "preSale not started or ended");
        uint256 amount;
        if (phase == 1) {
            amount = phaseIR.mul(receivedEther);
            if (amount.add(_totalSupply) > phaseIQ) {
                uint256 leftQ = phaseIQ.sub(_totalSupply);
                // here we assume receivedEther is not enough to buy all the phase II choco tokens
                amount = receivedEther.sub(leftQ.div(phaseIR)).mul(phaseIIR).add(leftQ);
            }
        } else {
            amount = phaseIIR.mul(receivedEther);
            if (amount.add(_totalSupply) > phaseIIQ) {
                amount = phaseIIQ.sub(_totalSupply);
                receivedEther = receivedEther.sub(amount.div(phaseIIR));
                msg.sender.transfer(receivedEther);
                
            }
        }
        // forward ether to etherReceiver
        ethReceiver.transfer(receivedEther);
        _totalSupply = _totalSupply.add(amount);
        // update buyer's balance
        _balances[buyer] = _balances[buyer].add(amount);
        emit OnEtherReceived(buyer, receivedEther, amount);
    }
    
}