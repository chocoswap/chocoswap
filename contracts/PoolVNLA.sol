// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/Math.sol";

// VNLA接口 含质押 赎回 余额等
contract VNLATokenWrapper {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    IERC20 internal VNLA;
    IERC20 internal bToken;
    address internal admin;

    //避免重入。有调用外部合约的时候，可以谨慎使用！
    bool private unlocked = true;

    modifier onlyAdmin {
        require(msg.sender == admin, "101");
        _;
    }

    modifier lock() {
        require(unlocked == true, '100');
        unlocked = false;
        _;
        unlocked = true;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function stake(uint256 amount) public virtual {
        _totalSupply = _totalSupply.add(amount);
        _balances[msg.sender] = _balances[msg.sender].add(amount);
        VNLA.safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 amount) public virtual {
        _totalSupply = _totalSupply.sub(amount);
        _balances[msg.sender] = _balances[msg.sender].sub(amount);
        VNLA.safeTransfer(msg.sender, amount);
    }
}

contract VNLAMintReward is VNLATokenWrapper {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // 开始时间 北京时间4月26日20时
    //todo
    uint public constant startTime = 1619438400;
    // uint public constant startTime = 1618920000;
    // 结束时间 北京时间5月5日20时
    uint256 public constant endTime = 1620302400;

    uint256 public constant DURATION = endTime - startTime;
    uint256 public constant INIT_REWARD = 4000 * 1e18;
    uint256 public constant REWARD_RATE = INIT_REWARD / DURATION; // 矿池每秒释放数

    uint256 public lastUpdateTime; // 上次计算每股收益时间
    uint256 public rewardPerTokenStored; // 当前每股收益
    mapping(address => uint256) public userRewardPerTokenPaid; // 玩家上次计算每股收益值
    mapping(address => uint256) public rewards; // 玩家待领取收益
    mapping(address => uint256) public gotRewards; // 玩家已领取收益

    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);

    constructor(address _admin, address _vnla, address _btoken) {
        admin = _admin;
        VNLA = IERC20(_vnla);
        bToken = IERC20(_btoken);
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return Math.min(block.timestamp, endTime);
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalSupply() == 0) {
            return rewardPerTokenStored;
        }
        return
        rewardPerTokenStored.add(lastTimeRewardApplicable()
        .sub(lastUpdateTime)
        .mul(REWARD_RATE)
        .mul(1e18) // todo
            .div(totalSupply())
        );
    }

    function earned(address account) public view returns (uint256) {
        return
        balanceOf(account)
        .mul(rewardPerToken().sub(userRewardPerTokenPaid[account]))
        .div(1e18) // todo
        .add(rewards[account]);
    }

    function stake(uint256 amount) public lock override updateReward(msg.sender) checkStart {
        require(block.timestamp < startTime + DURATION, "out date....");
        require(block.timestamp >= startTime, "not starting");
        require(amount > 0, "Cannot stake 0");
        super.stake(amount);
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) public lock override updateReward(msg.sender) checkStart {
        require(amount > 0, "Cannot withdraw 0");
        super.withdraw(amount);
        emit Withdrawn(msg.sender, amount);
    }

    function getReward() public updateReward(msg.sender) checkStart {
        uint256 reward = earned(msg.sender);
        if (reward > 0) {
            rewards[msg.sender] = 0;
            bToken.safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    modifier checkStart(){
        require(block.timestamp > startTime, "not start");
        _;
    }
}
