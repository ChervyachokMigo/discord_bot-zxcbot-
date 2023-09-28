import {AuthedProvider, TokenProvider} from './components/Contexts'
import Mail from './Mail';

export default function AppMail () {

    return (

    <AuthedProvider>
      <TokenProvider>
        <Mail />
      </TokenProvider>
    </AuthedProvider>
    )
    
}
