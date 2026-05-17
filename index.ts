import { registerRootComponent } from 'expo';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { createElement } from 'react';

import App from './App';

function Root() {
  return createElement(AppErrorBoundary, null, createElement(App));
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(Root);
