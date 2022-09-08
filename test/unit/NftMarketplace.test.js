const { assert, expect } = require("chai");
const { network, deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Nft Marketplace Tests", function () {
          let nftMarketplace, basicNft, deployer, player;
          const PRICE = ethers.utils.parseEther("0.1");
          const TOKEN_ID = 0;
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer;
              //player = (await getNamedAccounts()).player;// you can get player and deployer using getNamedAccounts
              const accounts = await ethers.getSigners(); //  or using ether.getSigners
              player = accounts[1];
              await deployments.fixture(["all"]);

              nftMarketplace = await ethers.getContract("NftMarketplace");

              basicNft = await ethers.getContract("BasicNft");
              await basicNft.mintNft();
              await basicNft.approve(nftMarketplace.address, TOKEN_ID);
          });

          describe("list item", function () {
              it("emits an event after listing an item", async function () {
                  expect(await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.emit(
                      "ItemListed"
                  );
              });
              it("reverts when price isn't above 0 ", async function () {
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, 0)
                  ).to.be.revertedWith("NftMarketplace__PriceMustBeAboveZero");
              });
              it("reverts while listing without approval", async function () {
                  await basicNft.mintNft(); //
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID + 1, PRICE)
                  ).to.be.revertedWith("NftMarketplace__NotApprovedForMarketplace");
              });
              it("updates listing with seller and price", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
                  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID);
                  assert(listing.price.toString() == PRICE.toString());
                  assert(listing.seller.toString() == deployer);
              });
              it("reverts when tou try to list item twice", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketplace__AlreadyListed");
              });
              it("reverts when not owner tries to list an item", async function () {
                  const playerConnectedNftMarketplace = nftMarketplace.connect(player);
                  await basicNft.approve(playerConnectedNftMarketplace.address, TOKEN_ID);
                  await expect(
                      playerConnectedNftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketplace__NotOwner");
              });
          });

          //   it("lists and can be bought", async function () {
          //       await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
          //       const playerConnectedNftMarketplace = nftMarketplace.connect(player);
          //       await playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
          //           value: PRICE,
          //       });
          //       const newOwner = await basicNft.ownerOf(TOKEN_ID);
          //       const deployerProceeds = await nftMarketplace.getProceeds(deployer);
          //       assert(newOwner.toString() == player.address);
          //       assert(deployerProceeds.toString() == PRICE.toString());
          //   });
      });
