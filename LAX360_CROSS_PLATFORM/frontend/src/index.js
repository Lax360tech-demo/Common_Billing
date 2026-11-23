import { AppRegistry } from 'react-native';
import App from '../App';

AppRegistry.registerComponent('LAX360', () => App);

const rootTag = document.getElementById('root');
if (rootTag) {
  AppRegistry.runApplication('LAX360', {
    rootTag
  });
}
