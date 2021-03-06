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

import {
	deserializeIdentities,
	getExistedNetworkKeys,
	getNetworkKeyByPath,
	getPathName,
	getPathsWithSubstrateNetworkKey,
	groupPaths,
	isSubstrateHardDerivedPath,
	serializeIdentities
} from 'utils/identitiesUtils';
import {
	EthereumNetworkKeys,
	SubstrateNetworkKeys,
	UnknownNetworkKeys
} from 'constants/networkSpecs';

const raw = [
	{
		address: 'addressDefault',
		expectName: 'default',
		isKusamaPath: true,
		name: '',
		path: '//kusama//default'
	},
	{
		address: 'address1',
		expectName: 'funding account1',
		isKusamaPath: true,
		name: 'funding account1',
		path: '//kusama//funding/1'
	},
	{
		address: 'address3',
		expectName: 'softKey1',
		isKusamaPath: true,
		name: '',
		path: '//kusama/softKey1'
	},
	{
		address: 'address2',
		expectName: 'funding2',
		isKusamaPath: true,
		name: '',
		networkPathId: 'westend',
		path: '//kusama//funding/2'
	},
	{
		address: 'address4',
		expectName: 'staking1',
		isKusamaPath: true,
		name: '',
		path: '//kusama//staking/1'
	},
	{
		address: 'address5',
		expectName: 'default',
		name: '',
		path: '//polkadot_test//default'
	},
	{
		address: 'address6',
		expectName: 'No name',
		name: '',
		path: '1'
	},
	{
		address: 'addressKusamaRoot',
		expectName: 'kusama',
		isKusamaPath: true,
		name: '',
		path: '//kusama'
	},
	{
		address: 'addressRoot',
		expectName: 'Identity root',
		name: '',
		path: ''
	},
	{
		address: 'addressCustom',
		expectName: 'CustomName',
		name: 'CustomName',
		path: '//custom'
	},
	{
		address: 'addressKusamaSoft',
		expectName: 'kusama',
		name: '',
		path: '/kusama'
	},
	{
		address: 'softAddress',
		expectName: '1',
		name: '',
		path: '/kusama/1'
	},
	{
		address: 'softAddress2',
		expectName: '1',
		name: '',
		path: '/polkadot_test/1'
	},
	{
		address: 'polkadotReservedAddress',
		expectName: 'reserved',
		name: '',
		path: '//polkadot//reserved'
	}
];
const expectNames = raw.map(v => v.expectName);
const paths = raw.map(v => v.path);
const kusamaPaths = raw.filter(v => v.isKusamaPath).map(v => v.path);
const metaMap = raw.reduce((acc, v) => {
	const meta = {
		address: v.address,
		createdAt: 1573142786972,
		name: v.name,
		networkPathId: v.networkPathId,
		updatedAt: 1573142786972
	};
	acc.set(v.path, meta);
	return acc;
}, new Map());
const addressesMap = raw.reduce((acc, v) => {
	acc.set(v.address, v.path);
	return acc;
}, new Map());

const testIdentities = [
	{
		addresses: addressesMap,
		derivationPassword: '',
		encryptedSeed: 'yyyy',
		meta: metaMap,
		name: 'identity1'
	},
	{
		addresses: addressesMap,
		derivationPassword: '',
		encryptedSeed: 'xxxx',
		meta: metaMap,
		name: 'identity2'
	}
];

