const { expectRevert, time } = require('@openzeppelin/test-helpers');
const expectEvent = require('@openzeppelin/test-helpers/src/expectEvent');
const Choco = artifacts.require('ChocoToken');
const ChocoPresale = artifacts.require('ChocoPresale');

contract('Presale', ([alice, bob, carol, psaddr, devaddr, tmaddr, owner, deployer]) => {
    beforeEach(async () => {
        this.choco = await Choco.new(psaddr, devaddr, tmaddr, { from: deployer });
        
    });
    
    it('should set correct state variables', async () => {
        assert.equal((await this.choco.balanceOf(psaddr)).toString(),   '1000000000000000000000000')
        assert.equal((await this.choco.balanceOf(devaddr)).toString(),  '1000000000000000000000000')
        assert.equal((await this.choco.balanceOf(tmaddr)).toString(),   '8000000000000000000000000')
        // console.log( web3.eth.abi.encodeParameters(['string', 'string'], ["Choco PreSale Token", 'CPT']))
    });

    it('should allow owner and only owner to set presale start time', async () => {
        this.cp = await ChocoPresale.new("Proof of Choco Token", "pChoc", {from: owner})

        assert.equal((await this.cp.owner()).valueOf(), owner);
        assert.equal((await this.cp.preSalePhase()).toString(), '0')

        await expectRevert(this.cp.setPreSaleStart('1604056967', { from: alice }), 'Ownable: caller is not the owner');
        this.cp.setPreSaleStart('1604056967', { from: owner })
    })

    it('should receive ether correctly', async () => {
        this.cp = await ChocoPresale.new("Proof of Choco Token", "pChoc", {from: owner})
        this.cp.setPreSaleStart('1604056967', { from: owner })
        assert.equal((await this.cp.preSalePhase()).toString(), '1')

        let b1 = await web3.eth.getBalance('0xDaBB2Fa102B48b4bC94746df6eF4e55324B7927f');
        await web3.eth.sendTransaction({from: alice, to: this.cp.address, value: web3.utils.toWei(`0.1`, 'ether'), gas: '100000'});
        assert.equal((await this.cp.balanceOf(alice)).toString(), '800000000000000000000')

        let b2 = await web3.eth.getBalance('0xDaBB2Fa102B48b4bC94746df6eF4e55324B7927f');
        let etherInc = b2 - b1;
        assert.equal(etherInc.toString(), web3.utils.toWei(`0.1`, 'ether').toString());
    })
});
