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

import React, { useContext, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { RNCamera } from 'react-native-camera';

import Button from 'components/Button';
import { processBarCode } from 'modules/sign/utils';
import { onMockBarCodeRead } from 'e2e/injections';
import { SeedRefsContext } from 'stores/SeedRefStore';
import { NavigationAccountScannerProps } from 'types/props';
import colors from 'styles/colors';
import fonts from 'styles/fonts';
import ScreenHeading from 'components/ScreenHeading';
import { TxRequestData } from 'types/scannerTypes';
import { withAccountAndScannerStore } from 'utils/HOC';

type Frames = {
	completedFramesCount: number;
	isMultipart: boolean;
	missedFrames: number[];
	missingFramesMessage: string;
	totalFramesCount: number;
};

export function Scanner({
	navigation,
	accounts,
	scannerStore
}: NavigationAccountScannerProps<'QrScanner'>): React.ReactElement {
	const [seedRefs] = useContext<SeedRefsContext>(SeedRefsContext);
	const [enableScan, setEnableScan] = useState<boolean>(true);
	const [lastFrame, setLastFrame] = useState<null | string>(null);
	const [multiFrames, setMultiFrames] = useState<Frames>({
		completedFramesCount: 0,
		isMultipart: false,
		missedFrames: [],
		missingFramesMessage: '',
		totalFramesCount: 0
	});
	useEffect((): (() => void) => {
		const unsubscribeFocus = navigation.addListener('focus', () => {
			setLastFrame(null);
			scannerStore.setReady();
		});
		const unsubscribeBlur = navigation.addListener(
			'blur',
			scannerStore.setBusy.bind(scannerStore)
		);
		return (): void => {
			unsubscribeFocus();
			unsubscribeBlur();
			scannerStore.setReady();
		};
	}, [navigation, scannerStore]);

	useEffect(() => {
		const missedFrames = scannerStore.getMissedFrames();
		setMultiFrames({
			completedFramesCount: scannerStore.getCompletedFramesCount(),
			isMultipart: scannerStore.getTotalFramesCount() > 1,
			missedFrames,
			missingFramesMessage: missedFrames && missedFrames.join(', '),
			totalFramesCount: scannerStore.getTotalFramesCount()
		});
	}, [lastFrame, scannerStore.state.completedFramesCount, scannerStore]);

	function showErrorMessage(title: string, message: string): void {
		setEnableScan(false);
		scannerStore.setBusy();
		Alert.alert(title, message, [
			{
				onPress: async (): Promise<void> => {
					await scannerStore.cleanup();
					scannerStore.setReady();
					setLastFrame(null);
					setEnableScan(true);
				},
				text: 'Try again'
			}
		]);
	}

	async function onBarCodeRead(event: any): Promise<void> {
		if (event.type !== RNCamera.Constants.BarCodeType.qr) return;
		if (scannerStore.isBusy() || !enableScan) {
			return;
		}
		if (event.rawData === lastFrame) {
			return;
		}
		setLastFrame(event.rawData);
		await processBarCode(
			showErrorMessage,
			event as TxRequestData,
			navigation,
			accounts,
			scannerStore,
			seedRefs
		);
	}

	if (global.inTest && global.scanRequest !== undefined) {
		onMockBarCodeRead(
			global.scanRequest,
			async (tx: TxRequestData): Promise<void> => {
				await onBarCodeRead(tx);
			}
		);
	}
	const {
		completedFramesCount,
		isMultipart,
		missedFrames,
		totalFramesCount,
		missingFramesMessage
	} = multiFrames;
	return (
		<RNCamera
			captureAudio={false}
			onBarCodeRead={onBarCodeRead}
			style={styles.view}
		>
			<View style={styles.body}>
				<View style={styles.top}>
					<ScreenHeading title="Scanner" />
				</View>
				<View style={styles.middle}>
					<View style={styles.middleLeft} />
					<View style={styles.middleCenter} />
					<View style={styles.middleRight} />
				</View>
				{isMultipart ? (
					<View style={styles.bottom}>
						<Text style={styles.descTitle}>
							Scanning Multipart Data, Please Hold Still...
						</Text>
						<Text style={styles.descSecondary}>
							{completedFramesCount} / {totalFramesCount} Completed.
						</Text>
						<Button
							onPress={(): void => scannerStore.clearMultipartProgress()}
							title="Start Over"
							small
						/>
					</View>
				) : (
					<View style={styles.bottom}>
						<Text style={styles.descTitle}>Scan QR Code</Text>
						<Text style={styles.descSecondary}>To Sign a New Transaction</Text>
					</View>
				)}
				{missedFrames && missedFrames.length >= 1 && (
					<View style={styles.bottom}>
						<Text style={styles.descTitle}>
							Missing following frame(s): {missingFramesMessage}
						</Text>
					</View>
				)}
			</View>
		</RNCamera>
	);
}

export default withAccountAndScannerStore(Scanner);

const styles = StyleSheet.create({
	body: {
		backgroundColor: 'transparent',
		flex: 1,
		flexDirection: 'column'
	},
	bottom: {
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		flex: 1,
		justifyContent: 'center',
		paddingHorizontal: 15
	},
	descSecondary: {
		color: colors.text.main,
		fontFamily: fonts.bold,
		fontSize: 14,
		paddingBottom: 20
	},
	descTitle: {
		color: colors.text.main,
		fontFamily: fonts.bold,
		fontSize: 18,
		paddingBottom: 10,
		textAlign: 'center'
	},
	inactive: {
		backgroundColor: colors.background.app,
		flex: 1,
		flexDirection: 'column',
		padding: 20
	},
	middle: {
		backgroundColor: 'transparent',
		flexBasis: 280,
		flexDirection: 'row'
	},
	middleCenter: {
		backgroundColor: 'transparent',
		borderWidth: 1,
		flexBasis: 280
	},
	middleLeft: {
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		flex: 1
	},
	middleRight: {
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		flex: 1
	},
	progress: {
		alignItems: 'center',
		justifyContent: 'center'
	},
	top: {
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		flexBasis: 80,
		flexDirection: 'row',
		justifyContent: 'center'
	},
	view: {
		backgroundColor: 'black',
		flex: 1
	}
});
