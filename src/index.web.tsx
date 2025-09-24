import { AppRegistry } from 'react-native';
import AppWrapper from '../AppWrapper';

AppRegistry.registerComponent('RideTheBus', () => AppWrapper);

AppRegistry.runApplication('RideTheBus', {
	initialProps: {},
	rootTag: document.getElementById('root'),
});
