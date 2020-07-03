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

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import testIDs from '../../test/e2e/testIDs';
import fontStyles from '../styles/fontStyles';
import { Identity, PathGroup } from '../types/identityTypes';
import { SubstrateNetworkParams } from '../types/networkSpecsTypes';
import { removeSlash } from '../utils/identitiesUtils';

import PathCard from './PathCard';
import Separator from './Separator';

import { useSeedRef } from 'utils/seedRefHooks';
import { unlockSeedPhrase } from 'utils/navigationHelpers';
import { alertPathDerivationError } from 'utils/alertUtils';
import { RootStackParamList } from 'types/routes';
import type AccountsStore from 'stores/AccountsStore';
import Button from 'components/Button';

type Props = {
	accounts: AccountsStore;
	currentIdentity: Identity;
	pathGroup: PathGroup;
	networkParams: SubstrateNetworkParams;
};

export default function PathGroupCard({
	currentIdentity,
	pathGroup,
	networkParams,
	accounts
}: Props): React.ReactElement {
	const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
	const [paths, setPaths] = useState<string[]>(pathGroup.paths);
	const { isSeedRefValid, substrateAddress } = useSeedRef(
		currentIdentity.encryptedSeed
	);

	const _getFullPath = (index: number, isHardDerivation: boolean): string =>
		`//${networkParams.pathId}${pathGroup.title}${
			isHardDerivation ? '//' : '/'
		}${index}`;
	const _getNextIndex = (isHardDerivation: boolean): number => {
		let index = 0;
		while (paths.includes(_getFullPath(index, isHardDerivation))) {
			index++;
		}
		return index;
	};

	const _addDerivationPath = async (
		isHardDerivation: boolean
	): Promise<void> => {
		await unlockSeedPhrase(navigation, isSeedRefValid);
		const nextIndex = _getNextIndex(isHardDerivation);
		const nextPath = _getFullPath(nextIndex, isHardDerivation);
		const name = removeSlash(`${pathGroup.title}${nextIndex}`);
		try {
			await accounts.deriveNewPath(
				nextPath,
				substrateAddress,
				networkParams.genesisHash,
				name,
				''
			);
			const newPaths = paths.concat(nextPath);
			setPaths(newPaths.sort());
		} catch (error) {
			alertPathDerivationError(error.message);
		}
	};

	const headerTitle = removeSlash(pathGroup.title);
	const headerCode = `//${networkParams.pathId}${pathGroup.title}`;
	return (
		<View key={`group${pathGroup.title}`} style={{ marginTop: 24 }}>
			<Separator shadow={true} style={styles.separator} />
			<View style={styles.header}>
				<View style={styles.headerText}>
					<Text style={fontStyles.t_prefix}>{headerTitle}</Text>
					<Text style={fontStyles.t_codeS}>{headerCode}</Text>
				</View>
				<View style={styles.derivationButtonContainer}>
					<Button
						title={'+ hard'}
						textStyles={fontStyles.t_code}
						style={styles.derivationButton}
						onPress={(): any => _addDerivationPath(true)}
					/>
					<Button
						title={'+ soft'}
						textStyles={fontStyles.t_code}
						style={styles.derivationButton}
						onPress={(): any => _addDerivationPath(false)}
					/>
				</View>
			</View>
			{paths.map(path => (
				<PathCard
					key={path}
					testID={testIDs.PathsList.pathCard + path}
					identity={currentIdentity}
					path={path}
					onPress={(): void => navigation.navigate('PathDetails', { path })}
				/>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	derivationButton: {
		backgroundColor: 'black',
		marginHorizontal: 0,
		marginVertical: 0,
		paddingHorizontal: 10
	},
	derivationButtonContainer: {
		flexDirection: 'row'
	},
	derivationButtonText: {
		fontSize: 16
	},
	header: {
		flexDirection: 'row',
		paddingHorizontal: 16
	},
	headerText: {
		flexGrow: 1,
		marginVertical: 16
	},
	separator: {
		height: 0,
		marginVertical: 0
	}
});