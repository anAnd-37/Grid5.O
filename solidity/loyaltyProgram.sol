// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event TokensTransferred(address indexed from, address indexed to, uint256 amount);

}

contract LoyaltyToken is IERC20{

    struct Transaction {
        //string senderName;
        uint256 timestamp;
        address sender;
        bool receiver;
        uint256 amount;
    }

    mapping(address => Transaction[]) public userTransactions;


    string public name = "Loyalty Token";
    string public symbol = "LOYAL";
    uint8 public decimals = 18;
    uint256 private _totalSupply;
    address public tokenAddress;
    address public owner;
    uint256 public maxRedeemRequests = 200;
    uint256 public tokensPerReferral = 5;
    uint256 public totalRedeemRequests = 0;
    mapping(address => uint256) public _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    mapping(address => bool) public hasRedeemed;
    
    constructor(uint256 initialSupply) {
        _totalSupply = initialSupply * 10**uint256(decimals);
        _balances[msg.sender] = _totalSupply;
        owner = msg.sender;
        emit Transfer(address(0), msg.sender, _totalSupply);
    }
    
    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address recipient, uint256 amount) external override returns (bool) {
        require(recipient != address(0), "ERC20: transfer to the zero address");
        require(_balances[recipient] != 0, "Please register in the chain");
        require(_balances[msg.sender] < amount, "ERC20: insufficient balance");
        
        _balances[msg.sender] -= amount;
        _balances[recipient] += amount;
        //_totalSupply -= amount;
        emit Transfer(msg.sender, recipient, amount);

        Transaction memory txSender = Transaction({
                //senderName: senderName,
                timestamp: block.timestamp,
                sender: msg.sender,
                receiver: true,
                amount: amount
            });
            userTransactions[recipient].push(txSender);

        Transaction memory TxSender = Transaction({
                //senderName: senderName,
                timestamp: block.timestamp,
                sender: recipient,
                receiver: false,
                amount: amount
            });
            userTransactions[msg.sender].push(TxSender);

        return true;
    }

    function check(address a) public view returns(uint256){
        require(_balances[a] != 0, "Please register in the chain");
        return _balances[a];
    }

    function addReciepent(address addr) public{
        _balances[addr] = 11;
        _totalSupply -= 11;
    }
    
    function allowance(address owner, address spender) external view override returns (uint256) {
        return _allowances[owner][spender];
    }
    
    function approve(address spender, uint256 amount) external override returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address sender, address recipient, uint256 amount) external override returns (bool) {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        require(_balances[sender] >= amount, "ERC20: insufficient balance");
        //require(_allowances[sender][msg.sender] >= amount, "ERC20: allowance exceeded");
        
        _balances[sender] -= amount;
        _balances[recipient] += amount;
       // _allowances[sender][msg.sender] -= amount;
        emit Transfer(sender, recipient, amount);

        Transaction memory txSender = Transaction({
                //senderName: senderName,
                timestamp: block.timestamp,
                sender: sender,
                receiver: true,
                amount: amount
            });
            userTransactions[recipient].push(txSender);

        Transaction memory TxSender = Transaction({
                //senderName: senderName,
                timestamp: block.timestamp,
                sender: recipient,
                receiver: false,
                amount: amount
            });
            userTransactions[sender].push(TxSender);
        
        return true;
    }

     // Function for token issuance to users
    function issueTokens(address recipient, uint256 amount) external {
        require(msg.sender == owner, "Only owner can issue tokens");
        
        _balances[recipient] += amount;
        _totalSupply += amount;
        emit Transfer(address(0), recipient, amount);
    }

    // Function for token redemption by users
    function redeemTokens(address recipient, uint256 amount) external {
        require(_balances[recipient] >= amount, "Insufficient balance");
        require(amount > 0, "Amount must be greater than 0");

        uint256 deduction = 0;
        if (amount >= 500) {
            deduction = amount / 500;
        }
        _balances[recipient] -= deduction;
        _totalSupply += deduction;
        emit Transfer(recipient, msg.sender, deduction);
    }

    // Function to get a user's transaction history (simplified)
     function getUserTransactionHistory(address user) external view returns (Transaction[] memory) {
        return userTransactions[user];
    }
   

   function redeemReferral() external {
        require(totalRedeemRequests < maxRedeemRequests, "Redeem limit exceeded");
        require(!hasRedeemed[msg.sender], "You have already redeemed your referral");
        
        IERC20 token = IERC20(tokenAddress);
        uint256 userBalance = token.balanceOf(msg.sender);
        
        require(userBalance > 0, "You have no tokens to redeem");
        
        uint256 tokensToTransfer = tokensPerReferral;
        if (totalRedeemRequests + 1 > maxRedeemRequests) {
            tokensToTransfer = userBalance;
        } else {
            totalRedeemRequests++;
            hasRedeemed[msg.sender] = true;
        }
        
        token.transfer(msg.sender, tokensToTransfer);
        emit TokensTransferred(tokenAddress, msg.sender, tokensToTransfer);
    }

}