describe('IdentitiesUtils', () => {
	it('works with serialize and deserialize', () => {
		const serializedJson = serializeIdentities(testIdentities);
		const originItem = deserializeIdentities(serializedJson);
		expect(originItem).toEqual(testIdentities);
	});

	it('regroup the kusama paths', () => {
		const groupResult = groupPaths(kusamaPaths);
		expect(groupResult).toEqual([
			{
				paths: ['//kusama'],
				title: 'Kusama root'
			},
			{
				paths: ['//kusama//default'],
				title: '//default'
			},
			{
				paths: ['//kusama/softKey1'],
				title: '/softKey1'
			},
			{
				paths: ['//kusama//staking/1'],
				title: '//staking'
			},
			{
				paths: ['//kusama//funding/1', '//kusama//funding/2'],
				title: '//funding'
			}
		]);
	});

	it('regroup the unknown paths', () => {
		const unKnownPaths = [
			'//polkadot_test//default',
			'',
			'//custom',
			'/kusama',
			'/kusama/1',
			'/polkadot_test/1'
		];
		const groupResult = groupPaths(unKnownPaths);
		expect(groupResult).toEqual([
			{
				paths: [''],
				title: 'Identity root'
			},
			{
				paths: ['//custom'],
				title: '//custom'
			},
			{
				paths: ['/polkadot_test/1'],
				title: '/polkadot_test'
			},
			{
				paths: ['//polkadot_test//default'],
				title: '//polkadot_test'
			},
			{
				paths: ['/kusama', '/kusama/1'],
				title: '/kusama'
			}
		]);
	});

	it('get the path name', () => {
		paths.forEach((path, index) => {
			const name = getPathName(path, testIdentities[0]);
			expect(name).toEqual(expectNames[index]);
		});
	});

	it('get the correspond networkKeys', () => {
		const networkKeys = getExistedNetworkKeys(testIdentities[0]);
		expect(networkKeys).toEqual([
			EthereumNetworkKeys.FRONTIER,
			SubstrateNetworkKeys.KUSAMA,
			SubstrateNetworkKeys.WESTEND,
			UnknownNetworkKeys.UNKNOWN,
			SubstrateNetworkKeys.POLKADOT
		]);
	});

	it('get networkKey correctly by path', () => {
		const getNetworkKeyByPathTest = (path: string): string => {
			return getNetworkKeyByPath(path, testIdentities[0].meta.get(path));
		};
		expect(getNetworkKeyByPathTest('')).toEqual(UnknownNetworkKeys.UNKNOWN);
		expect(getNetworkKeyByPathTest('//kusama')).toEqual(
			SubstrateNetworkKeys.KUSAMA
		);
		expect(getNetworkKeyByPathTest('//kusama//funding/1')).toEqual(
			SubstrateNetworkKeys.KUSAMA
		);
		expect(getNetworkKeyByPathTest('//kusama//funding/2')).toEqual(
			SubstrateNetworkKeys.WESTEND
		);
		expect(getNetworkKeyByPathTest('1')).toEqual(EthereumNetworkKeys.FRONTIER);
	});

	it('group path under their network correctly, has no missing accounts', () => {
		const mockIdentity = testIdentities[0];
		const existedNetworks = getExistedNetworkKeys(mockIdentity);
		const existedAccountsSize = mockIdentity.meta.size;

		const allListedAccounts = existedNetworks.reduce(
			(acc: string[], networkKey: string) => {
				if (Object.values(EthereumNetworkKeys).includes(networkKey)) {
					//Get ethereum account into list
					const accountMeta = mockIdentity.meta.get(networkKey);
					if (accountMeta === undefined) return acc;
					acc.push(networkKey);
					return acc;
				} else {
					const networkAccounts = getPathsWithSubstrateNetworkKey(
						mockIdentity,
						networkKey
					);
					return acc.concat(networkAccounts);
				}
			},
			[]
		);
		expect(existedAccountsSize).toEqual(allListedAccounts.length);
	});

	it('decides account is only with hard derivation', () => {
		const testPath1 = '//only//hard//derivation//1';
		expect(isSubstrateHardDerivedPath(testPath1)).toBe(true);
		const testPath2 = '//soft/in//the//middle';
		expect(isSubstrateHardDerivedPath(testPath2)).toBe(false);
		const testPath3 = '//soft//in//the/end';
		expect(isSubstrateHardDerivedPath(testPath3)).toBe(false);
		const testPath4 = '/soft//in//the//start';
		expect(isSubstrateHardDerivedPath(testPath4)).toBe(false);
		const testEthereumPath = '1';
		expect(isSubstrateHardDerivedPath(testEthereumPath)).toBe(false);
		const testRootPath = '';
		expect(isSubstrateHardDerivedPath(testRootPath)).toBe(false);
	});
});
