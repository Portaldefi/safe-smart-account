import { expect } from "chai";
import { deployments, ethers } from "hardhat";
import { getSafe } from "../utils/setup";

describe("OwnerManager", () => {
    const setupTests = deployments.createFixture(async ({ deployments }) => {
        await deployments.fixture();
        const signers = await ethers.getSigners();
        const [user1] = signers;
        return {
            safe: await getSafe({ owners: [user1.address] }),
            signers,
        };
    });

    describe("updateOwners", () => {
        it("can only be called by current owner", async () => {
            const {
                safe,
                signers: [, user2],
            } = await setupTests();

            const nonce = await safe.ownersNonce();
            const newOwners = [user2.address];
            const newThreshold = 1;

            const hash = ethers.solidityPackedKeccak256(["uint256", "uint256", "address[]"], [nonce, newThreshold, newOwners]);
            const signature = await user2.signMessage(ethers.getBytes(hash));

            await expect(safe.connect(user2).updateOwners(newThreshold, newOwners, signature)).to.be.revertedWith("GS505");
        });

        it("cannot update with empty owners list", async () => {
            const {
                safe,
                signers: [user1],
            } = await setupTests();

            const nonce = await safe.ownersNonce();
            const newOwners: string[] = [];
            const newThreshold = 1;

            const hash = ethers.solidityPackedKeccak256(["uint256", "uint256", "address[]"], [nonce, newThreshold, newOwners]);
            const signature = await user1.signMessage(ethers.getBytes(hash));

            await expect(safe.connect(user1).updateOwners(newThreshold, newOwners, signature)).to.be.revertedWith("GS506");
        });

        it("cannot update with invalid threshold", async () => {
            const {
                safe,
                signers: [user1, user2, user3],
            } = await setupTests();

            const nonce = await safe.ownersNonce();
            const newOwners = [user3.address, user2.address]; // Unsorted
            const newThreshold = 11;

            const hash = ethers.solidityPackedKeccak256(["uint256", "uint256", "address[]"], [nonce, newThreshold, newOwners]);
            const signature = await user1.signMessage(ethers.getBytes(hash));

            await expect(safe.connect(user1).updateOwners(newThreshold, newOwners, signature)).to.be.revertedWith("GS507");
        });

        it("updates owners when threshold of approvals reached", async () => {
            const {
                safe,
                signers: [user1, user2, user3],
            } = await setupTests();

            const nonce = await safe.ownersNonce();
            const newOwners = [user2.address, user3.address].sort();
            const newThreshold = 2;

            const hash = ethers.solidityPackedKeccak256(["uint256", "uint256", "address[]"], [nonce, newThreshold, newOwners]);
            const signature = await user1.signMessage(ethers.getBytes(hash));

            // First approval
            await expect(safe.connect(user1).updateOwners(newThreshold, newOwners, signature))
                .to.emit(safe, "UpdatedOwners")
                .withArgs(newOwners, newThreshold);

            // Verify new state
            expect(await safe.getThreshold()).to.equal(newThreshold);
            expect(await safe.getOwners()).to.deep.equal(newOwners);
            expect(await safe.isOwner(user1.address)).to.be.false;
            expect(await safe.isOwner(user2.address)).to.be.true;
            expect(await safe.isOwner(user3.address)).to.be.true;
        });

        it("increments nonce after successful update", async () => {
            const {
                safe,
                signers: [user1, user2],
            } = await setupTests();

            const initialNonce = await safe.ownersNonce();
            const newOwners = [user2.address].sort();
            const newThreshold = 1;

            const hash = ethers.solidityPackedKeccak256(["uint256", "uint256", "address[]"], [initialNonce, newThreshold, newOwners]);
            const signature = await user1.signMessage(ethers.getBytes(hash));

            await safe.connect(user1).updateOwners(newThreshold, newOwners, signature);

            expect(await safe.ownersNonce()).to.equal(initialNonce + 1n);
        });
    });
});
