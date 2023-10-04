import Auth from "./components_control/Auth";
import {AuthedProvider, TokenProvider} from './components_control/ControlContexts'
import ControlPanel from "./components_control/ControlPanel.js"

export default function AppControl () {

    return (

    <div><header>Control Panel</header>
      <AuthedProvider>
        <TokenProvider>

          <Auth />
          <ControlPanel />
      
        </TokenProvider>
      </AuthedProvider>
        
    </div>
    )
    
}
