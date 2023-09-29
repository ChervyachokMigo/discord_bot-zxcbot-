import {AuthedProvider, TokenProvider, QueryProvider} from './components_mail/MailContexts'
import Mail from './Mail';

export default function AppMail () {

    return (

    <AuthedProvider>
      <TokenProvider>
        <QueryProvider>
          <Mail />
        </QueryProvider>
      </TokenProvider>
    </AuthedProvider>
    )
    
}
