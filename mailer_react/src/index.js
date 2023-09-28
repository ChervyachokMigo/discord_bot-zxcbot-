//import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css'; 
import AppMail from './AppMail';
import AppRoot from './AppRoot';
import AppTest from './AppTest';

const root = createRoot(document.getElementById('root'));

const location = window.location.host.split('.');

switch(location[0]){
  case window.location.host.replace('.ru', ''):
    root.render(
      <div className='body_root'>
        <AppRoot />
      </div>
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

