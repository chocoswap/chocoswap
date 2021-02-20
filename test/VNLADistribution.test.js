const { expectRevert, time } = require('@openzeppelin/test-helpers');
const VNLAToken = artifacts.require('VNLAToken');
const VNLADistribution = artifacts.require('VNLADistribution');
const MockERC20 = artifacts.require('MockERC20');
const toWei = web3.utils.toWei
contract('Dist', ([alice, bob, carol, dave, erin, owner]) => {
    beforeEach(async () => {
        this.vnla = await VNLAToken.new({ from: owner });
        this.lp0 = await MockERC20.new("HUSD_VNLA", "LP0", "1000", "0", {from: owner});
        this.lp1 = await MockERC20.new("VNLA", "LP1", "1000", "0", {from: owner});
    });

    it('should set correct state variables', async () => {
        this.dist = await VNLADistribution.new(
            this.vnla.address, 
            '363304501488095238', // 7500000e18 / (512 * blocksPerWeek) = (7500000000000000000000000 / 512 / 40320) = 363304501488095238.09, about 
            '1000', 
            [this.lp0.address, this.lp1.address], 
            ['3', '2'],
            { from: owner });
        await this.vnla.mint(this.dist.address, toWei('7500000', 'ether'), { from: owner });
        const vnla = await this.dist.vnla();
        const vnlaOwner = await this.vnla.owner();
        assert.equal(vnla.valueOf(), this.vnla.address);
        assert.equal(vnlaOwner.valueOf(), owner);
        assert.equal((await this.vnla.balanceOf(this.dist.address)).valueOf(), toWei('7500000', 'ether'))
    });


    context('With ERC/LP token added to the field', () => {
        beforeEach(async () => {
            this.vnla = await VNLAToken.new({ from: owner });
            this.lp0 = await MockERC20.new("HUSD_VNLA", "LP0", "1000", "0", {from: alice});
            this.lp1 = await MockERC20.new("VNLA", "LP1", "1000", "0", {from: bob});
            
        });

        it('should allow emergency withdraw', async () => {
            // 0.363304501488095238 per block farming rate starting at block 100 until block 100 + 40320 * 10
            this.dist = await VNLADistribution.new(
                this.vnla.address, 
                '363304501488095238', 
                '100', 
                [this.lp0.address, this.lp1.address], 
                ['3', '2'], 
                { from: owner });
            await this.vnla.mint(this.dist.address, toWei('7500000', 'ether'), { from: owner });
            await this.lp0.approve(this.dist.address, '1000', { from: alice });
            await this.dist.deposit(0, '100', { from: alice });
            assert.equal((await this.lp0.balanceOf(alice)).valueOf(), '900');
            await this.dist.emergencyWithdraw(0, { from: alice });
            assert.equal((await this.lp0.balanceOf(alice)).valueOf(), '1000');
        });

        it('should give out VNLAs only after farming time', async () => {
            // 0.363304501488095238 per block farming rate starting at block 100 until block 100 + 40320 * 10
            this.dist = await VNLADistribution.new(
                this.vnla.address, 
                '363304501488095238', 
                '100', 
                [this.lp0.address, this.lp1.address], 
                ['3', '2'], 
                { from: owner });
            await this.vnla.mint(this.dist.address, toWei('7500000', 'ether'), { from: owner });
            
            // await this.dist.add('100', this.lp1.address, true);
            await this.lp1.approve(this.dist.address, '1000', { from: bob });
            await this.dist.deposit(1, '100', { from: bob });
            await time.advanceBlockTo('89');
            await this.dist.deposit(1, '0', { from: bob }); // block 90
            assert.equal((await this.vnla.balanceOf(bob)).valueOf(), '0');
            await time.advanceBlockTo('94');
            await this.dist.deposit(1, '0', { from: bob }); // block 95
            assert.equal((await this.vnla.balanceOf(bob)).valueOf(), '0');
            await time.advanceBlockTo('99');
            await this.dist.deposit(1, '0', { from: bob }); // block 100
            assert.equal((await this.vnla.balanceOf(bob)).valueOf(), '0');
            await time.advanceBlockTo('100');
            await this.dist.deposit(1, '0', { from: bob }); // block 101
            // 37202380952380952371 = 363304501488095238 * 256 *2/5
            assert.equal((await this.vnla.balanceOf(bob)).toString(), '37202380952380952371');
            await time.advanceBlockTo('104');
            await this.dist.deposit(1, '0', { from: bob }); // block 105
            // 186011904761904761855 = 37202380952380952371 + 363304501488095238 * 256 * 4 *2/5
            assert.equal((await this.vnla.balanceOf(bob)).toString(), '186011904761904761855');
        });

        it('should not distribute VNLAs if no one deposit', async () => {
            // 0.363304501488095238 per block farming rate starting at block 100 until block 100 + 40320 * 10
            this.dist = await VNLADistribution.new(
                this.vnla.address, 
                '363304501488095238',
                '100', 
                [this.lp0.address, this.lp1.address], 
                ['3', '2'], 
                { from: owner });
            await this.vnla.mint(this.dist.address, toWei('7500000', 'ether'), { from: owner });
            
            await this.lp1.approve(this.dist.address, '1000', { from: bob });
            await time.advanceBlockTo('199');
            await time.advanceBlockTo('204');
            await time.advanceBlockTo('209');
            await this.dist.deposit(1, '10', { from: bob }); // block 210
            assert.equal((await this.vnla.balanceOf(bob)).toString(), '0');
            assert.equal((await this.lp1.balanceOf(bob)).toString(), '990');
            await time.advanceBlockTo('219');
            await this.dist.withdraw(1, '10', { from: bob }); // block 220
            // 372023809523809523712 = 363304501488095238 * 2 / 5 * (220 - 210) * 256
            assert.equal((await this.vnla.balanceOf(bob)).toString(), '372023809523809523712');
            assert.equal((await this.lp1.balanceOf(bob)).toString(), '1000');
        });

        // it('should distribute VNLAs properly for each staker', async () => {
        //     // 0.363304501488095238 per block farming rate starting at block 100 until block 100 + 40320 * 10
        //     this.dist = await VNLADistribution.new(
        //         this.vnla.address, 
        //         '363304501488095238',  // 4359654017857142
        //         '100', 
        //         [this.lp0.address, this.lp1.address], 
        //         ['3', '2'], 
        //         { from: owner });
        //     await this.vnla.mint(this.dist.address, toWei('7500000', 'ether'), { from: owner });

        //     await this.lp0.transfer(bob, '333', {from: alice})
        //     await this.lp0.transfer(carol, '333', {from: alice})

        //     await this.lp0.approve(this.dist.address, '333', { from: alice });
        //     await this.lp0.approve(this.dist.address, '333', { from: bob });
        //     await this.lp0.approve(this.dist.address, '333', { from: carol });
        //     // Alice deposits 10 LPs at block 310
        //     await time.advanceBlockTo('309');
        //     await this.dist.deposit(0, '10', { from: alice });
        //     // Bob deposits 20 LPs at block 314
        //     await time.advanceBlockTo('313');
        //     await this.dist.deposit(0, '20', { from: bob });
        //     // Carol deposits 30 LPs at block 318
        //     await time.advanceBlockTo('317');
        //     await this.dist.deposit(0, '30', { from: carol });
        //     // Alice deposits 10 more LPs at block 320. At this point:
        //     //   Alice should have: 
        //     // 2810846560846560292 = 4 * 256 * 4359654017857142* 4/9 + 4 * 256 * 4359654017857142 * 4/9 * 1/3+ 2 * 256 * 4359654017857142 * 4/9 * 1/6
        //     await time.advanceBlockTo('319')
        //     await this.dist.deposit(0, '10', { from: alice });
        //     // 4960317460317459340 = 4359654017857142 * 4/9 * 256 * 10
        //     assert.equal((await this.vnla.totalSupply()).toString(), '4960317460317459340');
        //     assert.equal((await this.vnla.balanceOf(alice)).toString(), '2810846560846560292');
        //     assert.equal((await this.vnla.balanceOf(bob)).toString(), '0');
        //     assert.equal((await this.vnla.balanceOf(carol)).toString(), '0');
        //     assert.equal((await this.vnla.balanceOf(this.dist.address)).toString(), '2149470899470899048');
        //     // Bob withdraws 5 LPs at block 330. At this point:
        //     //   Bob should have: 
        //     // 3070672713529855782 = 4 * 256 * 4359654017857142 * 4/9 * 2/3 + 2 * 256 * 4359654017857142 * 4/9 * 2/6 + 10 * 256 * 4359654017857142 * 4/9 * 2/7
        //     await time.advanceBlockTo('329')
        //     await this.dist.withdraw(0, '5', { from: bob });
        //     // 9920634920634918682 = 4359654017857142 * 4/9 * 256 * 20
        //     assert.equal((await this.vnla.totalSupply()).toString(), '9920634920634918682');
        //     assert.equal((await this.vnla.balanceOf(alice)).toString(), '2810846560846560292');
        //     assert.equal((await this.vnla.balanceOf(bob)).toString(), '3070672713529855782');
        //     assert.equal((await this.vnla.balanceOf(carol)).toString(), '0');
        //     assert.equal((await this.vnla.balanceOf(this.dist.address)).toString(), '4039115646258502608');
        //     // Alice withdraws 20 LPs at block 340.
        //     // Bob withdraws 15 LPs at block 350.
        //     // Carol withdraws 30 LPs at block 360.
        //     await time.advanceBlockTo('339')
        //     await this.dist.withdraw(0, '20', { from: alice });
        //     await time.advanceBlockTo('349')
        //     await this.dist.withdraw(0, '15', { from: bob });
        //     await time.advanceBlockTo('359')
        //     await this.dist.withdraw(0, '30', { from: carol });
        //     // 24801587301587296708 = 4359654017857142 * 4/9 * 256 * 50
        //     assert.equal((await this.vnla.totalSupply()).toString(), '24801587301587296708');
        //     // Alice should have: 
        //     // 5754331647188788912 = 2810846560846560292 + 4359654017857142 * 4/9 * 256 * 10 *2/7 + 4359654017857142 * 4/9 * 256 * 10 *2/6.5
        //     assert.equal((await this.vnla.balanceOf(alice)).toString(), '5754331647188788912');
        //     // Bob should have: 
        //     // 5868800511657653360 = 3070672713529855782 + 4359654017857142 * 4/9 * 256 * 10*1.5/6.5 + 4359654017857142 * 4/9 * 256 * 10*1.5/4.5
        //     assert.equal((await this.vnla.balanceOf(bob)).toString(), '5868800511657653360');
        //     // Carol should have: 
        //     // 13178455142740854435 = 256 * (4359654017857142 * 4/9 * 2*3/6 + 4359654017857142 * 4/9 * 10*3/7 + 4359654017857142 * 4/9 * 10*3/6.5+ 4359654017857142 * 4/9 * 10*3/4.5 + 4359654017857142 * 4/9 * 10)
        //     assert.equal((await this.vnla.balanceOf(carol)).toString(), '13178455142740854435');
        //     // All of them should have 1000 LPs back.
        //     assert.equal((await this.lp0.balanceOf(alice)).toString(), '334');
        //     assert.equal((await this.lp0.balanceOf(bob)).toString(), '333');
        //     assert.equal((await this.lp0.balanceOf(carol)).toString(), '333');
        // });

        // it('should give proper VNLAs allocation to each pool', async () => {
        //     // 100 per block farming rate starting at block 100 until block 100 + 40320 * 10
        //     this.dist = await VNLADistribution.new(
        //         this.vnla.address, 
        //         '4359654017857142', 
        //         '100', 
        //         [this.lp0.address, this.lp1.address, this.lp2.address], 
        //         ['4', '3', '2'], 
        //         { from: owner });
        //     await this.vnla.transferOwnership(this.dist.address, { from: owner });

        //     await this.lp0.approve(this.dist.address, '1000', { from: alice });
        //     await this.lp1.approve(this.dist.address, '1000', { from: bob });
        //     // Alice deposits 10 LPs at block 410
        //     await time.advanceBlockTo('409');
        //     await this.dist.deposit(0, '10', { from: alice });
        //     await time.advanceBlockTo('419');
        //     let multiplier = await this.dist.getMultiplier('410', '420')
        //     console.log('multiplier = ', multiplier.toString())
        //     // Alice should have 9*4359654017857142*4/9*256 = 4464285714285713408 pending reward
        //     assert.equal((await this.dist.pendingVnla(0, alice)).toString(), '4464285714285713408');
        //     // Bob deposits 5 LP1s at block 425
        //     await time.advanceBlockTo('424');
        //     await this.dist.deposit(1, '5', { from: bob });
        //     // Alice should have 15*4359654017857142*4/9*256 = 7440476190476189013 pending reward
        //     assert.equal((await this.dist.pendingVnla(0, alice)).toString(), '7440476190476189013');
        //     await time.advanceBlockTo('430');
        //     // At block 430. Alice should get 20*4359654017857142*4/9*256 = 9920634920634918684
        //     // At block 430. Bob should get 5*4359654017857142*3/9*256 = 1860119047619047253
        //     assert.equal((await this.dist.pendingVnla(0, alice)).toString(), '9920634920634918684');
        //     assert.equal((await this.dist.pendingVnla(1, bob)).toString(), '1860119047619047253');
        // });
        // it ('should have correct reward per block', async() => {
        //      // 100 per block farming rate starting at block 100 until block 100 + 40320 * 10
        //      this.dist = await VNLADistribution.new(
        //         this.vnla.address, 
        //         '4359654017857142', 
        //         '100', 
        //         [this.lp0.address, this.lp1.address, this.lp2.address], 
        //         ['4', '3', '2'], 
        //         { from: owner });
        //     await this.vnla.transferOwnership(this.dist.address, { from: owner });
            
        //     let rpb = await this.dist.rewardPerBlock();
        //     assert.equal(rpb.toString(), '1116071428571428352')

        // });
        // it('should stop giving bonus VNLAs after the bonus period ends', async () => {
        //     // 100 per block farming rate starting at block 100 until block 100 + 40320 * 10
        //     this.dist = await VNLADistribution.new(
        //         this.vnla.address, 
        //         '4359654017857142', 
        //         '100', 
        //         [this.lp0.address, this.lp1.address, this.lp2.address], 
        //         ['4', '3', '2'], 
        //         { from: owner });
        //     await this.vnla.transferOwnership(this.dist.address, { from: owner });

        //     await this.lp0.approve(this.dist.address, '1000', { from: alice });
        //     // Alice deposits 10 LPs at block 590
        //     await time.advanceBlockTo('589');
        //     await this.dist.deposit(0, '10', { from: alice });
        //     // At block 100 + 40320 = 40420 , she should have 256 * 40320 * 4359654017857142 * 4/9 = 19999999999999996067840 pending.
        //     await time.advanceBlockTo('403300');
        //     assert.equal((await this.dist.pendingVnla(0, alice)).valueOf(), '19999999999999996067840');
        //     // At block 403301, Alice withdraws all pending rewards and should get 10600.
        //     await this.dist.deposit(0, '0', { from: alice });
        //     assert.equal((await this.dist.pendingVnla(0, alice)).valueOf(), '0');
        //     assert.equal((await this.vnla.balanceOf(alice)).valueOf(), '403300');
        // });
    });
});
