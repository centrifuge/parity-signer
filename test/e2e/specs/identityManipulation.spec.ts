// Copyright 2015-2020 Parity Technologies (UK) Ltd.
// This file is part of Parity.

// Parity is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Parity is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Parity.  If not, see <http://www.gnu.org/licenses/>.

import { by, element } from 'detox';

import testIDs from 'e2e/testIDs';
import {
	tapBack,
	testExist,
	testInput,
	testNotExist,
	testNotVisible,
	testScrollAndTap,
	testTap,
	testUnlockPin,
	testVisible,
	testSetUpDefaultPath,
	pinCode
} from 'e2e/utils';
import {
	ETHEREUM_NETWORK_LIST,
	EthereumNetworkKeys
} from 'constants/networkSpecs';

const {
	Main,
	IdentitiesSwitch,
	IdentityManagement,
	IdentityNew,
	IdentityBackup,
	PathDerivation,
	PathDetail,
	PathsList
} = testIDs;

const defaultPath = '//default';
const childPath = '/funding';
const customPath = '//sunny_day/1';
const secondPath = '/2';
const ethereumButtonIndex =
	ETHEREUM_NETWORK_LIST[EthereumNetworkKeys.FRONTIER].ethereumChainId;

describe('Load test', () => {
	it('create a new identity with default substrate account', async () => {
		await testTap(Main.createButton);
		await testNotVisible(IdentityNew.seedInput);
		await testTap(IdentityNew.createButton);
		await testVisible(IdentityBackup.seedText);
		await testTap(IdentityBackup.nextButton);
		await element(by.text('Proceed')).tap();
		await testSetUpDefaultPath();
	});

	it('derive a new account from the path list', async () => {
		await testTap(PathsList.deriveButton);
		await testInput(PathDerivation.pathInput, defaultPath);
		await testInput(PathDerivation.nameInput, 'default');
		await element(by.text('Done')).tap();
		await testExist(PathsList.pathCard + `//kusama${defaultPath}`);
	});

	it('derive a new account from the derived account', async () => {
		await testTap(PathsList.pathCard + `//kusama${defaultPath}`);
		await testTap(PathDetail.deriveButton);
		await testInput(PathDerivation.pathInput, childPath);
		await testInput(PathDerivation.nameInput, 'child');
		await element(by.text('Done')).tap();
		await testExist(PathsList.pathCard + `//kusama${defaultPath}${childPath}`);
	});

	it('need pin after application go to the background', async () => {
		await device.sendToHome();
		await device.launchApp({ newInstance: false });
		await tapBack();
		await testTap(PathsList.deriveButton);
		await testUnlockPin(pinCode);
		await testInput(PathDerivation.pathInput, secondPath);
		await testInput(PathDerivation.nameInput, 'second');
		await element(by.text('Done')).tap();
		await testExist(PathsList.pathCard + `//kusama${secondPath}`);
	});

	it('is able to create custom path', async () => {
		await tapBack();
		await testTap(Main.addNewNetworkButton);
		await testTap(Main.addCustomNetworkButton);
		await testInput(PathDerivation.pathInput, customPath);
		await testInput(PathDerivation.nameInput, 'custom');
		await element(by.text('Done')).tap();
		await testVisible(Main.chooserScreen);
	});

	it('delete a path', async () => {
		await testTap(Main.backButton);
		await testTap(Main.networkButton + 'kusama');
		await testTap(PathsList.pathCard + `//kusama${defaultPath}`);
		await testTap(PathDetail.popupMenuButton);
		await testTap(PathDetail.deleteButton);
		await element(by.text('Delete')).tap();
		await testNotExist(PathsList.pathCard + `//kusama${defaultPath}`);
	});

	it('is able to create ethereum account', async () => {
		await tapBack();
		const ethereumNetworkButtonIndex =
			Main.networkButton + EthereumNetworkKeys.FRONTIER;
		await testTap(testIDs.Main.addNewNetworkButton);
		await testScrollAndTap(
			ethereumNetworkButtonIndex,
			testIDs.Main.chooserScreen
		);
		await testVisible(PathDetail.screen);
		await tapBack();
		await testExist(Main.chooserScreen);
	});

	it('is able to delete it', async () => {
		await testTap(Main.networkButton + ethereumButtonIndex);
		await testVisible(PathDetail.screen);
		await testTap(PathDetail.popupMenuButton);
		await testTap(PathDetail.deleteButton);
		await element(by.text('Delete')).tap();
		await testNotExist(Main.networkButton + ethereumButtonIndex);
	});

	it('delete identity', async () => {
		await element(by.id(IdentitiesSwitch.toggleButton)).atIndex(0).tap();
		await testTap(IdentitiesSwitch.manageIdentityButton);
		await testTap(IdentityManagement.popupMenuButton);
		await testTap(IdentityManagement.deleteButton);
		await element(by.text('Delete')).tap();
		await testUnlockPin(pinCode);
		await testVisible(Main.noAccountScreen);
	});
});
