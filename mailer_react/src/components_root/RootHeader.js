import HeaderElement from './HeaderElement';

export default function RootHeader (props) {

    return (<div className='root_header'>
        <div className='root_header_content'>
            <HeaderElement name="home" text="Home" />
            <HeaderElement name="extra" text="Extra" />
            <HeaderElement name="aliases" text="Aliases" />
        </div>
    </div>)

}
