const BN = require("bn.js");
const { accessSync } = require("fs");
const ChocoToken = artifacts.require("ChocoToken.sol");
const ChocoPresale = artifacts.require("ChocoPresale.sol");
const erc20_0 = artifacts.require("MockERC20.sol");
const erc20_1 = artifacts.require("MockERC20.sol");
const erc20_2 = artifacts.require("MockERC20.sol");
const VNLA = artifacts.require("VNLAToken.sol");
const VNLADistribution = artifacts.require("VNLADistribution.sol");



module.exports = async function (deployer, network, accounts) {

    //   return 
    console.log('accounts[0] = ', accounts[0])
    console.log('network = ', network)
    let lp0, lp1, lp2, vnla;
    let choco, chocops;
    if (network == 'development') {
        await deployer.deploy(erc20_0, "LP0", "LP0", '100000000000000000000000000', 18, { from: accounts[0] });
        lp0 = await erc20_0.deployed();
        await deployer.deploy(erc20_1, "LP1", "LP1", '100000000000000000000000000', 18, { from: accounts[0] });
        lp1 = await erc20_1.deployed();
        await deployer.deploy(erc20_2, "LP2", "LP2", '100000000000000000000000000', 18, { from: accounts[0] });
        lp2 = await erc20_2.deployed();
        await deployer.deploy(VNLA, { from: accounts[0] })
        vnla = await VNLA.deployed();

    } else if (network == 'ropsten') {
        const fs = require('fs');
        const path = require("path");
        let config = { PRE_ADDRESS: "", DEV_ADDRESS: "", TM_ADDRESS: "" };
        if (fs.existsSync(path.join(__dirname, "../config.js"))) {
            config = require("../config.js");
        }
        console.log("presale address = ", config.PRE_ADDRESS)
        //   first deploy Choco
        await deployer.deploy(ChocoToken, config.PRE_ADDRESS, config.DEV_ADDRESS, config.TM_ADDRESS, { from: accounts[0] });
        choco = await ChocoToken.deployed();
        // then deploy choco presale contract
        await deployer.deploy(ChocoPresale, "Choco PreSale Token", "CPT", { from: accounts[1] });
        chocops = await ChocoPresale.deployed();


        const Factory = artifacts.require("IUniswapV2Factory.sol");
        const Pair = artifacts.require("IUniswapV2Pair.sol");
        const factory = await Factory.at("0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f");
        const usdt = await erc20_0.at("0x516de3a7A567d81737e3a46ec4FF9cFD1fcb0136");
        lp0 = await Pair.at((await factory.createPair(usdt.address, choco.address)).logs[0].args.pair);
        // lp0 = await erc20_0.at(usdt_choco_lp0.address)

        await deployer.deploy(VNLA, { from: accounts[0] })
        vnla = await VNLA.deployed();
        lp1 = await Pair.at((await factory.createPair(usdt.address, vnla.address)).logs[0].args.pair);

        lp2 = await Pair.at("0x1BF39399FC3cDb6ace84466f066Bddb110A040a8");
        
    } else {
        return 
    }
    

    let bknum = await web3.eth.getBlock("latest");
    console.log('bk num', bknum.number)
    let curBk = new BN(bknum.number);
    curBk = curBk.add(new BN('1000'))
    await deployer.deploy(VNLADistribution, vnla.address, '4359654017857142', curBk, [lp0.address, lp1.address, lp2.address], [4, 3, 2], { from: accounts[0] })
    const vnlaDist = await VNLADistribution.deployed();
    await vnla.transferOwnership(vnlaDist.address, { from: accounts[0] });

    console.log("lp0.address     = ", lp0.address);
    console.log("lp1.address     = ", lp1.address);
    console.log("lp2.address     = ", lp2.address);

    console.log("vnla.address     = ", vnla.address)
    console.log("vnlaDist.address = ", vnlaDist.address)

    await lp0.approve(vnlaDist.address, '115792089237316195423570985008687907853269984665640564039457584007913129639935', { from: accounts[0] })
    await lp1.approve(vnlaDist.address, '115792089237316195423570985008687907853269984665640564039457584007913129639935', { from: accounts[0] })
    await lp2.approve(vnlaDist.address, '115792089237316195423570985008687907853269984665640564039457584007913129639935', { from: accounts[0] })

    const saver = require("../save_address.js");
    saver("VNLA_Migrate", {
        LP0_Addr: lp0.address,
        LP1_Addr: lp1.address,
        LP2_Addr: lp2.address,
        Choco_Addr: choco == null ? "" : choco.address,
        Choco_PreSale: chocops == null ? "" : chocops.address,
        VNLA_Addr: vnla.address,
        VNLADistribution_Addr: vnlaDist.address,
    });
};
