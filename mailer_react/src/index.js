//import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './src/styles.scss'; 
import AppMail from './AppMail';
import AppRoot from './AppRoot';
import AppTest from './AppTest';
import { HoverElementProvider, SelectedHeaderProvider } from './components_root/RootContexts';

const root = createRoot(document.getElementById('root'));

const location = window.location.host.split('.');

switch(location[0]){
  case window.location.host.replace('.ru', ''):
    root.render(
        <HoverElementProvider>
          <SelectedHeaderProvider>
            <AppRoot />
          </SelectedHeaderProvider>
        </HoverElementProvider>
    );
  break;

  case 'mail': 
    root.render(
      <div className='body_mail'>
        <AppMail />
      </div>
    );
  break;

  case 'test':
    root.render(
      <AppTest />
    );
  break;

  default:
    root.render(
      <div>
        unknown page
      </div>
    );
  break;
}

